# Static vulnerability scan

## Contents

- Scope and focus areas
- Review brief
- Collation and confidence pass
- Output files
- Constraints
- Large codebases
- Prompting for discovery

## Scope and focus areas

- When `<target-dir>/THREAT_MODEL.md` exists it is the preferred scoping input: take the focus areas and threat classes from its section 3 "Entry points & trust boundaries" table and its section 4 "Threats" table.
- Without it, do a quick recon: list the source tree, read the entry points and dispatch code (format magic-byte checks, switch statements on input types, parser registration tables) and propose 3 to 10 focus areas. When the user names the focus areas, use exactly those and skip the recon.
- Write each area as `<subsystem> (<function/file>) - <key operations>`, for example `Bravo parser (parse_bravo) - fixed stack buffer, unbounded copy`. The line is handed verbatim to a reviewer, so it has to be self-contained. The key operations (decompression, table lookups, length-prefixed parsing) steer the reviewer toward likely bug patterns.
- Areas must be independent enough that parallel reviewers do not converge on the same bugs. Good partitions are different parsers, formats or protocol stages. Bad ones are too narrow ("line 47"), too broad ("all of parsing") or overlapping (two areas that funnel into the same code path).

## Review brief

- Make one pass per focus area with the brief below. Upstream (the Defending Code Reference Harness) gives each area to its own subagent, at most 10 at a time, and makes one sequential pass without fan-out when the target has fewer than 15 source files. The areas are split to avoid duplicate work, not to keep judgments apart, so without subagents take them in turn with the same brief. `SKILL.md` has the rule for choosing.
- The reporting bar is low on purpose: the scan never drops a finding, the confidence pass only ranks, and false positives are removed in triage, which does the rigorous N-vote verification. The category groups are a menu, not the limit of the search, because the bar is any plausible exploit path and the `category` vocabulary is open-ended.
- Organization-specific vulnerability classes (for example GraphQL depth attacks, PCI retention, a custom auth layer), compliance checks and stack-specific patterns go into a plain-text file in the same shape as the category groups. Append its contents verbatim at the marked place, and keep the file in version control with the code.

```
You are conducting authorized static security review of source code. Your focus area: {focus_area}. Other passes cover the other areas, so duplication is wasted effort.
Target: {target_dir}
Trust boundary: {from THREAT_MODEL.md section 3, or "untrusted input -> process memory"}
Task: read the source in your focus area and identify candidate vulnerabilities. This is static review: do not build, run or probe anything. Reason from the code.
Reporting bar: report anything with a plausible exploit path. Skip style concerns, best-practice gaps and purely theoretical issues with no attack story at all. If you are unsure whether something is real, report it with a low confidence score rather than dropping it. A downstream triage step does the rigorous verification. Your job is to not miss things.
What to look for:
- Memory safety (C/C++ and unsafe/FFI blocks), high value: heap-buffer-overflow / stack-buffer-overflow / global-buffer-overflow. Heap-use-after-free / double-free. Integer overflow feeding an allocation or index. Format-string bugs. Unbounded recursion or allocation driven by untrusted size fields.
- Injection and code execution, high value: SQL / command / LDAP / XPath / NoSQL / template injection. Path traversal in file operations. Unsafe deserialization (pickle, YAML, native), eval injection. XSS (reflected, stored, DOM-based), but see the React/Angular/Vue exclusion below.
- Auth, crypto, data, high value: authentication or authorization bypass, privilege escalation. TOCTOU on a security check. Hardcoded secrets, weak crypto, broken cert validation. Sensitive data (secrets, PII) in logs or error responses.
- Low value, note briefly and keep looking: null-pointer deref at small fixed offsets with no attacker control. Assertion failures / clean error returns (correct handling, not a bug).
Do not report (common false positives, skip even if technically present):
- volumetric DoS / rate-limiting / resource-exhaustion, but unbounded recursion, algorithmic-complexity blowup, or ReDoS driven by untrusted input are reportable
- memory-safety findings in memory-safe languages outside unsafe/FFI
- XSS in React/Angular/Vue unless via dangerouslySetInnerHTML, bypassSecurityTrustHtml, v-html, or equivalent raw-HTML escape hatch
- findings in test files, fixtures, build scripts, docs, or .ipynb
- missing hardening / best-practice gaps with no concrete exploit
- env vars and CLI flags as the attack vector (operator-controlled)
- regex injection, log spoofing, open redirect, missing audit logs
- outdated third-party dependency versions

{organization-specific classes, if any: the file's contents verbatim}

For each finding you do report, trace: where does the untrusted input enter, what path reaches the sink, and what condition triggers it.
Output, one block per finding and nothing else:
<finding>
<id>F-{focus_idx:02d}-{n:02d}</id> <file>{relative/path}</file> <line>{line_number}</line>
<category>{heap-buffer-overflow | use-after-free | integer-overflow | sql-injection | command-injection | path-traversal | deserialization | xss | auth-bypass | hardcoded-secret | ...}</category>
<severity>{HIGH | MEDIUM | LOW}</severity> <confidence>{0.0-1.0}</confidence>
<title>{one line}</title>
<description>{root cause, attacker control, trigger condition, data flow from entry to sink. Cite line numbers.}</description>
<exploit_scenario>{concrete attack: what input, from where, causing what outcome}</exploit_scenario>
<recommendation>{specific fix: parameterize the query, bounds-check before memcpy, etc.}</recommendation>
</finding>
Severity: HIGH = directly exploitable, leading to RCE, data breach or auth bypass. MEDIUM = significant impact under specific conditions. LOW = defense-in-depth.
If you find nothing reportable in your area after a thorough read, emit a single <finding> with category=none and a one-line note of what you covered.
```

