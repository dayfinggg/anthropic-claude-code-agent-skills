# Triaging raw findings

## Contents

- Ground rules and context
- Input shapes and normalized fields
- Deduplication
- Verification
- Ranking by exploitability
- Routing to an owner
- Organization-specific false-positive rules
- TRIAGE.json and TRIAGE.md
- Design notes

## Ground rules and context

- Triage turns raw findings from any scanner into a short list that is verified, deduplicated, ranked and owned. The phases run in this order: ingest, deduplicate, verify, rank, route, write `./TRIAGE.json` and `./TRIAGE.md`. Each pass is a brief for a fresh subagent or a separate step you run yourself, and `SKILL.md` says which applies.
- Triage never executes target code: no build, run, test, dependency install or request to a running instance. A proof of concept that accidentally works against something real is unacceptable, and failing to write one is weak evidence that a finding is not exploitable. Every conclusion comes from reading source, and every brief says so.
- Triage never uses the network: no package-registry lookups, CVE-database queries or upstream-commit fetches. They would help ranking but end the property that triage can run in an air-gapped review box beside a read-only checkout.
- Four values shape verification and ranking and are recorded in `triage_context`. Take `environment` and `threat_model` from `THREAT_MODEL.md` when the project has one, so that triage judges against the same threat model as discovery. Ask the user for the rest in one batch (`mode: interactive`), or use the defaults when unattended (`mode: auto`).
- `environment`: the kind of system and where untrusted input enters it. Reachability is judged against this boundary: command injection from an environment variable is a true positive in a multi-tenant web service and an exclusion-rule-8 false positive in an operator CLI. Default: `Unknown. Treat any externally-reachable entry point as untrusted; flag trust-boundary assumptions explicitly in rationale.`
- `threat_model`: what a worst-case attacker looks like and what must not happen, as a list such as "unauthenticated remote code execution" or "tenant-to-tenant data leakage". Default: empty, which means no severity boost.
- `scoring`: derived `HIGH`/`MEDIUM`/`LOW` from preconditions (the default), a CVSS v3.1 or v4.0 vector plus base score, OWASP Risk Rating (likelihood x impact), or an organization bug bar that the user describes. It only controls what `severity_label` shows. The precondition rule is always computed and always decides the sort order.
- `noise_tolerance`: how a split vote is settled, one of `precision` (the default), `recall` and `ask`.

## Input shapes and normalized fields

The input is a JSON or JSONL file, a directory (search it for `**/*.json` and `**/*.jsonl`) or a Markdown report. If nothing parseable is found, stop and report what was seen. Shapes are recognized in this order:

1. `VULN-FINDINGS.json`: read `.findings[]`.
2. `INCIDENTS.json`: one finding per `.incidents[]` entry. Map `vuln.file` to `file`, `vuln.line` to `line`, `vuln.type` to `category`, `vuln.function` to `function`, and `vuln.mechanism` plus `impact` to `description`. Keep `id`, `title`, `verdict` and `poc`. A `confirmed_exploited` verdict means the incident arrived execution-verified, not statically guessed, and verifiers weigh that. The top-level `ruled_out` array is not findings.
3. Pipeline reports, `reports/bug_*/report.json` or `reports/manifest.jsonl`: one finding per `bug_NN`. Map `crash.crash_type` to `category`, `verdict.severity_rating` to `severity`, the prose `report` to `description`, and the ASAN top frame to `file` and `line`.
4. `found_bugs.jsonl`: one finding per line.
5. Any other `*.json` whose top level is a list of objects, or an object with a `findings`, `results`, `issues` or `vulnerabilities` array.
6. Markdown or text: split on level-2 and level-3 headings or `---` rules, and extract `file`, `line`, `category`, `severity` and `description` by pattern (`File:`, `Line:`, `Severity:` labels or `path:NN` spans). This is best effort, so mark `source_format: "markdown_heuristic"`.

Normalize every record to the canonical fields. Pull what is present and do not guess what is absent: list absent canonical fields in `missing_fields`.

