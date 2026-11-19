# Incident hunt and response in logs

## Contents

- When this track applies
- Hard rules for both entries
- Inputs and baseline
- Hypothesis loop
- Source confirmation and proof of concept
- Response to a lead
- Response plan
- `INCIDENTS.json` and the incident report
- Handoff to triage and patching
- Scope and limits

## When this track applies

- The rest of the method is preventive. This track assumes prevention failed and an attacker may already be in the logs: find them, scope the damage, propose the response. It applies the same standard, evidence over plausibility, to telemetry instead of source code.
- Hunt: no alert in hand. The question is "is there anything in here that should not be?", answered with a baseline, a hypothesis loop with a written ledger, confirmation in source and a fired proof of concept (PoC).
- Response: one lead in hand, which is an incident id from a hunt, an alert, an indicator of compromise (an IP, an account, a route, a session identifier) or free text such as a customer report. It answers four questions in order: what happened, did it succeed, how far did it go, and what do we do about it.
- The chain is hunt (find it), response (scope and plan), triage (verify), patch (fix). Upstream runs each entry in one session and hands no part of it to subagents. A response expands its scope once, so when scope keeps growing the open-ended hunt loop is the tool.
- Logs also serve the preventive track as ground truth for reachability: a static scan reasons about whether a path could be reached, and logs show what is being reached. One team that fed live traffic logs in beside the source reported, by its own measure, a true-positive rate near 100 percent.

## Hard rules for both entries

- Log evidence alone never confirms a vulnerability. Logs show that something was attempted and how the application responded. They cannot show that the code is vulnerable. The verdict ladder:
  - `confirmed_exploited` requires all three: log evidence, the flaw identified in source (file and function), and a PoC fired against a local instance in this session.
  - `suspected` means log evidence, with or without a source read, but no fired PoC.
  - `attempted_not_vulnerable` means attack traffic was observed, but the source shows the defense and the PoC, if fired, bounces.
- The PoC leg exists because field teams have watched verifier agents "confirm" findings by reading observability logs and reporting what they said, which is the cheapest way to satisfy the criterion. A PoC fires or it does not, and that cannot be talked past.
- Query, do not read. A log corpus is bigger than a context window, so do not open a log file with Read or `cat`. Profile with `wc`, `du`, `head` and `tail`, then interrogate with `grep`, `rg`, `awk`, `sort` and `uniq` pipelines, `python3` for anything stateful, or SQL in DuckDB when grep passes are too slow. Alert queues and error logs under about 200 lines may be read whole after a size check.
- Propose, never execute. No blocking, no account disabling, no credential rotation and no config changes, in any environment, including a demo application. Containment is irreversible and depends on context that logs do not capture: the "attacker IP" may be a NAT gateway with 400 legitimate users behind it. The plan names actions and humans execute them.
- Local only. A PoC fires at `127.0.0.1` against an instance you started. Never send traffic to a remote host, whatever the logs contain: a PoC is an attack request, and only an instance you started is known to be disposable.
- Every number is a query result. Row counts, request counts, time spans and affected-customer counts each come from a pipeline run in this session and quoted in the ledger, not from memory. Pipelines over the logs and queries against the application's own seeded local database both count.

## Inputs and baseline

