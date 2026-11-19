# Patching confirmed findings

## Contents

- Guard rails
- Inputs and modes
- Patch brief
- Independent review
- Verification ladder
- Reviewing a generated patch
- When the fix is a migration
- Output shapes

## Guard rails

- A patch is an inert diff for human review. This method does not apply one, so no `git apply`, no `patch` and no edit of target source. The capability is left out by design, so that it cannot be prompt-injected into use, and a step that seems to need it is wrong.
- Write only `./PATCHES/`, `./PATCHES.md` and `./PATCHES.json` in the working directory. Because no diff is applied, nothing is committed or pushed either. Applying and upstreaming a fix is the human's move, after the review described below.
- Static mode builds, runs and installs nothing and does not use the network. Execution-verified mode applies diffs and runs target code only inside the pipeline's own sandboxed containers, so do not offer to apply a diff anywhere else.

## Inputs and modes

- Inputs, in priority order, are `TRIAGE.json`, `VULN-FINDINGS.json`, `INCIDENTS.json`, a pipeline results directory, then generic JSON with a top-level list or a `findings`, `results`, `issues` or `vulnerabilities` array.
- `TRIAGE.json` is the canonical input, so read `.findings[]` and keep only `verdict == "true_positive"`. Patching unverified findings spends effort on false positives, so with `VULN-FINDINGS.json` or `INCIDENTS.json` warn that the findings have not been triaged, then continue.
- `INCIDENTS.json` gives one finding per `.incidents[]` entry, with `vuln.file`, `vuln.line` and `vuln.type` mapped to `file`, `line` and `category`, and `vuln.mechanism` plus `impact` to `description`. Keep `poc`, because the `poc.command` of a `confirmed_exploited` incident is the regression check for its fix. The top-level `ruled_out` array is not findings.
- Pipeline results give one finding per `reports/bug_NN/`. Map `report.json` to `description`, `crash.crash_type` to `category` and the ASAN top frame to `file` and `line`, and keep `NN` as the bug number.
- Generic input accepts the aliases in parentheses after each canonical name, `file` (`path`, `location.file`, `filename`), `line` (`line_number`, `location.line`, `lineno`), `category` (`type`, `cwe`, `rule_id`, `crash_type`), `severity` (`severity_rating`, `level`, `priority`), `title` (`name`, `summary`, `message`), `description` (`details`, `report`, `body`, `evidence`, `rationale`), `recommendation` (`fix`, `remediation`, `mitigation`) and `owner_hint` (`owner`, `component`).
- Keep the ids of `TRIAGE.json`, and otherwise number `f001`, `f002` in ingest order. To patch a subset, take one finding by `id`, or the top N by `severity` (`HIGH`, `MEDIUM`, `LOW`) and then `confidence` descending. A finding without a `file` is skipped with the reason `no source location`. If none of the cited files resolves under the codebase root, stop.
- Execution-verified mode applies when the input is a directory containing `reports/manifest.jsonl`, `found_bugs.jsonl` or `run_*/result.json`, unless an `INCIDENTS.json` is present anywhere in it, because detection-and-response run directories also contain `run_*/result.json` and their incidents are patched statically. Static mode applies to everything else. It has no proof of concept, so its oracle is a fresh-context reviewer.
- Execution-verified mode delegates to the upstream pipeline, which already implements the ladder with executable oracles, and does not reimplement it. Run `vuln-pipeline patch <results_dir> --model <model> [--bug N]` through the harness's sandbox launcher as `bin/vp-sandboxed patch`.
- The target's `config.yaml` needs a `build_command` and optionally a `test_command`. A failed run of the command is recorded as that finding's `error`, and the other findings continue. If the pipeline command is not available at all, stop and tell the user rather than falling back to static mode silently.

## Patch brief

- Static mode runs one patch pass per finding. The pass has read-only access and returns the diff as text, which you write to `./PATCHES/bug_NN/patch.diff`.