| Canonical | Also accept | Canonical | Also accept |
|---|---|---|---|
| `file` | `path`, `location.file`, `filename`, ASAN top-frame file | `description` | `details`, `report`, `body`, `evidence` |
| `line` | `line_number`, `location.line`, `lineno` | `exploit_scenario` | `attack_scenario`, `poc`, `reproduction` |
| `category` | `type`, `cwe`, `rule_id`, `crash_type`, `vulnerability_class` | `preconditions` | `requirements`, `assumptions` |
| `severity` | `severity_rating`, `level`, `priority`, `risk` | `recommendation` | `fix`, `remediation`, `mitigation` |
| `title` | `name`, `summary`, `message` | `scanner_confidence` | `confidence`, `score`, `certainty` (normalize to 0.0-1.0) |

- `id` is `f001`, `f002` and so on in ingest order, and `source` names the input file and the finding's place in it, as in `VULN-FINDINGS.json#0`. When most findings carry `scanner_confidence`, ingest in descending order of it, so that high-signal findings are verified first. It is a scheduling prior only and does not affect verdicts.
- Resolve paths with the first 5 findings that have a `file`. Try the path under the codebase root as given, then as an absolute or working-directory-relative path, then under the root with a common prefix stripped (`src/`, `app/`, `./` or the root's own basename). Apply the variant that worked to every finding. If none works, stop and say that verification needs source access to the cited files.
- A finding whose `file` is missing or does not resolve is unlocatable. It takes no part in deduplication, where it neither absorbs nor is absorbed, or in verification, and it gets no confident verdict. It is emitted with `verdict: false_positive`, `verify_verdict: needs_manual_test`, `confidence: 0`, `refute_reasons: ["doesnt_exist"]` and the rationale `no source location in input; cannot verify statically; human review required`.

## Deduplication

- Two findings are duplicates if fixing one would also fix the other. They are distinct if their root causes are independent, even when they share a category, a crash class or a file.
- Deduplication runs before verification, so that duplicates do not each cost a full set of verifier votes. On input from several scanners this often cuts verification cost by a factor of 2 to 4, for the price of one cheap pass.
- Deterministic pass: cluster findings that have the same `file` after path normalization, the same `category` (case-insensitive, punctuation stripped) and `line` numbers within 10 of each other. Two findings without a line match. A finding without a line does not match one with a line, so that a line-less record cannot absorb a located one.
- In each cluster the canonical finding is the one with the fewest `missing_fields`, and a tie goes to the lowest `id`. In both passes a duplicate gets `verdict: duplicate` and `duplicate_of: <canonical id>`, and its canonical lists it in `absorbed`.
- Semantic pass: one pass over the survivors, run only when more than one is left. It sees one line per finding, `id | file:line | category | title`, which is enough to cluster and not enough to leak one scanner's reasoning into another finding's verification. It answers only with lines `GROUP: <canonical_id> <- <dup_id>, <dup_id>`, one per group that has duplicates, with the most specific or best-described finding as canonical.
- The semantic pass treats as duplicate: the same root cause worded differently or reported by different scanners, a shared vulnerable helper reported once per call site, a missing global protection (auth check, output encoding) reported once per endpoint that lacks it, and a cause ("missing input validation on `name`") with its consequence ("SQL injection via `name`") in the same code path.
- It treats as distinct: different categories in the same file region (an SSRF near a buffer overflow is not a duplicate because the lines are close), the same file and category with different tainted variables reaching different sinks, two independent bugs inside one helper, and two endpoints missing the same check where the fix is per endpoint and not a shared gate.

## Verification

- Each surviving finding goes to independent verifiers whose stance is "find any reason this is wrong". A verifier starts in a fresh context, never as a fork of your session, and receives only the brief below, filled in for one finding. A verifier that shares context with the finder, with other findings or with other verifiers tends to agree instead of testing the claim, and shared context propagates blind spots.
- Run in your own context, the brief is one separate step per finding and counts as one vote, because further votes from the same context are not independent.

```text
You are a skeptical security engineer adversarially verifying one finding from an automated scanner. Your default assumption is that the scanner is wrong. Re-derive the claim from the source code yourself and decide TRUE_POSITIVE or FALSE_POSITIVE.
You have read-only access to the codebase at {REPO_PATH}. Use Read, Glob and Grep only inside it: anything outside (scanner output, fixtures, other repositories) is out of scope, and citing it contaminates your verdict. If the finding's file resolves outside it, return CANNOT_VERIFY with REFUTE_REASON: doesnt_exist. Do not build, run or test the target, install dependencies or reach the network. Every conclusion comes from reading source under {REPO_PATH}.
ENVIRONMENT (from the operator, defines the trust boundary): {environment}
Procedure. Follow all four steps, because skipping one lets a specific class of false positive through.
1. Read {file} at line {line} yourself and understand what the code does. Do not trust the scanner's description: scanners misread code surprisingly often, and starting from the summary inherits the misreading.
2. Trace reachability backwards from the sink. Grep for callers and follow imports until you know whether attacker-controlled input (per ENVIRONMENT) reaches this line. A plausible-sounding chain is not enough: read the actual call site of at least the first link and quote its file:line. Unreachable code is the single largest source of false positives.
3. Hunt for protections, which are reasons the finding is wrong: input validation or sanitization upstream of the sink, framework auto-escaping, parameterized queries, prepared statements, type constraints (the value is an int, an enum, a fixed-length token), authentication or authorization gates before this path, configuration that limits exposure (feature flag off, debug-only), dead code, test-only code, example or fixture code.
4. Stress-test each protection: is it applied on every path to the sink, or only on the one the scanner traced? Do encodings, edge cases or alternate entry points bypass it?
Exclusion rules. A finding that matches one is FALSE_POSITIVE even if technically accurate. Cite the rule number.
 1. Volumetric DoS or missing rate-limiting (handled at infrastructure layer). ReDoS, algorithmic complexity and unbounded recursion are still valid findings.
 2. Test-only code, dead code, example/fixture code, or a crash with no security impact.
 3. Behavior that is the intended design (compression middleware, a backward-compatible weak algorithm offered alongside a strong one).
 4. Memory-safety concerns in memory-safe languages outside `unsafe` / FFI blocks.
 5. SSRF where the attacker controls only the path, not the host or protocol.
 6. User input flowing into an AI/LLM prompt (prompt injection is not a code vulnerability in the target).
 7. Path traversal in object storage (S3/GCS) where `../` does not escape a trust boundary.
 8. Trusted inputs used as the attack vector (env vars, CLI flags set by the operator), unless ENVIRONMENT marks them untrusted.
 9. Client-side code flagged for server-side vulnerability classes.
10. Outdated dependency versions (managed by a separate process).
11. Weak random used for non-security purposes (jitter, shuffling, dev-only fallbacks).
12. Low-impact nuisance issues (log spoofing, CSRF on logout, self-XSS, tabnabbing, open redirect, regex injection).
13. Missing hardening or best-practice gap with no concrete exploit path (missing security headers, no audit logging, permissive config that isn't actually reached by untrusted input).
14. XSS in a framework with default auto-escaping (React, Angular, Vue, Jinja2 autoescape=on), unless the sink is a raw-HTML escape hatch (dangerouslySetInnerHTML, bypassSecurityTrustHtml, v-html, |safe).
15. Identifiers that are unguessable by construction (UUIDv4, 128-bit+ random tokens) flagged as "predictable" or "needs validation".
16. Race conditions or TOCTOU that are theoretical only: no realistic window, or no security-relevant state changes between check and use.
{organization rules, verbatim, under the heading "ORG-SPECIFIC RULES:"}
End your response with exactly this block:
  VERDICT: TRUE_POSITIVE | FALSE_POSITIVE | CANNOT_VERIFY
  CONFIDENCE: <0-10>
  REFUTE_REASON: <one of: doesnt_exist, already_handled, implausible_trigger, intentional_behavior, misread_code, duplicate, not_actionable, n/a>
  EXCLUSION_RULE: <1-16, org rule, or none>
  FIRST_LINK: <file:line of the first call site you read, or "none found">
  RATIONALE: <2-5 sentences citing file:line evidence for reachability, protections found or absent, and why each held or didn't>
TRUE_POSITIVE requires all of: reachable from untrusted input per ENVIRONMENT, protections insufficient or bypassable, real-world exploitation feasible.
FALSE_POSITIVE requires any of: unreachable from untrusted input, adequately protected on all paths, the scanner misread the code, an exclusion rule applies.
CANNOT_VERIFY: static reasoning genuinely hit its limit, for example behavior depends on runtime configuration you cannot read or the path crosses into a binary you cannot inspect. Use it sparingly. It must not become the default.
Finding under review (from the scanner, a claim and not a fact): id {id}, file {file}, line {line}, category {category}, claimed severity {severity}, title {title}, then on their own lines the description, the exploit_scenario or "(not provided)", and the claimed preconditions or "(not provided)".
You are vote {k} of {N}. You have not seen the other verifiers' reasoning and must not try to find it. Work independently from the code.
```

- Votes per finding: 3 by default, 1 for a quick pass, 5 for a high-stakes batch. A finding with a `file` but no `line` gets one vote whatever the setting, because a file-level sweep is expensive and gains nothing from voting. Run verifiers concurrently, in batches of about 40.
- A verifier that fails or returns no parseable verdict block is run again once. If that fails too, its vote counts as `cannot_verify` with confidence 0, `"verifier_error"` goes into `refute_reasons`, and the remaining votes still decide.
- A majority of `TRUE_POSITIVE` gives `verdict: true_positive`, and the finding goes on to ranking. A majority of `FALSE_POSITIVE` gives `verdict: false_positive`. `confidence` is the mean `CONFIDENCE` of the votes that agree with the majority, rounded to one decimal, and `vote_breakdown` holds the three counts.
- With no majority (a tie, or a majority of `CANNOT_VERIFY`), `noise_tolerance` decides. `precision`: `false_positive`, with `(split vote, dropped under precision policy)` appended to the rationale. `recall`: `true_positive` with `verify_verdict: needs_manual_test`, and the finding goes on to ranking. `ask`: collect all split findings and put them to the user in one question after verification, keep or drop.
- `exclusion_rule` is the most frequent `EXCLUSION_RULE` among the `FALSE_POSITIVE` votes, or `null`. `refute_reasons` is the sorted unique `REFUTE_REASON` values of those votes. `first_links` is the unique `FIRST_LINK` values of all votes, the audit trail for reachability. `rationale` is the `RATIONALE` of the highest-confidence vote on the winning side, verbatim.

## Ranking by exploitability

- Severity is recomputed from preconditions and reachability, not from the category name, and the scanner's claimed severity is judged separately. Verification and severity are independent judgments: "this is real" must not inflate into "this is critical".
- One ranking pass per confirmed finding, in a fresh context like a verifier. It gets `environment`, `threat_model`, `scoring`, the finding's location, category and claimed severity, and `first_links` and `rationale` from verification. It assumes the finding is real and reads the codebase only to check preconditions, without executing anything.
- Before rating, the pass writes out the evidence: is the code reachable from a real entry point, does untrusted input reach the sink intact, what has to be in place (a non-default setting, a feature flag, a narrow time window), is authentication needed, can the attacker only read or also modify, and who is affected. This keeps the rating from anchoring on the bug class ("SQL injection, so critical").
- Step 1: list every precondition of exploitation concretely (auth state, configuration, prior request, race window, attacker position) and state the minimum `access_level`: `unauthenticated_remote`, `authenticated`, `local` or `physical`. The list replaces any `preconditions` from the scanner.
- Step 2: derive `severity` twice and take the lower result. By precondition count, 0 is `HIGH`, 1-2 is `MEDIUM` and 3+ is `LOW`. By access required, unauthenticated remote is `HIGH`, authenticated is `MEDIUM`, and local-only or no demo path is `LOW`. So 0 preconditions but authenticated-only is `MEDIUM`, and 1 precondition but local-only is `LOW`. With 3 or more preconditions listed, `HIGH` is almost certainly wrong.
- Step 3: when the finding maps onto an entry of a non-empty `threat_model`, record the entry as `threat_match`. A match may raise severity by one step, never by two, so that a stated threat cannot lift a `LOW` back to `HIGH` and defeat the precondition rule.
- Step 4: `severity_alignment` scores the claimed severity from -5 to +5, as an engineer allergic to inflation would after two hundred scanner findings in one week: does the claim add to alert fatigue, is it comparable to a real CVE at that level, is the code in test fixtures or dev-only config. +3 to +5: justified or understated. 0 to +2: roughly right. -1 to -3: inflated by one level. -4 to -5: badly inflated, a `LOW` dressed as `HIGH`.
- Step 5: `verify_verdict` is exactly one of `exploitable` (the preconditions are realistically satisfiable), `mitigated` (real, but a deployed control, which the pass names, reduces it below the derived severity) and `needs_manual_test` (the severity hinges on something only a runtime test can settle).
- Step 6: `severity_label` holds the rating in the `scoring` standard: a vector string plus base score for CVSS, likelihood x impact for OWASP, otherwise the derived severity. For CVSS the pass writes the vector only, and a tool such as the Python `cvss` library computes the score, because models get a significant share of raw CVSS calculations wrong.
- The pass also returns a rank rationale of 2 to 4 sentences, which is appended to `rationale` after a blank line.
- The derived severity is a hint for ordering, not ground truth. A human reviews every finding rated `HIGH`, and for a high-confidence `HIGH` finding the report recommends a proof of concept built by a human as a follow-up.

## Routing to an owner

- For each confirmed finding, use the first source that answers and name it in `owner_hint`, because a bare username is less useful than `component: auth/; no CODEOWNERS entry; top committer jsmith (14/20 recent commits)`. Every other finding has `owner_hint: null`.
- First `CODEOWNERS`, `OWNERS`, `.github/CODEOWNERS` or `docs/CODEOWNERS`: match `file` against the patterns, where the last match wins. Hint: `CODEOWNERS: <pattern> -> <owner(s)>`.
- Then git history: `git -C <repo> log --format='%an' -n 50 -- "<file>" | sort | uniq -c | sort -rn | head -3`, with the hint `top committer: <name> (<n>/<total> recent commits); no CODEOWNERS entry`. Last, the module: `component: <top-level dir of file>/; no CODEOWNERS or git history`.

## Organization-specific false-positive rules

- Organization rules are plain text, one rule per line or paragraph, kept in version control beside the code (upstream's example path is `.claude/fp-rules.txt`). They are appended verbatim to the 16 exclusion rules of the verifier brief, and a verifier cites one as `EXCLUSION_RULE: org rule`. Examples: "we use Prisma everywhere, raw-query SQLi only" and "k8s resource limits cover DoS".
- The most common cause of false positives is not misread code but a trust boundary the model does not know. When a whole class of findings is wrong in the same way, write the missing assumption into `THREAT_MODEL.md`.
- A frequent false positive is a real code path that validation in a calling service or a shared sanitizer makes unreachable. Find out which upstream context is missing (calling services, configs, middleware) and provide it.

## TRIAGE.json and TRIAGE.md

- Sort all findings by `verdict`: `true_positive`, then `duplicate`, then `false_positive`. Sort true positives by `severity` (`HIGH`, `MEDIUM`, `LOW`), then `confidence` descending, then `severity_alignment` descending. Sort the others by `id`.
- Every input finding appears exactly once, and nothing is dropped silently. `claimed_severity` is the severity the scanner gave. A finding that did not reach ranking has `severity: null`, `verify_verdict: null`, `severity_alignment: null` and `preconditions: []`, except that an unlocatable finding keeps `verify_verdict: needs_manual_test`.

```json
{ "triage_completed": true,
  "triage_context": {"mode": "interactive|auto", "environment": "...", "threat_model": ["..."], "scoring": "...", "noise_tolerance": "...", "votes_per_finding": 3, "repo": "..."},
  "summary": {"input_count": 0, "duplicates": 0, "false_positives": 0, "true_positives": 0, "needs_manual_test": 0, "by_severity": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}},
  "findings": [{
    "id": "f001", "source": "VULN-FINDINGS.json#0", "title": "...", "file": "...", "line": 0, "category": "...", "claimed_severity": "HIGH",
    "verdict": "true_positive|false_positive|duplicate", "verify_verdict": "exploitable|mitigated|needs_manual_test|null", "confidence": 0.0,
    "severity": "HIGH|MEDIUM|LOW|null", "severity_label": "...", "severity_alignment": 0, "preconditions": ["..."], "access_level": "...", "threat_match": "...|null",
    "rationale": "file:line-cited prose: reachability, protections, why each held or didn't; then ranking rationale",
    "vote_breakdown": {"true_positive": 0, "false_positive": 0, "cannot_verify": 0}, "refute_reasons": ["..."], "exclusion_rule": null, "first_links": ["file:line", "..."],
    "duplicate_of": null, "absorbed": ["..."], "owner_hint": "...", "missing_fields": ["..."]
  }] }
```

- `TRIAGE.md` is the report for reviewers. It opens with `# Triage Report`, a summary line (`{N} in -> {D} duplicates, {F} false positives, {T} confirmed ({H} high / {M} med / {L} low), {X} need manual test`) and a context line with the mode, environment, scoring and vote count.
- `## Act on these` has one section per true positive in sorted order, headed `### [{severity}] {title}  ({id})`. It gives `file:line`, category, claimed severity with alignment, confidence out of 10, owner, verdict with vote breakdown, preconditions, threat-model match, the rationale and the reachability evidence. A `needs_manual_test` finding adds `> Recommend a human build a PoC; static reasoning hit its limit.`
- `## Dropped` is a table `| id | title | file:line | why dropped |`. The reason is the `refute_reasons` and `exclusion_rule` of a false positive, `duplicate of <id>` for a duplicate, and `no source location in input` for an unlocatable finding.

## Design notes

- `CANNOT_VERIFY` exists so that a verifier is not forced into a false binary. It becomes `needs_manual_test` under `recall` and a drop under `precision`. `needs_manual_test` is a recommendation that a human build a controlled proof of concept, not a failure of triage.
- `FIRST_LINK` hardens the verifier. A model given a criterion tends to satisfy the criterion instead of finding the truth, so the brief demands a call site that was read and quoted, not a plausible chain.
- Upstream's wider advice routes verification by category. Payload-to-sink tracing, which is what a static verifier does, works for injection and dataflow bugs. Memory safety wants a sanitizer run, because exploitability depends on heap layout that cannot be seen statically. Auth logic and other composition bugs are proven by argument, by a single reviewer at a higher bar.
- Pipeline reports are ingested on a best-effort basis. They describe ASAN crashes with prose exploitability analysis, not the file, line and category shape a static verifier expects, so expect more `needs_manual_test` verdicts on them. Their claimed severity uses a wider scale: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `NOT-A-BUG` or `NOT_STATED`.

Source: adapted from `.claude/skills/triage/SKILL.md`, `.claude/skills/triage/README.md`, `docs/triage.md`, `docs/best-practices.md`, `docs/blog-post.md`, `docs/troubleshooting.md`, `docs/customizing.md`, `harness/prompts/judge_prompt.py`, `harness/prompts/report_prompt.py` and `harness/prompts/report_grader_prompt.py` of anthropics/defending-code-reference-harness (commit d3bea6b, Apache-2.0).