## Collation and confidence pass

- Collect the `<finding>` blocks from all areas and drop the `category=none` placeholders. Dedupe lightly: when two findings cite the same `file:line` with the same category, keep the one with the longer description and note the duplicate's id. Heavy dedupe is the job of triage. Then assign the ids `F-001`, `F-002`, ... by severity descending, then file, then line.
- The confidence pass is a cheap second opinion that ranks findings by signal quality, so that people and triage see the high-signal ones first. Nothing is dropped. It is shallow: re-read and score, not a full reachability trace.
- Upstream runs it as one fresh subagent per finding, given only the finding block and the target, which is what makes the score an independent second opinion. Without subagents, run it as a separate step after collation and re-read the cited code for every finding. Skipping the pass saves a round of subagents, and findings then keep only the reviewer's self-reported confidence.
- After scoring, overwrite each finding's `confidence` with the score normalized to 0.0-1.0 and attach the reason as `confidence_reason`. Re-sort by `confidence` descending, then `severity` descending, `file`, `line`, and reassign the ids `F-001`, `F-002`, ... in that order.

```
You are giving one candidate security finding an independent confidence score. You are not deciding whether to keep it: every finding is kept. You are deciding how likely it is to survive rigorous triage.
Finding: {the full <finding> block}
Target: {target_dir} (you may Read/Grep inside it, but do not execute)
Step 1: re-read the cited code. Open {file} around line {line}. Does the code actually do what the description claims?
Step 2: check against common false-positive patterns (volumetric DoS, memory-safe language, test/fixture/doc file, framework auto-escape, env-var vector, missing-hardening-only, regex/log injection, outdated dep). A match lowers confidence sharply but does not auto-zero it.
Step 3: score 1-10 that this is a real, actionable vulnerability:
  1-3  likely false positive or noise
  4-5  plausible but speculative
  6-7  credible, needs investigation
  8-10 high confidence, clear pattern
Output (exactly this, nothing else):
  CONFIDENCE: <1-10>
  REASON: <one line>
```

## Output files

- Write both files into the target directory. `VULN-FINDINGS.json` has the shape below, which is what triage ingests.
- `findings` is sorted by `confidence` descending, then severity, file and line, so the top of the file is the highest-signal material. `summary.low_confidence` counts the findings with confidence below 0.4.
- `VULN-FINDINGS.md` is the human-readable companion: a summary table (id, severity, category, `file:line`, title), then one `### F-NNN` section per finding with the full description.