```text
You are conducting authorized security research as part of a defensive assessment. Write a candidate fix for one verified vulnerability finding in a codebase you have read-only access to.
Use Read, Glob and Grep only on paths inside {REPO_PATH}. Do not build, run, install, edit files on disk or reach the network. Emit the fix as a unified diff in your final response. Do not apply it.
Finding: id {id}, {file}:{line}, category {category}, severity {severity}, title {title}, then the description and the recommendation or "(none provided)".
1. Read the code. Open {file} at line {line} and the surrounding function. Do not trust the finding's description as the only source.
2. Root cause first. Trace backward from the cited sink to where the bad value or the missing check originates. The fix usually belongs there, not at the line the scanner flagged. Name the root-cause location (file:line).
3. Variant hunt. Grep for sibling call sites with the same pattern. Your fix covers all of them, or your rationale says why not.
4. Minimal diff. The smallest change that fixes the root cause. No refactoring, drive-by cleanup, reformatting or comment-only changes. Match the surrounding style (brace placement, naming, error handling).
5. Adversarial self-check. Re-read your diff as an attacker and name one input variation that would reach the same bad state without tripping your change. If you can name one, the fix is at the wrong layer. Go back to step 2.
6. Regression test. Add to the diff one test case that fails before your change and passes after it, placed where the project keeps its tests (test_*/, *_test.*, tests/, spec/). If no test directory exists, omit the test and say so in <test_note>.
Your final response contains exactly these tags. Emit the diff verbatim, not wrapped in a code fence.
<patch_diff>the unified diff, with --- a/path/to/file and +++ b/path/to/file headers</patch_diff>
<rationale>what changed and why, mechanically: file:line of the root cause, what the change enforces</rationale>
<variants_checked>file:function pairs you grepped for the same pattern, and whether each needed the fix</variants_checked>
<bypass_considered>the input variation you tried in step 5 and why it no longer reaches the bad state</bypass_considered>
<test_note>where the regression test landed, or why none was added</test_note>
If the finding is not fixable as described (wrong file, code already patched, false positive), emit <patch_diff>NONE</patch_diff> and a <rationale> that says why no patch is appropriate.
```

- `NONE` or an empty `<patch_diff>` gives `status: "no_patch"`. In a subagent's answer tolerate stray code fences and HTML-escaped entities (`&lt;`, `&gt;`, `&amp;`), and unescape them before writing the diff.

## Independent review

- Static mode runs one review pass per generated diff. The reviewer gets only `file`, `line`, `category` and the diff, and re-derives from the source whether the diff is a minimal, in-scope fix.
- The reviewer does not see the finding's `description`, `recommendation` or `exploit_scenario`, or the patch author's rationale. Target source can contain injected instructions that survive into a scanner's `description`. The author has to read that prose and the reviewer does not, so injected text cannot pass its own gate.

```text
You are reviewing a candidate security patch as a maintainer would. You have read-only access to the unpatched source at {REPO_PATH}. Use Read, Glob and Grep. Do not build, run or apply the diff.
You have not seen the scanner's description of the vulnerability or the patch author's reasoning. Work only from the location, the category and the diff.
Location: {file}:{line}. Category: {category}.
Diff under review: {the diff text, or for a diff over about 50 lines the instruction to read ./PATCHES/bug_NN/patch.diff}
1. Scope. Does the diff touch only files and functions on the path between {file}:{line} and its callers? List any hunk that falls outside that path.
2. Suppression. Does the diff fix a root cause, or does it suppress the symptom (try/except: pass, early return on a magic value, deleting the check that fired, lowering a log level)?
3. New surface. Does the diff add parsing, trust a new input field, weaken validation elsewhere or remove a security-relevant check?
4. Style, 0-10: would you merge this as-is? 0-3 wrong layer or suppression. 4-6 correct but noisy. 7-10 minimal, targeted, matches surrounding style.
End your response with exactly:
  REVIEW: ACCEPT | REJECT
  STYLE_SCORE: <0-10>
  OUT_OF_SCOPE_HUNKS: <comma-separated file:line, or none>
  REASON: <2-4 sentences citing specific diff hunks and source lines>
ACCEPT requires: in scope, root-cause fix, no new attack surface, style >= 5. Otherwise REJECT.
```

- Attach `review`, `style_score`, `out_of_scope_hunks` and `review_reason`. Every static result gets `verified: "static_review_only"`, accepted or rejected. Static mode does not iterate, so a rejected diff stays in the output, marked as rejected.

## Verification ladder

