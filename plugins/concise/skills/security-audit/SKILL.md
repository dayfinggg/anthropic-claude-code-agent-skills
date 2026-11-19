---
name: security-audit
description: Auditing a codebase or service for vulnerabilities as a find-and-fix loop of threat model, static scan, triage and patch, plus hunting an attacker in logs, after Anthropic's Defending Code Reference Harness. Use when asked to check a whole project for vulnerabilities or security problems, build a threat model, verify, dedupe and rank a pile of findings, write or verify security fixes, investigate signs of compromise in logs, or run vuln-pipeline. One diff, pull request or single finding in web code belongs to web-security.
---

# Security audit of a codebase

This skill runs a security audit of a whole codebase or service as a loop that scopes it with a threat model, scans the source, triages what the scan returns, patches what triage confirms and scans again. A second track looks for an attacker who may already be in the logs. The method and its file formats follow Anthropic's Defending Code Reference Harness at commit `d3bea6b` (2026-08-06), so files written with this skill can be fed to that repository's skills and pipeline. See which commit a clone is on with `git -C <clone> log -1 --format='%h %cs'`. Where a newer clone differs, its own `docs/` are right about its commands.

## References

- Read [references/threat-model.md](references/threat-model.md) before you build or update `THREAT_MODEL.md`, interview an owner about a system, or need focus areas and trust boundaries for a scan.
- Read [references/static-scan.md](references/static-scan.md) before you scan source for vulnerabilities. It holds the review brief, the do-not-report list, the `VULN-FINDINGS.json` shape and the handling of a large codebase.
- Read [references/triage.md](references/triage.md) before you verify, deduplicate or rank findings from any scanner or agent. It holds the verifier brief, the 16 exclusion rules and the `TRIAGE.json` shape.
- Read [references/patching.md](references/patching.md) before you write, review or verify a security fix. It holds the patch and review briefs, the verification ladder and the `PATCHES/` shape.
- Read [references/incident-hunt.md](references/incident-hunt.md) when logs may hold an attack, whether you hunt without an alert, work an alert or an indicator, judge whether an attack succeeded or write a response plan.
- Read [references/reference-harness.md](references/reference-harness.md) before you clone, run or port upstream's pipeline, when a subagent or a tool call misbehaves during an audit, and before you report a finding to an open-source project.

## Check first

- Confirm that the user owns the target or is authorized to test it, and write down the scope, meaning which repository, hosts and environments are in and which are out. A brief for a subagent states the same authorization and scope, as upstream's briefs do.
- A request to check, audit or scan allows reading the target and writing the audit's own files. Fixing, applying a patch and changing a server each need the user's word.
- Look for what already exists, such as `THREAT_MODEL.md`, `SECURITY.md`, earlier audit files and the list of known issues. Known bugs go to the scan as already found, so it spends its effort on new ones.
- Put the audit's files where the project keeps task materials. Upstream's default is the target directory for `THREAT_MODEL.md` and `VULN-FINDINGS.json`, and the working directory for `TRIAGE.json` and `PATCHES/`. They describe unfixed vulnerabilities, so commit them to a shared repository only when the user asks.
- Find out where a proof of concept may run before you plan to confirm anything by execution, under the rules in Execution below.

## The loop

- Build the threat model first when the target is too large to read in one pass, or when findings will be judged by who can reach the code. Most false positives come from missing context about the target (what is trusted, what is exposed), not from misread code, so when many findings are wrong in the same way, add the missing assumption to `THREAT_MODEL.md` or to the false-positive rules instead of rejecting each finding.
- Discovery and verification want opposite things. The scan reports every candidate with a plausible exploit path, even at low confidence, and triage then tries to refute each one from the source. A strict bar during the scan quietly drops bugs that verification would have confirmed.
- Triage before you report. Collapse duplicates by root cause (fixing one fixes the other), verify each survivor adversarially, derive severity from preconditions and name an owner. Until triage confirms it, a finding is a candidate, and the report says so.
- Patch what triage confirmed, meaning the root cause and its sibling call sites, as an inert diff with a regression test, checked by a reviewer who did not write it. Applying the diff is the user's move.
- Fix, then scan again. A repeat scan of an unpatched tree spends most of its effort on bugs that are already known, and a scan after the fixes reaches deeper ones. Findings vary between runs, so take the union of several.
- A question about one function, one endpoint or one pull request does not need the loop. Review it directly, with concise:web-security for web code.

