# Threat model for a target codebase

## Contents

- What it holds
- Modes
- Safety preamble
- Bootstrap from the code and its history
- Owner interview and the four questions
- `THREAT_MODEL.md` schema
- How the pipeline reads the file

## What it holds

- A threat model answers "what could go wrong with this system, who would do it, and what should we do about it?" before any specific bug is known. In discovery it is scope, which partitions the code, sets priorities and marks what is out of scope. In triage it is a filter that calibrates severity to the system and its environment.
- The litmus test is a one-line patch. If patching one line of code makes an entry disappear, it was a vulnerability, not a threat. "Attacker achieves RCE via untrusted media parsing" still stands after every known bug is fixed, while a missing bounds check on `chunk_size` at `dr_wav.h:412` does not.
- The file holds threats. Vulnerabilities appear only as evidence that raises a threat's likelihood, so a threat model that names no bug is correct. Because threats survive patching, one file serves every later round of scan and fix, so build it before the first scan of a new target, keep it in the repository and update it as the code changes.
- Write down what is trusted (config files, authenticated clients) and which vulnerability classes the owners do and do not care about, with the reason.
- For an open-source target or dependency, read its `SECURITY.md` or published security policy first and carry the stated scope into the threat model as a constraint. Many projects rule out bug classes as by design, and their maintainers reject findings in them.

## Modes

- `bootstrap` derives the threat model from the code plus past vulnerabilities (CVEs, git history, pentest reports) and needs only a local checkout. It suits inherited systems, third-party code, open-source dependencies and anything with a CVE history.
- `interview` walks an application owner who is present in the session through the four questions. It suits new systems, design reviews and systems where the risk lives in business logic that the code does not show.
- `bootstrap-then-interview` is the recommended path when the owner is available and the code is checked out, because the owner's time then goes to refining a code-grounded draft instead of describing the system from scratch.
- When the mode is not given, ask whether someone who owns or built the system can answer questions in this session. Yes with a checkout means `bootstrap-then-interview`, yes without a checkout `interview`, and no `bootstrap`.
- In the chained mode, first let the owner choose between a draft read from the code (about 5 to 10 minutes) and a cold start, and fall back to `interview` unless they opt in. Then bootstrap, write the file, interview with that file as the seed, overwrite it with the refined version and set `mode: bootstrap-then-interview`. The two halves can also run in separate sessions.

## Safety preamble