- In execution-verified mode a patch agent works in a sandboxed container with the source, the proof of concept, the reproduction command and the ASAN trace. It works like the static patch pass (root cause first, variant hunt, minimal diff, adversarial self-check) but executes. It reproduces the crash first, and before it hands over the diff it rebuilds, reruns the proof of concept and runs the test suite if there is one.
- A grader then runs in a second container, created fresh from the same image, and only the diff crosses. The grader does not see the patch agent's reasoning, so it cannot be talked into approving a bad fix. It applies the diff and climbs the tiers in order, stopping at the first failure.

| Tier | Question | Oracle | Field in `verdict` |
|---|---|---|---|
| Build | Does the patched tree compile? | `git apply` plus `build_command` exit code | `t0_builds` |
| Reproduce | Is the original crash gone? | Exit 0 and no `AddressSanitizer:` in the output | `t1_poc_stops` |
| Regress | Did it break existing behavior? | `test_command` exit code, skipped if none | `t2_tests_pass` |
| Re-attack | Root cause gone, or just this input? | A fresh 50-turn find agent attacks the patched binary, and ASAN decides | `re_attack_clean` |
| Style | Would a maintainer accept it? | Model judge, 0-10, enabled with `--style`, advisory only and not a gate | `t3_style_score` |

- Every gating tier is an executable oracle, so no patch fails on model judgment. A patch passes when build and reproduce are true and neither regress nor re-attack is false. `t2_tests_pass` is `null` without a test suite, and `re_attack_clean` is `null` when the tier was skipped with `--no-reattack`.
- For re-attack the grader snapshots its patched container as a temporary image and starts the find agent from it, told to probe for a variant input that reaches the same root cause despite the fix. Any crash fails the tier.
- Re-attack exists because compiling and stopping the one proof of concept is easy. Published evaluations of model-generated security patches show about 60% passing build-and-reproduce checks and under 15% surviving fuzzing and differential testing. The dominant failure is a bounds check at the crash site that leaves the bad value reachable from a slightly different input.
- Regress runs the project's existing suite and does not write a test for the bug being fixed. Static mode covers that with the regression test inside the diff.
- When a tier fails, its evidence (compiler error, ASAN trace, test output) goes into the next attempt's prompt, up to `--max-iterations` attempts (default 5) of `--max-turns` turns each (default 200). The retry tells the agent to address that failure specifically. If re-attack found a variant, the fix is at the wrong layer and has to move upstream.
- A passed ladder proves that the specific crash is fixed. It does not prove that the root cause is addressed or that the diff introduced no new problem, because no tier reviews the diff semantically for new vulnerabilities or for logic changes outside the fix.
- A re-attack pass is a helpful signal, not proof. It discriminates well when a bypass input can be constructed within 50 turns and can miss wrong-layer fixes whose bypass is harder to construct. To raise confidence in one fix, raise `REATTACK_MAX_TURNS` in the harness's `harness/patch_grade.py` and rerun that bug.
- A target that cannot be driven as `./binary <input>` names a driver script in `reattack_harness:` of its `config.yaml`. The script runs every file under `/poc/` with fresh state and exits `1` if any crashes the target (printing the sanitizer trace), `0` if none does and `2` if the target could not be launched.

## Reviewing a generated patch

- Whatever verified it, `patch.diff` is a strong draft that a human reads before it goes anywhere, for scope creep, suppression and new attack surface as in the review brief.
- A correct diagnosis can still get the wrong fix, a narrow patch in the right module that breaks something else. Generated patches tend to be as restrictive as possible, to the point of blocking legitimate input or cutting the connection to a dependent service.
- Run two cheap checks before upstreaming, each in a fresh session on the final `patch.diff`. Ask to "name one input variation that reaches the same bad state without tripping the patch's checks". Then ask only to "simplify to the smallest change that fixes the root cause", because the author's idea of minimal is anchored to the finding it just reasoned through.
- For a static patch, the person who applies the diff runs its regression test, which must fail on the current code and pass with the fix. Without a failing-then-passing test nothing proves the bug was real, and the fix can regress unnoticed.
- When a sound diff cannot be applied as it is, for example because of style conventions the model does not know, have the model write a precise prompt for the change instead, naming the new control flow, the invariant to enforce and where. Whoever works on that codebase implements it, and a human reviews the logical change in between.
- For complex fixes give the patch pass a bailout. When the change touches more than N files or its own confidence is low, it escalates to a human with the analysis and emits no diff.