## Independent passes

- Every brief in the references runs as a fresh subagent or as a separate step you run yourself. Upstream gives each focus area, each verification vote, each ranking and each patch and review pass to a fresh subagent. For focus areas that only splits the work. For verification, ranking and patch review it is the point, because a pass that has seen the finder's reasoning tends to agree with it.
- A subagent for such a pass starts from an empty context and not as a fork of your session, because a fork carries the finder's reasoning and every other finding's prose into the pass.
- Use subagents when the user asked for depth or for delegation and the project's rules allow them, because the full loop starts one per focus area, three per finding for verification and more for ranking and patches. Set `model` on each dispatch as concise:orchestration describes.
- Otherwise run each pass yourself as a separate step that starts from the code, not from the finding's text. Such a verification counts as one vote however often it is repeated, and a patch review by the patch's author is weaker than upstream's. Record both facts in the output files.

## Execution

- The threat model, the scan, triage and static patching execute nothing, so no build, no run and no request to a running instance. That is what makes them safe to point at any checkout.
- A fired proof of concept (PoC) is the strongest evidence, and it runs only where a mistake costs nothing, which is an instance you started on `127.0.0.1` with its own data or a sandboxed container. Stop that instance by the PID you captured, not by port or name.
- Treat a stand that shares its database, files or cache with production as production. Send it a request only when the user or the project's rules allow probing it, after you read the handler the request reaches to its end, and only when that handler cannot write. Read a cron, maintenance or debug script instead of requesting it, because the request runs it.
- Never prove a finding by exploiting a system that someone depends on, so no write, no destructive payload and no login as another user. Such a finding stays confirmed by code, with the path quoted.
- A probe can leave traces even when it only reads, such as error-log entries, alert emails and lockouts. Check for them afterwards and report them, and remove your own only where the project's rules say so, after saving a copy.
- Upstream's autonomous pipeline executes target code, so it runs only through its sandbox launcher. Its one-time setup needs `sudo`, changes the Docker daemon configuration and leaves a proxy container running, so ask the user before running it.

## Findings and severity

- Every finding states where (a `file:line` that was read), what an attacker does, why it matters and how it was established, which is a fired PoC and where it ran, a code path with its first call site quoted, or a candidate not yet verified.
- Derive severity twice and take the lower result. By preconditions, none is `HIGH`, one or two is `MEDIUM` and three or more is `LOW`. By access, unauthenticated remote is `HIGH`, authenticated is `MEDIUM` and local only is `LOW`. A project's own scale can relabel the result but not reorder it.
- A model's severity is a hint for ordering, and upstream keeps a human in the loop for every `HIGH`.
- When a CVSS score is wanted, write the vector and compute the score with a tool such as the Python `cvss` library, because models get a significant share of hand-computed scores wrong.
- Outdated server software and dependencies are not scan findings. When the user wants known CVEs checked, keep a separate inventory of the installed version, the advisory read at its official source, the fixed version, and whether the vulnerable feature is in use here.

## Gotchas

- Naming the bug classes to look for, as in a request to find SQL injection, XSS and CSRF, lowers recall, because the model walks past everything else. Describe the shape instead, such as attacker input that alters the syntactic structure of an interpreted language.
- A verifier given a criterion tends to satisfy the criterion. Require the `file:line` of the first call site it read, and do not accept a chain that only sounds plausible.
- Hard-coded credentials are a common finding. Mask values in every command that prints target code or configuration, and report the file and the key, not the value.

Related skills: concise:web-security for the vulnerability classes and framework traps of web applications, concise:code-review for one diff or pull request, concise:orchestration for running passes through subagents, concise:autonomous-run for an audit that runs unattended, concise:server-ops and concise:database for the servers and databases an audit reads.