- Threat modeling reads source, git history and the vulnerability reports the user supplies, and writes one file, `<target-dir>/THREAT_MODEL.md`.
- Before the first step, confirm and state three things. The target directory exists and is a local checkout you can read, you will not execute any code from it, and a lookup of CVEs or advisories goes only to public advisory databases (NVD, GitHub Security Advisories, the project's own issue tracker), not to the target's live deployment.
- The shell is used only for `git` (history), file listing and `gh api` (public advisories). Every subagent brief carries the same restriction verbatim.

## Bootstrap from the code and its history

- Five stages run in this order for any language, which are research, synthesize, generalize, gap-fill and emit.
- Stage 1, research, is seven narrow briefs, each carrying the absolute target path and the read-only restriction. Upstream runs them as parallel subagents, and below 50 source files it works through the same briefs itself in sequence.
- The docs reader reads `README*`, `SECURITY.md`, `CHANGELOG*`, top-level `docs/` and the build manifest (`setup.py`, `Cargo.toml`, `package.json`, `CMakeLists.txt`). It returns what the project says it is and who uses it, plus the security claims and fix entries it documents.
- The surface mapper greps for entry points and returns the surface, its `file:function` and what crosses it. Surfaces are network (listeners, HTTP routes, RPC and GraphQL definitions), file and format parsing, CLI and environment, deserialization, DB queries built from strings, IPC and plugins (dynamic load, subprocess spawn, `eval` on config), supply chain (lockfiles, vendored libraries, `curl | sh` in build scripts), and infra and IAM.
- The surface mapper skips `vendor/`, `node_modules/`, `third_party/` and generated code and keeps about 5 representative hits per surface. Its tokens are seeds, not a checklist, so extend them with the idioms of the target's language and framework. Supply-chain, build-time and infra surfaces count as entry points even though no runtime input crosses them.
- The infra reader reads deploy-time config (`*.tf`, `*.tfvars`, Kubernetes manifests, `Dockerfile*`, CI workflows, IAM, service-account and dataset-ACL files). For each it names the identity the workload runs as and what that identity can reach, access grants not managed in this tree, and credentials or principals that survive a migration or teardown. A config that is itself the problem becomes a candidate threat.
- The asset finder returns what the code protects or produces, which is sensitive data it reads or writes (secrets, keys, user records, databases), process integrity (always present for native code), service availability, and the embedder's assets when the target is a library.
- The history miner derives 6 to 10 commit-message keywords from what this code does (`overflow OOB UAF integer` for a native parser, `injection SSRF IDOR traversal` for a web service) on top of the base set `CVE- security vuln fix exploit`. It runs `git -C <target-dir> log --all -i --grep='CVE-\|security\|vuln\|fix\|exploit\|<derived>' --oneline`, reads the full message and diff of each hit, and greps any `issues/` or `bugs/` export in the tree.
- The advisory fetcher runs `gh api /repos/{owner}/{repo}/security-advisories` when the `origin` remote is on GitHub and `gh` is installed. Otherwise there is no public advisory source.
- The vuln-file parser runs only when the user supplies past vulnerabilities (upstream's `--vulns` file), as CVE IDs one per line, a CSV with columns `id,title,component,description`, a Markdown pentest report or a JSON array of objects with at least `id` and `description`. These last three briefs return vulnerability rows of `id`, `title`, `component`, `class` and `vector`.
- Stage 2, synthesize, is the join and stays with whoever holds all the returns. Section 1 comes from the docs summary and the tree layout. Section 2 is the deduplicated asset rows with obvious gaps filled (native code always has host process integrity). Section 3 merges surface and infra rows, names the trust boundary of each and lists the section 2 assets reachable from it.
- The vulnerability working table holds all vulnerability rows, deduplicated by `id`. Read the source to confirm which section 3 entry point each one traversed, and add that entry point if section 3 lacks it. The table stays in working notes and feeds the `evidence` column.
- Stage 3, generalize, groups the vulnerabilities by entry point, bug class and asset reached, and each cluster is one threat. Three heap overflows and one integer overflow in the WAV and FLAC parsers, all reaching process memory, become "Memory corruption leading to RCE via untrusted audio file parsing" with all four IDs as evidence. A statement that fails the litmus test is still at vulnerability level, so zoom out.
- The variant scan greps for siblings of each cluster, code paths of the same shape outside the vulnerability list (other format parsers, other callers of the same unsafe helper). It estimates how much of the surface shares the pattern rather than proving exploitability, and more siblings mean higher likelihood. Siblings stay out of `evidence`, which is for confirmed past vulnerabilities only, and go to the scan as candidate leads.
- Score each cluster. `actor` follows from the entry point (whoever supplies the file for a parser, `remote_unauth` or `remote_auth` for a network endpoint depending on whether authentication precedes it), and `impact` from the asset and the bug class. A confirmed past vulnerability in this exact surface means a `likelihood` of at least `likely`, a public exploit or active exploitation `almost_certain`, and no evidence but siblings and a well-known technique `possible`. Then adjust down for controls.
- `controls` comes from a grep for the mitigations that fit the stack (size caps, input validation, sandboxing, parameterized queries, auth middleware, CSP, rate limiting), or is `none`. `status` is `unmitigated` unless a control fully closes the threat. For each cluster also note one class-level control that would close or materially shrink the whole threat whichever instance is found next. These notes become section 8.
- Stage 4, gap-fill, exists because past vulnerabilities are biased toward what has already been found. For every section 3 entry point without a section 4 row, walk STRIDE and add at least the plausible threats. Walk the entry points that already have rows too, because a file parser with an RCE threat probably also has a DoS threat.
- For infra and IAM entry points walk these instead of STRIDE. Over-grant means the identity reaches more than the app needs, lateral identity that a co-located workload can assume it, drift that a grant is managed outside this tree, residual access that a predecessor's credentials or principals survive the migration, column exposure that a broad table read exposes identity or PII columns the app does not need, and scope enforcement asks what bounds an automated approval, merge or write path to its scope.
- Gap-fill threats have empty `evidence`, and their likelihood comes from technique prevalence and surface reachability alone. A final table without any empty-evidence row means this stage did not run. Section 5 gets the STRIDE categories considered and ruled out, each with its reason ("Repudiation: not applicable, no multi-user actions").
- Stage 5, emit, starts with a coverage check. Every section 3 entry point is named in the `surface` cell of at least one section 4 row, matched on the name string and not on the concept, because upstream scores coverage with a text match. Then sort section 4 by impact and by likelihood, both descending, and assign `T1`, `T2`, ... in that order.
- Section 6 lists what the code could not tell, such as deployment context ("Is this exposed to the network or only local?"), intended actors, controls that could not be verified (a WAF, sandbox or size limit in front of this code) and risk appetite ("Is DoS acceptable for this use case?"). Section 8 gets one row per class-level control, and two clusters closed by the same control share one row.
- A quick variant for fast context before a deeper pass stops after stage 2 and runs the briefs in sequence. It still writes all eight sections, with sections 4, 5 and 8 as heading plus empty table and a note in section 6 that stages 3 to 5 have not run.
- On a large codebase stage 1, which is most of the cost, can exhaust context or hit rate limits before the file is written. Upstream therefore saves each stage's result to a scratch file outside the target and resumes at the next stage.

## Owner interview and the four questions

The interview follows the four-question framework (Shostack, 2024). Introduce each phase with the exact wording below, because the phrasing is deliberate. Ask one thing at a time, wait for the answer, and do not hand over a questionnaire.

| | Question | Fills |
|---|---|---|
| Q1 | What are we working on? | section 1 context, section 2 assets, section 3 entry points |
| Q2 | What can go wrong? | section 4 threat rows (`id`, `threat`, `actor`, `surface`, `asset`) |
| Q3 | What are we going to do about it? | section 4 `impact`, `likelihood`, `status` and `controls`, section 5 deprioritized, section 8 recommended mitigations |
| Q4 | Did we do a good job? | ranking validated, coverage checked, section 6 open questions |

- Tag every fact in working notes as `[Code-verified]` (read in the source and confirmed) or `[Owner-states]` (said by the owner, not verified in code). The tags stay out of the tables, but every `[Owner-states]` fact that affects a likelihood or status score goes into section 6 as `- [Owner-states] <claim>. Affects: <Tn field>. Verify by: <suggested check>.`, so the threat model stays honest about what is asserted and what is observed.
- For Q1 with a design document, read it first, summarize the system back in 4 to 6 sentences and ask "Is this right? What did I miss?". That is faster than a cold description and surfaces drift between document and reality. Without one, ask what the system does and who uses it, what data would be bad to lose, leak or tamper with, where input comes from (from the outside in) and where privilege changes.
- While the owner answers, read the code to corroborate, such as `main`, route definitions, file-open calls, socket listeners, deserializers and `argv` parsing. Ask about each entry point the code shows and the owner did not mention ("I see a `/admin/debug` route in `routes.py:88`, is that reachable in production?").
- Start Q2 open ("For each of those entry points, what can go wrong? What's the worst thing someone could do?") and let the owner answer in their own words. When they stall or stay vague, walk each section 3 entry point through STRIDE. Pin every threat to an `actor`, a section 3 `surface` and a section 2 `asset`.
- Then name the 5 to 8 attack classes most likely to matter for this system, derived from what the owner described and not from a generic checklist, at the granularity of "IDOR on dataset rows" or "integer overflow on length fields", far finer than a whole family of web or memory bugs.
- Show that list and ask what the owner would add from incidents here or on similar systems. Their additions are high-signal, so weight them above your own. If a class expected for this stack (injection, deserialization, auth, memory safety, crypto, supply chain, infra and IAM) is on neither list, ask why before dropping it.
- In Q3 verify the controls the owner names in code where possible. When the owner accepts a risk, record their reason verbatim and put the row in section 5 with it. "Nothing, and we're not going to" is a valid answer, because a deprioritized threat with a recorded reason is a valid output.
- Close Q3 with one question per threat class, not per row, which is "If we could land one engineering control that makes this whole class go away or shrink, what would it be?". The answer, or your own proposal if the owner has none, becomes a section 8 row. Prefer controls that survive the next bug (sandboxing, type-safe parsers, parameterized queries, CSP, allocation caps) over patches for the last one.
- For Q4 read the section 4 table back sorted by impact and likelihood, and ask "Does the top of this list match your gut? Is anything ranked too high or too low?" and "Is there anything you've been worried about that isn't on this list?".
- Before writing, check coverage. Every section 3 `entry_point` name appears verbatim in at least one section 4 `surface` cell, or a section 5 row says "<entry_point>: out of scope because ...". Otherwise add a threat for that surface, or ask the owner why it is safe and record the answer in section 5.
- With a seed, which is the file from an earlier bootstrap, do not start from scratch. Summarize its sections 1 to 3 and ask only "What's wrong or missing here?", walk its section 4 row by row ("Does this apply? Is the actor right?"), then ask what is missing. Concentrate on its section 6 open questions and on rows with uncertain likelihood.

## `THREAT_MODEL.md` schema

The headings and their order, the column names and their order, and the enum values are a contract, because downstream tooling parses the file with regex, for example `^## 4\. Threats$` up to the next `^## `. The block lists them in order. Add the separator row under each table header and blank lines between blocks.

```markdown
# Threat Model: <system name>
## 1. System context
## 2. Assets
| asset | description | sensitivity |
## 3. Entry points & trust boundaries
| entry_point | description | trust_boundary | reachable_assets |
## 4. Threats
| id | threat | actor | surface | asset | impact | likelihood | status | controls | evidence |
## 5. Deprioritized
| threat | reason |
## 6. Open questions
## 7. Provenance
- mode: interview | bootstrap | bootstrap-then-interview
- date: YYYY-MM-DD
- target: <path or repo url @ commit>
- inputs: <design doc path | --vulns path | "none">
- owner: <name, for interview> | <unset, for bootstrap>
## 8. Recommended mitigations
| mitigation | threat_ids | closes_class | effort |
```

- Section 1 is one to three paragraphs of prose without a table, saying what the system is, what it does, who uses it and where it runs. Section 2 has one row per thing worth protecting, with `sensitivity` one of `low`, `medium`, `high`, `critical`.
- Section 3 has one row per place where untrusted input enters the system or the privilege level changes. `trust_boundary` is free text naming the crossing, such as "untrusted file -> process memory" or "unauth network -> authenticated session". `reachable_assets` is a comma-separated list of asset names from section 2.
- Section 4 is the threat model proper, with one row per actor-wants-outcome pair at the abstraction level where it survives a patch, sorted by impact and then likelihood, both descending. `threat` is one sentence in the active voice that names the outcome rather than the bug, such as "Remote code execution via untrusted media parsing".
- `id` is `T1`, `T2`, ... and stable across edits, so do not renumber when rows are removed. `surface` names the section 3 entry points the threat traverses, `asset` the section 2 assets it compromises. `controls` holds the current mitigations or `none`.
- `actor` is one of `remote_unauth`, `remote_auth`, `adjacent_network`, `local_user`, `local_admin`, `supply_chain`, `insider`. `status` is one of `unmitigated`, `partially_mitigated`, `mitigated`, `risk_accepted`.
- For `impact`, `low` is a nuisance with no data or availability loss, `medium` is limited data exposure or degraded availability for some users, `high` is significant data exposure, integrity loss or full availability loss, `critical` is full compromise of a primary asset (RCE, auth bypass, data exfiltration at scale), and `existential` means the compromise threatens the organization's continued operation.
- For `likelihood`, `very_rare` requires nation-state resources or an unlikely chain of preconditions, `rare` requires significant skill and a non-default configuration, `possible` means a motivated attacker with public tooling could plausibly do this, `likely` means the attack surface is reachable and the technique is well known, with prior evidence in this or similar systems, and `almost_certain` means actively exploited in the wild, or trivially automatable against the default configuration.
- `evidence` holds the CVE IDs, issue links, pentest finding IDs or git commit hashes that instantiate the threat, and may be empty. Evidence is not the threat. It moves likelihood up, existing controls move it down, and the score is the residual likelihood after current controls.
- Section 5 holds threats considered and explicitly parked, each with its reason, commonly out of scope, actor not in threat model, asset not present, or risk accepted by owner. Section 6 is a bullet list of what the mode could not determine, which is questions for a human owner after a bootstrap and owner claims not verifiable in code after an interview.
- In section 7 after a bootstrap, `inputs` is the past-vulnerabilities file or "git-log + CHANGELOG mined", `owner` is `unset`, and `target` ends in the short commit hash or "not a git repo". After an interview `inputs` is the design document and the seed, each a path or "none", and `owner` is the name given or "present, unnamed".
- Section 8 holds one class-level control per row, not a per-finding patch. `mitigation` is one imperative line, `threat_ids` a comma-separated list of section 4 ids such as `T1,T3`, `closes_class` is `yes` or `partial`, and `effort` is `S`, `M` or `L`. Both modes write the section. A reader must tolerate its absence, because it is optional and older files omit it.

## How the pipeline reads the file

- No pipeline code reads the file at this commit, although `docs/threat-model.md` says the pipeline's recon does. The pipeline takes its focus areas from the `focus_areas` list in the target's `config.yaml` or from its own recon of the source tree, so the threat model reaches it only through a `focus_areas` list written from sections 3 and 4.

Source: adapted from .claude/skills/threat-model (SKILL.md, bootstrap.md, interview.md, schema.md, README.md), .claude/skills/vuln-scan/SKILL.md, .claude/skills/triage/SKILL.md, docs/threat-model.md, docs/blog-post.md, docs/best-practices.md and docs/troubleshooting.md of anthropics/defending-code-reference-harness (commit d3bea6b, Apache-2.0).