## When the fix is a migration

A finding can be a pattern, such as the same unsafe call at dozens of call sites, too much for one pull request. This workflow edits and runs code, so it starts only when the user asks for it.

1. Research. Read the finding and the codebase and write a migration plan that names the unsafe pattern, the safe replacement and the call sites.
2. Turn the plan into tests, one per call site, that fail now and pass once that site is migrated. The suite plays the role ASAN plays in the pipeline, the check that decides when the work is done.
3. Split into tickets by grouping the tests into chunks that can be merged independently and are small enough to review.
4. Patch in parallel, with one worker per ticket in its own git worktree, looping until its tests and the project's existing tests pass.
5. Gate before the pull request. Each worker's diff passes the tests, an independent bug sweep and a code review by an agent given no tools, plus the checks the project already requires. A human reviews the pull request.

## Output shapes

- Both modes write `./PATCHES/bug_NN/patch.diff` and `./PATCHES/bug_NN/patch_result.json`, so that consumers need not care which mode ran, plus `./PATCHES.json` and `./PATCHES.md`. `NN` is the zero-padded index of the finding in sorted order, starting at `bug_00`, or the pipeline's bug number.
- `patch_result.json` holds one entry of `findings` below. `verdict` exists only in execution-verified mode, where it is copied together with `rationale` from the pipeline's `reports/bug_NN/patch_result.json`, the diff is copied from `reports/bug_NN/patch.diff`, and `verified` is `ladder_passed` when `verdict.passed` is true and `ladder_failed` otherwise. `review` is `null` there, because the ladder is the verifier.

```json
{ "patch_completed": true, "mode": "exec" | "static", "repo": "...",
  "summary": {"input_count": 0, "patched": 0, "no_patch": 0, "accepted": 0, "rejected": 0, "ladder_passed": 0},
  "findings": [{
    "id": "f003", "source": "TRIAGE.json#2", "title": "...", "file": "...", "line": 0, "category": "...", "severity": "HIGH", "owner_hint": "...",
    "mode": "exec" | "static", "verified": "ladder_passed" | "ladder_failed" | "static_review_only",
    "review": "ACCEPT" | "REJECT" | null, "style_score": 0, "out_of_scope_hunks": [],
    "rationale": "...", "variants_checked": "...", "bypass_considered": "...", "test_note": "...", "review_reason": "...",
    "verdict": {"t0_builds": true, "t1_poc_stops": true, "t2_tests_pass": null, "re_attack_clean": true, "t3_style_score": null, "evidence": {}, "timings": {}, "passed": true}
  }] }
```

- `verified` names the verification class, not pass or fail. `ladder_passed` and `ladder_failed` mean that ASAN decided, and `static_review_only` means that an agent read the diff. Downstream tooling branches on this field, not on `review`.
- The pipeline's own `reports/bug_NN/patch_result.json` holds only `verdict`, `rationale`, `variants_checked`, `bypass_considered`, `iterations` and `timings`, and has no `verified` field. `verdict.evidence` holds the output excerpt of a failed tier.
- `PATCHES.md` opens with `# Candidate Patches` and a banner for the mode. In static mode the banner says the diffs were authored and reviewed by independent agents reading source and were not compiled, run or re-attacked. In execution-verified mode it says each diff passed or failed the ladder, which proves the crash is gone, not that the diff introduces no new problems.
- One section per finding follows, accepted and ladder-passed first, then by severity, headed `## bug_{NN}: [{severity}] {title}  ({id})`, with location, category, owner, `verified` status, review verdict, style score, diff path with hunk and line counts, rationale, variants checked, bypass considered, and any rejection reason and out-of-scope hunks. A closing `## Skipped` table lists the findings without a `file` or a patch, each with its reason.

Source: adapted from `.claude/skills/patch/SKILL.md`, `.claude/skills/patch/README.md`, `docs/patching.md`, `docs/best-practices.md`, `docs/blog-post.md`, `docs/security.md`, `CLAUDE.md`, `harness/prompts/patch_prompt.py`, `harness/patch.py`, `harness/patch_grade.py` and `harness/artifacts.py` of anthropics/defending-code-reference-harness (commit d3bea6b, Apache-2.0).