```json
{
  "target": "<target-dir>", "scanned_at": "<iso8601>", "focus_areas": ["..."],
  "findings": [{
    "id": "F-001", "file": "relative/path.c", "line": 123, "category": "heap-buffer-overflow", "severity": "HIGH", "confidence": 0.9,
    "title": "...", "description": "...", "exploit_scenario": "...", "recommendation": "...", "confidence_reason": "..."
  }],
  "summary": {"total": 0, "high": 0, "medium": 0, "low": 0, "low_confidence": 0}
}
```

## Constraints

- The scan never executes target code: no builds, no `docker`, no network. It needs no sandbox only because it reads and writes files and runs nothing. Reproducing a finding with a PoC is a separate step under the Execution rules of `SKILL.md`, and upstream's sandboxed `vuln-pipeline` is the tool for execution-verified results.
- The shell is only a fallback for missing Glob and Grep tools, with read-only commands: `rg --files` or `ls -R` to enumerate, `rg -n` or `grep -rn` to search, `wc`, `head` and `file` to sniff. Write no helper scripts and pipe no target content into a shell interpreter.
- Do not fabricate line numbers. Every `file:line` in a finding is something that was read or grepped. When the exact line is unsure, cite the function and say so in the description.
- Stay inside the target directory. Do not follow symlinks or `..` out of it.

## Large codebases

- Map first: build the threat model, use it to pick which components to scan first, scan component by component, then make a final pass for bugs that only appear when components chain.
- Summarize per component before hunting: one Markdown file per component that says, from an attacker's perspective, which of its surfaces are most likely to lead to a breach of the system as a whole. Then clear context, load all the summaries together and run the whole-system pass.
- Rank files by vulnerability probability in a cheap pass and scan in descending order. Tests, headers and generated code sink to the bottom. Entry points, parsers, auth and anything touching untrusted input rise to the top.
- Partition into a handful of meaningful units and run one reviewer per unit. One reviewer per file is excessive, because reviewers reason across files and tiny scopes waste the fixed per-agent overhead on shallow context.
- Scale by re-partitioning, not by adding reviewers. When a first scan touched only a small fraction of the surface (one team found about 3% of its API endpoints covered), raise the focus-area count or feed the recon an endpoint inventory. More reviewers on the same partition converge on the same shallow bugs.
- Track coverage: the lines of code the reviewers touched, and test coverage as a proxy, because surfaces with no tests are often the ones the scan missed. Turn missing code paths into focus areas of the next run.
- Fix the first batch of findings, or hand them to the next scan as already known, before scanning again. A second run on an unpatched tree spends most of its budget re-converging on bugs that are already known.

## Prompting for discovery

- Give the model room: state the target, the goal and the tools, and leave the path to the model. Long instructions, staged checklists and piles of reference material backfire, because the model pattern-matches the scaffolding instead of reasoning about the code.
- Describe vulnerability shapes, not checklists: the structural property that makes something exploitable, not a list of APIs. The model knows f-strings are dangerous. What it does not know is that a dynamic table name in an otherwise parameterized ORM is the same bug. Enumerating the wanted bug types ("look for SQLi, XSS, and CSRF") worsens recall, because the model overfocuses on the named classes and walks past everything else.
- State scope: tell each reviewer precisely which part of the codebase to search and what to look for, and name the classes of findings nobody cares about, because the model tends to search exhaustively.
- State existing mitigations that the source does not show, and pitfalls specific to the environment. A frequent false positive is a real code path made unreachable by validation in a calling service or a shared sanitizer. Ask the reviewer which surrounding context it wants (calling services, configs, middleware), provide it and rerun.
- State that vulnerabilities exist. "Assume there are vulnerabilities, and keep going until you've covered the surface" is strong, "act like a pentester" is weak.
- Tune precision before recall: get the false-positive rate down to where the output is trusted, then widen the net. Teams that worked in this order roughly doubled recall once precision was solid.

Source: adapted from .claude/skills/vuln-scan/SKILL.md, harness/prompts/recon_prompt.py, harness/prompts/find_prompt.py, docs/prompting.md, docs/best-practices.md, docs/blog-post.md, docs/troubleshooting.md and docs/customizing.md of anthropics/defending-code-reference-harness (commit d3bea6b, Apache-2.0).