- Inventory every file in the logs directory and any alert queue with `du -h`, `wc -l`, `head -2` and `tail -2`. Identify each format (combined access log, application error log, JSONL alerts) and the field positions to use in `awk`.
- Locate the application source and the commands that seed and start it locally (upstream's target config calls them `seed_command`, `app_command` and `port`). List the source files but do not read them yet: source is read later, with hypotheses in hand. Without source no finding can rise above `suspected`.
- Keep all outputs of one investigation in one run directory. Upstream uses `results/<target>/<UTC timestamp>/`, so a new hunt does not overwrite an earlier one, and the response, triage and patch outputs land beside the incidents.
- Anomalies are deviations from a baseline, so build the baseline before any hypothesis: about a dozen cheap one-line pipelines over the access log. Record each observation with the exact pipeline that produced it.
  - Time window: first and last timestamp, requests per day.
  - Status histogram: counts by status code, noting every class outside 2xx and 3xx.
  - Top talkers: requests per source IP, the top 20 against the median, noting anything an order of magnitude above the pack.
  - Top routes: requests per path with ids normalized (`/orders/123` becomes `/orders/N`), and which routes take parameters.
  - User agents: counts per agent, flagging automation (curl, python-requests, sqlmap, Go-http-client, zgrab) and the routes it touches.
  - Auth picture: which field carries the authenticated user, logins per account, accounts seen from more than one IP, sources of failed logins.
  - Size profile: minimum, median and maximum response size for each parameterized route. A large outlier on a route with normally small responses is a sign of data egress.
  - Error log and alert queue: read each whole if it is small. Correlate every error entry with access-log lines by timestamp, and note the rule, source, target and severity of each alert. Alerts are inputs to the hunt, not findings, and both alert noise and alert silence are information.

## Hypothesis loop

- The ledger is the contract of the loop: no query without a hypothesis, and no hypothesis without a ledger row. Its columns are `#`, `Hypothesis`, `Query`, `Result`, `Verdict` and `Next pivot`. Save it in the run directory after every round, so an interrupted hunt resumes without repeating sweeps.
- Ledger verdicts are `supported`, `refuted` and `needs-pivot`. A refuted hypothesis stays in the ledger, because ruling things out is half the job and feeds `ruled_out`.
- Round 1 runs all eight seed sweeps, derived from the baseline, and each hit spawns follow-on hypotheses:
  - Server errors: who causes 5xx, on which routes, with what payloads. Correlate with the error log, where application errors that quote attacker input are a probe signature.
  - Every alert, verdicted: did the activity it flagged succeed? An alert that fired on harmless traffic becomes a `ruled_out` entry with its evidence.
  - Top-talker outliers: what each IP far above baseline volume is doing, whether scanner noise, a crawler or something with intent.
  - Injection grammar in query strings: encoded quotes (`%27`), `UNION` and `SELECT`, comment markers (`--`, `%23`), boolean pairs (`AND 1=1` with `AND 1=2`). Decode the hits and reconstruct the sequence per source IP in time order.
  - Enumeration: one session or IP reading object ids in sequence (`/orders/1`, `/orders/2`) at machine cadence, compared with how legitimate sessions use the same route.
  - Auth anomalies: an account logging in from an IP not seen for it before, failed-then-succeeded sequences, one IP authenticated as one account but reading at unusual volume.
  - Size anomalies: requests on parameterized routes whose responses are multiples of the route's median, and what those responses contained.
  - Quiet hours: activity in the lowest-traffic hours, because low-and-slow campaigns hide in volume but stand out at 3am.
- Pivot from the entities of a hit: everything else that IP did, everything that session touched, every other IP that hit the same route the same way, and what happened to the data that moved. Campaigns are chains, so one confirmed link is hunted in both directions: how they got here and where they went next.
- Stop after two consecutive rounds that surface no new entities, and note the stop in the ledger. A hypothesis that comes back `supported` but only confirms benign behavior counts as no new entities: record it and route it to `ruled_out`.
- Probes are not incidents. Most attack traffic in a real corpus is failed noise from scanners hitting routes that hold. Upstream's grader penalizes calling that noise an incident exactly as hard as missing the campaign, because that confusion is where alert fatigue comes from. Verdict it in writing, with the evidence.

## Source confirmation and proof of concept

- For each suspect that implicates a route, find the handler and trace the suspicious input from the request to its sink: a query, the filesystem or an auth decision. Log evidence picks the route, and source confirms the flaw.
- Vulnerable: name the flaw with file, function and the exact line pattern, such as user input concatenated into SQL or a missing ownership check between auth and fetch. Then check sibling routes in the same file for the same flaw class, because the logs show where the attacker went, not everywhere the bug lives.
- Not vulnerable: name the defense (parameterized query, scoped lookup) with the same precision. Writing it down is mandatory, because it is what turns attack traffic into an `attempted_not_vulnerable` verdict instead of a false positive.
- A fired PoC is the gate for `confirmed_exploited`, and it runs only against a local instance. Seed the local data, start the application in the background with one command that prints its PID, and wait until it answers `curl -s` on `127.0.0.1`, in a script with a timeout or with the Monitor tool. If the default port is busy, use the application's documented override and record the port used.
- Fire the minimal PoC with `curl`: the smallest request that demonstrates the flaw (one row of data, one foreign object), not a rerun of the attacker's campaign. Record the exact command and the relevant slice of the response.
- Where one exists, also fire the negative PoC: the same technique against the route verdicted not vulnerable, to show that it bounces. Then stop the application with `kill <pid>` on the captured PID, not by port or by pattern, which can match a process you did not start.
- If the application cannot run in this environment, say so explicitly. The affected verdicts stay `suspected`, and the report says what to run where. For a library, build the smallest application that exercises it and fire the PoC at that.

## Response to a lead

- Parse the lead into seed entities. An incident id such as `INC-2` gives the IPs, accounts, routes and timeline rows of that entry in `INCIDENTS.json`, and the response works in the same run directory. An alert line gives source IP, rule, path and timestamp. An indicator is the entity itself. Free text gives the observables (who reported, what data, when), and the seed set may be only a route or a table name.
- State the working question in one sentence, for example "did 203.0.113.66's activity against /login succeed, and if not, what did?". All scoping serves that question.
- For each IP pull every request in time order with route, status, size, user agent and authenticated user, and summarize it as phases of behavior. For each route ask who else hit it the same way in the window, because the attacker an alert found may not be the only one.
- For each account pull every login with its IP and every authenticated request, and compare them with the account's own history in the same corpus: a new IP, user agent, volume or hour is signal. A new IP alone is baseline noise, because users roam. Combine it with volume, cadence or what the session did next before treating it as a lead.
- Expand one ring, once: entities found while scoping join the set, such as the account an IP logged into, a second IP on the same account, or the route a session pivoted to. Then merge the error-log and alert-queue rows for all entities into one timeline.
- Did it succeed? Status codes alone do not answer that. A wall of 401 says no. 200s with anomalous sizes, error-then-success progressions and data-shaped responses say yes. State the verdict and the discriminating evidence, with the evidence on both sides.
- Quantify the blast radius: which routes and tables were reached, how many records, over what time span, belonging to how many distinct users. Each figure comes from a pipeline, such as counting exfiltration page sizes, counting the distinct ids walked, or joining walked ids to their owners in the seeded local data.
- Check containment status read-only: is the activity still going at the end of the corpus window, and when was the last attacker action?
- A verdict of "did not succeed" does not end the workup. Say what the attacker was trying and why it failed, which feeds the plan and the `ruled_out` record.
- Root cause and PoC meet the same bar as in a hunt: the flaw or the defense named at file and function precision, sibling routes checked, the minimal and the negative PoC fired locally. Without a runnable application the ceiling is `suspected`, stated explicitly.

## Response plan

- Write the plan to `RESPONSE.md`, or to `RESPONSE-<lead>.md` (for example `RESPONSE-INC-2.md`) when the run directory already holds a `RESPONSE.md` from another lead. Do not overwrite another incident's plan.
- Every action is a proposal for the team that owns the control and carries what, why and risk-if-wrong. Nothing in the plan has been done: a human reviews each action and executes or rejects it.
- Sections, in this order:
  1. Verdict and summary: three sentences on what happened, whether it succeeded and how far it went.
  2. Timeline: the merged entity timeline from scoping.
  3. Containment (proposed): block or deny candidates (IPs, sessions, tokens), accounts to suspend, routes to rate-limit or disable, mapped to the organization's real controls such as WAF rules, identity-provider session revocation or feature flags. Each carries the evidence line that justifies it and what breaks if the call is wrong, such as a blocked NAT address that locks out the legitimate users behind it.
  4. Eradication and remediation (proposed): the code fix at file and function level, handed off as a `vuln` entry that triage can ingest, plus interim mitigations if the fix will take time.
  5. Recovery (proposed): exactly which credentials rotate (the queried list, not "all users"), which customers are notified (the distinct-victim list), and what monitoring confirms the attacker is out.
  6. Detection engineering (proposed): the rules that would have caught this earlier, derived from the discriminating queries that found it, such as error rate per source on a route, sequential-id access cadence or an account at volume from a new IP. Note which existing alerts fired, which were noise, and what that says about the queue. A hunt that does not improve the alert queue gets rerun by hand forever.
  7. Open questions: what this corpus cannot answer, such as earlier history, other log sources or whether stolen data was used elsewhere.
- Then add or enrich the incident in `INCIDENTS.json`, creating the file if it is absent: verdict, quantified impact, root cause, PoC and timeline. Negative outcomes go to `ruled_out`. Extra keys are fine, and upstream's example response adds the blast radius and the containment status to the incident.

## `INCIDENTS.json` and the incident report

```json
{
  "target": "<target name or logs dir>",
  "incidents": [{
    "id": "INC-1",
    "title": "<one line: what happened>",
    "verdict": "confirmed_exploited | suspected",
    "attacker_ips": ["..."],
    "accounts_involved": ["..."],
    "vuln": {"type": "...", "route": "...", "file": "...", "function": "..."},
    "timeline": [{"ts": "...", "event": "..."}],
    "impact": "<what data / how much / whose, every number from a query>",
    "evidence": ["<log file>: <pipeline> -> <result>", "..."],
    "poc": {"command": "...", "verified": true}
  }],
  "ruled_out": [
    {"subject": "...", "verdict": "attempted_not_vulnerable | benign",
     "reason": "<the defense, with file:function, or the benign explanation>"}
  ]
}
```

- Routing: `incidents` holds what happened (`confirmed_exploited`) or might have (`suspected`). Anything verdicted `attempted_not_vulnerable` or `benign` goes in `ruled_out` and not in `incidents`.
- `INCIDENT_REPORT.md` holds an executive summary of at most three sentences, one campaign timeline across all incidents, a section per incident (evidence, source confirmation, PoC transcript, impact), a "Ruled out" section, and the full hypothesis ledger as an appendix. The ledger is the audit trail that makes the hunt reviewable: "we checked, it is clean" is only worth something with the queries attached.

## Handoff to triage and patching

- Confirmed vulnerabilities flow into the same triage and patch loop as static findings. Triage takes `INCIDENTS.json` as its findings file, one finding per entry of `incidents[]`, and does not ingest `ruled_out`.
- The `vuln` entry is what triage and patch read: `type`, `file` and `function`, plus `line` and `mechanism`, two extra keys that upstream's example run adds. An incident without `vuln.file` cannot be located in source, so triage cannot verify it.
- A `confirmed_exploited` verdict tells the triage verifier that the incident arrived execution-verified, not statically guessed.
- Patch from the `true_positive` verdicts in `TRIAGE.json`, not from raw incidents. The `poc.command` of a `confirmed_exploited` incident is the regression check for its fix.
- Write `TRIAGE.json` and `PATCHES/` into the run directory, so that the whole chain sits beside the incidents.

## Scope and limits

- Log-only detection is hard. Upstream presents the track as a method to practice, not as a guarantee of recall on arbitrary corpora.
- Measure recall on your own telemetry with a seeded exercise before hunting unknowns: stand up a disposable copy of a service, plant a known weakness, run a scripted attack, capture the telemetry and write down the ground truth, then hunt it from the telemetry alone. A planted exercise shows whether a miss is the model's failure or the telemetry's.
- Keep the answer key of a seeded exercise (ground truth, grader, the source of a log generator) out of the hunt, and grade only after the write-up. In an interactive hunt that is discipline, not a guarantee. Upstream's pipeline enforces it by building the hunt container without those files.
- Unlike the rest of the interactive method, this track executes target code: it starts the application on `127.0.0.1` to fire PoCs. An interactive hunt is confined by permission prompts only, because a tool allowlist that includes `python3` is effectively arbitrary execution and no sandbox. An unattended hunt needs container isolation.
- Start with telemetry exported to files and shell pipelines, and build integrations only after the method has proven itself on your data. CDN and WAF exports, auth provider logs and endpoint (EDR) threat events fit the same loop as CSV or JSONL.
- For endpoint telemetry the entities are process, host and user instead of IP, session and route, and source confirmation becomes configuration or binary review plus a controlled reproduction. The ladder is unchanged: telemetry alone does not confirm.

Source: adapted from `.claude/skills/dnr-hunt/SKILL.md`, `.claude/skills/dnr-hunt/README.md`, `.claude/skills/dnr-respond/SKILL.md`, `.claude/skills/dnr-respond/README.md`, `docs/detection-response.md`, `docs/best-practices.md`, `README.md` and the `INCIDENTS.json` ingest rules of `.claude/skills/triage/SKILL.md` and `.claude/skills/patch/SKILL.md` of anthropics/defending-code-reference-harness (commit d3bea6b, Apache-2.0).
