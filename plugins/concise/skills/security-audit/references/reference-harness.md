# Defending Code Reference Harness

## Contents

- What the repository is and when to use it
- Requirements and commands
- Stages of a run
- Sandbox rules
- Flags and results
- Rate limits and resume
- Duplicates and iteration
- Usage marker
- Porting to another stack
- Open-source targets and other use cases
- Gotchas

## What the repository is and when to use it

- https://github.com/anthropics/defending-code-reference-harness (Apache-2.0) is Anthropic's reference implementation of the find-and-fix loop. This file matches commit `d3bea6b` (2026-08-06), package `vuln-pipeline` 0.2.1. A newer clone may differ, and its `--help` output and `docs/` describe it.
- Its skills in `.claude/skills/` (`/quickstart`, `/threat-model`, `/vuln-scan`, `/triage`, `/patch`, `/customize`, `/dnr-hunt`, `/dnr-respond`) are the upstream form of the method in this skill. They and its `CLAUDE.md` address a Claude Code session opened inside the clone, so from another project read them as documentation of the tool.
- `harness/` is `vuln-pipeline`, the autonomous pipeline (recon, find, verify, report, patch) for memory vulnerabilities in C and C++, built on Docker and ASAN. `dnr_harness/` is `dnr-pipeline`, the autonomous mirror of the log hunt.
- `targets/` holds `canary` (smoke test, 3 planted bugs, about 6 minutes), the CVE demo targets `drlibs`, `alsa` and `htslib` (pinned to vulnerable commits, source fetched during the Docker build) and `dnrcanary` for `dnr-pipeline`.
- It is a reference, not a product. Upstream states that the repository is not maintained, takes no contributions and will not work on every codebase out of the box, and names Claude Security as the managed alternative. Autonomous triage and patching are open problems that it does not fully solve.
- The interactive method of this skill needs no setup, reviews source statically in any language and writes `VULN-FINDINGS.json`. Nothing is built or run, so expect more false positives. The pipeline needs a Python environment, Docker and the sandbox, executes an ASAN-instrumented target and outputs crashing input files with exploitability reports.
- Start with the interactive method, whose artifacts also feed a later port. Move to the pipeline when you want execution-verified proofs of concept (PoCs) or autonomous scale.

## Requirements and commands

- The pipeline needs a Linux host on x86_64 or aarch64 (gVisor requires it and needs no `/dev/kvm`), Docker, Python 3.11 or later, and `sudo` for the one-time setup. On macOS or Windows, run it inside a Linux VM.
- Model API auth comes from the environment, as `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`, or Amazon Bedrock (`CLAUDE_CODE_USE_BEDROCK=1`, `AWS_REGION`, and `AWS_BEARER_TOKEN_BEDROCK`, which upstream prefers, or an access key pair). Vertex AI passthrough is wired but untested and needs `VP_EGRESS_ALLOW` set by hand. Azure is not wired.
- The model is always a runtime argument, `--model` or `VULN_PIPELINE_MODEL`, not target config. Each agent-spawning subcommand takes its own, so `report` and `patch` can run on a cheaper model than discovery.

```bash
git clone https://github.com/anthropics/defending-code-reference-harness
cd defending-code-reference-harness
python3 -m venv .venv && .venv/bin/pip install -e .
./scripts/setup_sandbox.sh            # one-time: installs gVisor, builds the agent images, verifies isolation
export ANTHROPIC_API_KEY=sk-ant-...   # or CLAUDE_CODE_OAUTH_TOKEN, or Bedrock
bin/vp-sandboxed run drlibs --model <model-id> --runs 3 --parallel --stream --auto-focus   # recon -> find -> verify -> report
bin/vp-sandboxed patch results/drlibs/<timestamp>/ --model <model-id>                      # a candidate patch per finding
pip install flask pyyaml                                # dnr demo: flask runs the app, pyyaml runs the grader
python3 targets/dnrcanary/generate_logs.py --seed 42    # required before any dnr run, about 82 MB
bin/vp-sandboxed dnr-pipeline run targets/dnrcanary --model <model-id> [--runs N --parallel]
```

- `setup_sandbox.sh` changes the host and is safe to re-run. With `sudo` it installs `runsc`, registers it in `/etc/docker/daemon.json` and makes the Docker daemon reload its configuration. It creates the `vp-internal` network, starts the `vp-egress-proxy` container, which keeps running afterwards, builds the target and agent images, and verifies isolation.
- `bin/vp-sandboxed` is the entry point for every subcommand, run from the clone root, where target names resolve under `./targets/` and results go to `./results/`. It checks that gVisor is registered and the proxy is running, and stops if either is missing instead of falling back to an unsandboxed run.
- On a new target run a small wave first (`--runs 3 --parallel --stream --max-turns 100`) to see the token burn and whether the prompts land, then scale up. Launch long runs in the background so the logs can be followed.

## Stages of a run

- Build turns the target's `Dockerfile` into an ASAN-instrumented image on the first run. Find, grade and re-attack reuse it, so every agent sees the same code in the same environment.
- Recon (`--auto-focus`, or the `recon` subcommand, which prints `focus_areas` as YAML for review) has an agent read the source and partition the attack surface, so that parallel find agents do not converge on the same bug. Without it a run uses `focus_areas` from the target's `config.yaml`.
- Find runs one agent per run, in its own container, which reads the source, crafts malformed inputs and runs the ASAN binary until an input crashes 3 out of 3 times. Its output is the crashing input file, not a written report.
- Grade (verify in the README) has a second agent in a fresh container re-run the PoC and check that the crash reproduces, lies in project code and is not just memory exhaustion. Only the PoC bytes cross, so the grader is not influenced by the find agent's reasoning or by state it left behind. The verdict lands in `run_NNN/result.json`.
- Judge (dedupe in the README, `--stream` only) has a no-tools agent compare each graded crash with `reports/manifest.jsonl` and decide `NEW`, `DUP_BETTER` (a cleaner example, which is re-reported) or `DUP_SKIP`. Judges run serially, so two duplicates that arrive together are not both called new.
- Report has an agent write, for each new bug, an exploitability analysis from the PoC and the source (primitive, reachability from the real attack surface, heap layout, escalation path, constraints, severity), and a separate grader scores whether its claims rest on evidence. Output is `reports/bug_NN/report.json`.
- Patch, the separate `patch` command, has a patch agent write a diff that a grader in a fresh container, which receives only the diff, applies and climbs the ladder of build (`t0_builds`), the original PoC no longer crashing (`t1_poc_stops`), the test suite (`t2_tests_pass`) and a 50-turn re-attack (`re_attack_clean`). A failing tier feeds its evidence into the next attempt.
- In `dnr-pipeline` the hunt agent's container gets only the application source and the read-only log corpus from the target. It works under the hard rules of the interactive hunt and submits `INCIDENTS.json`. A grade agent in a fresh container, with the answer key, scores it and re-fires every confirmed incident's PoC against a freshly seeded application, because substring checks can be gamed and execution cannot.

## Sandbox rules

- Constraints are enforced in code, not in prompts, because a model uses whatever capabilities it actually has, not only those it was told about. Upstream cites a model that was told it had no network access and fetched from GitHub anyway, and an agent that answered a GitHub issue in the middle of a scan.
- The orchestrator is trusted, runs no target code and no model-chosen commands, and stays on the host. Each agent is a `claude -p` process in its own gVisor container (`--runtime=runsc --network=vp-internal`) beside the target, so its `Read`, `Write` and `Bash` reach only that container, which runs on gVisor's kernel instead of the host's.
- Plain Docker with `runc` is fine for an agent that only reads code, not for one that runs the target, because ordinary containers share the host kernel and a kernel bug triggered by the target can compromise the host. Do not use `--privileged` or host networking either.
- `run`, `recon`, `report`, `patch` and `dnr-pipeline run` exit with `error: refusing to spawn agents outside the sandbox.` when started without `bin/vp-sandboxed`. The wrapper itself stops with `runtime 'runsc' not registered` or `vp-egress-proxy not running on vp-internal`. Each means the sandbox is not set up, and the fix is setup plus the wrapper.
- `--dangerously-no-sandbox` overrides the refusal. Agents then run on the host kernel with full internet access, and their credentials sit in the same container as the target they compile and crash. Upstream allows it for development on a throwaway VM only.
- Mount no credential-bearing paths such as `~/.aws`, `~/.ssh` or `.env` into anything an agent can reach, because the agent, and the target code it runs, can read whatever the container holds. For the same reason do not connect agents to MCP servers or tools that can write to the outside world (production infrastructure, email, cloud storage).
- When the pipeline is driven from a Claude Code session, upstream's rule is that a human approves any action that reaches outside the repository.
- `vp-internal` has no route out except the allowlist proxy, which forwards only to `api.anthropic.com:443` by default. `VP_EGRESS_ALLOW=host-1:443,host-2:443` set before setup replaces that list instead of extending it, so a non-default `ANTHROPIC_BASE_URL` is blocked until listed. A later change means re-running setup, which recreates the proxy and drops live agent connections.
- Setup and attack are separate phases. `docker build` pulls dependencies with normal network access, the image with its pinned base image, commit and dependency versions is the frozen snapshot, and agents attack it with egress to the model API only.
- Target-derived text can carry instructions, since ASAN traces hold function names and file paths from the target's symbol table. In the patch prompt the pipeline wraps such text in `<untrusted_data id="...">` blocks with a random per-prompt id on the opening and the closing tag, and neutralizes closing-tag lookalikes. That is a mitigation, not a guarantee, so every generated diff is reviewed before use.

## Flags and results

- `run <target>` takes `--runs N --parallel` (N concurrent find agents spread over the focus areas), `--auto-focus`, `--stream` (judge and report as each grade lands, recommended, off by default), `--max-turns N` (find-agent turn budget), `--find-only` (no grading, for prompt iteration) and `--results-dir <dir>`.
- `--novelty` (with `run --stream` or `report`) makes the orchestrator host clone the target's `github_url`, so each report can state `FIXED` or `UNFIXED` against upstream. It is off by default so that air-gapped hosts do not reach out. The report container's egress stays restricted either way.
- `--accept-dos` counts DoS-class crashes (`allocation-size-too-big`, stack exhaustion from unbounded recursion) as valid finds. By default agents triage them and keep hunting for memory corruption, so a CVE classified as DoS is not submitted without the flag.
- `--engagement-context <file>` replaces the authorization block in every agent's system prompt with your own scope, saying who authorized the work, which subsystems are in scope and where findings go. The default declares authorized defensive research on an open-source C/C++ target. The fixed preamble about the sandbox stays. A missing file is an error, and an empty one falls back to the default.
- `patch <batch-dir>` takes `--bug N`, `--no-reattack` (skip the re-attack tier), `--style` (advisory style judge that does not gate) and `--max-iterations N` (default 5). The target's `config.yaml` needs `build_command`, or the command errors early. Without `test_command` the test tier is skipped.
- `report <batch-dir>` writes reports for a batch that ran without `--stream`, and `--fresh` redoes existing ones. `dedup <dir>` groups crashes by ASAN signature and spawns no agents.
- Results land in `results/<target>/<timestamp>/`, with `run_NNN/` holding `result.json`, `poc.bin` and the transcripts, a shared `found_bugs.jsonl`, and `reports/` with `bug_NN/report.json`, `manifest.jsonl` (bug ids) and `judge_log.jsonl` (verdicts with reasoning). `patch` adds `bug_NN/patch.diff` and `patch_result.json`. `dnr-pipeline` writes `run_NNN/` even for a single run.
- Everything is written the moment it is produced, so a run can be watched, or stopped early, without losing what it has produced. Count `run_*/result.json` for finished runs, read `found_bugs.jsonl` for crashes so far, and filter a transcript for `"type":"tool_use"` to see each command an agent ran. A stuck find agent slows only itself and can be removed with `docker rm -f find_<target>_<N>`.
- For long unattended runs upstream describes, but does not ship, a supervisor loop in a separate context from the worker. It watches each agent's idle clock, loop signature and spend, nudges on idle, restarts the session on a retry spiral and gates on a cost-per-finding threshold.

## Rate limits and resume

- Plan on about 10K uncached input tokens and 2K output tokens per minute for each running agent, and keep concurrency to about 100 agents per 1M input tokens per minute of rate-limit headroom. Time spent compiling and running the target lowers the rate. Each parallel run also needs about 1 GB of RAM.
- A 429 or 5xx does not kill a run. The Claude CLI retries first, then the pipeline backs off (exponential, capped at 300 seconds) and relaunches the agent with `--resume <session_id>`, which restores the whole conversation, up to 20 times per agent. Runs can stay near provisioned capacity without self-throttling.
- `error_max_turns` is terminal and deliberately not resumed, because a resume would multiply the turn cap. A crash or an `INCIDENTS.json` submitted before the cap is still graded. Raise `--max-turns` and run again.
- A killed batch resumes with `bin/vp-sandboxed run <target> --runs N --resume results/<target>/<ts>/` and the same `--runs N` as the original launch. Runs whose `result.json` says `crash_found`, `crash_rejected` or `no_crash_found` are skipped, runs marked `agent_failed`, `build_failed` or `error` are retried, and `found_bugs.jsonl` and `focus_areas.json` are reused. `report` likewise skips bugs already reported.

## Duplicates and iteration

- Independent agents converge on the lowest-hanging bugs. Find agents share `found_bugs.jsonl` (raw ASAN excerpts, compared by meaning and not by string) and have to submit a `<dup_check>` tag with their reasoning beside `<poc_path>`, or the pipeline rejects the submission. With `--stream` the judge dedupes again by root cause. Neither layer removes every collision.
- `known_bugs` in the target's `config.yaml` is rendered into the find prompt as a do-not-resubmit list. Key each entry on the function name, not the line number, because the same bug crashes at adjacent lines or with different ASAN types depending on the input. Give the crash function, the approximate line range and the crash types seen.
- A second run on an unpatched tree spends most of its budget rediscovering known bugs, so patch first or list them in `known_bugs`. A run dedupes only its own findings, and triage over the whole `results/<target>/` directory collapses duplicates across runs.
- When a finding has a shape that syntax can recognize, have the model write a Semgrep or CodeQL rule for it with the report. The rule sweeps other repositories and runs in CI at almost no cost. It matches syntax, not the cross-file reasoning that found the bug, so it is a floor under a known class and no replacement for the next run.
- For a partial chain, ask one agent "given the primitives you already have, what else do you need to reach the goal?", where the goal can be as broad as remote code execution. Then start a fresh session on the same target to hunt exactly that primitive.
- Keep a `CHEATSHEET.md` (when you find X, how to escalate and what to try next, ranked by hit rate on earlier targets) and a `LESSONS.md` (dead ends and validated chain primitives), and feed both into the find prompt. When a finding lands that an agent should have caught earlier, have the model read its own transcript, explain the miss and write the missing entry.

## Usage marker

- Pipeline agents send the header `anthropic-cyber-runbook: pipeline` and a leading `cyber-runbook/<version>` token in the User-Agent, only when they authenticate directly to the Anthropic API with an API key or OAuth. On Bedrock and Vertex they send no marker. `VULN_PIPELINE_NO_TELEMETRY=1` removes it.
- A Claude Code session opened inside the clone sends the header `anthropic-cyber-runbook: skills`, because the repository's `.claude/settings.json` sets `ANTHROPIC_CUSTOM_HEADERS` under `env`. It is sent with any provider, and on Bedrock it stays between you and AWS. Override that variable in `.claude/settings.local.json` to remove it.
- The marker makes runbook usage attributable in Anthropic's request telemetry. It is static text without request content or any identifier beyond what the request already carries, and it enforces nothing. The pipeline does not pass an `ANTHROPIC_CUSTOM_HEADERS` value from the operator's environment on to its agents.

## Porting to another stack

- The shape is general. An agent crafts an input and runs a target in a sandbox, a detector fires, a second agent verifies and a third analyzes exploitability. Besides the three questions below, a port settles the grading criteria, the report sections, the dedup signature, the signal that a patch worked, and whether C and C++ support is replaced or kept beside the new domain.
- A port answers three questions. What signals a finding (ASAN crash signature, elsewhere an exception, a canary file or a DNS callback), what a PoC looks like (a crashing input file, elsewhere an HTTP request sequence, a transaction list or a test harness), and how the target is built and run (a `Dockerfile` with clang and ASAN, elsewhere your language's build in a container).
- Rewrite the prompts in `harness/prompts/` (`find_prompt.py`, `grade_prompt.py`, `report_prompt.py`, `report_grader_prompt.py`, `judge_prompt.py`, `patch_prompt.py` and the text blocks of `system_prompt.py`), the trace parser `harness/asan.py` behind dedup, judge and novelty, and the target `Dockerfile` template.
- Edit `patch_grade.py` (`_t1_passes()` looks for the substring `AddressSanitizer:`), `report.py` (`_SECTIONS`), `novelty.py`, `config.py`, `artifacts.py`, `dedup.py` and `prompts/recon_prompt.py` lightly. The orchestration in `cli.py`, `agent.py`, `docker_ops.py`, `find.py`, `grade.py`, `recon.py`, `judge.py` and `patch.py` stays as it is.
- `dnr_harness/` imports `agent.py`, `sandbox.py`, `docker_ops.py`, `agent_image.py`, `auth.py`, two helpers of `cli.py` and `load_engagement_context` from `prompts/system_prompt.py`, so an edit to those files changes both pipelines.
- Validate with a canary target, `targets/<domain>-canary/`, holding 2 or 3 planted bugs of the new class, and run `bin/vp-sandboxed run <domain>-canary --model <model-id> --runs 3 --parallel --stream --max-turns 50`. Every planted bug should be found and graded `PASS`, with one `NEW` per distinct bug and `DUP_SKIP` for repeats in `reports/judge_log.jsonl`.
- A new target of the existing kind needs no pipeline code, only a directory under `targets/` with a `Dockerfile` (ASAN build at `-O1`, because `-O0` is too slow and `-O2` and above can optimize bugs away), a `config.yaml` (`image_tag`, `github_url`, `commit`, `binary_path`, `source_root`) and a thin `entry.c` that runs the parser on one input file.
- A `kind: dnr` target (refused by `vuln-pipeline`, required by `dnr-pipeline`) has no `Dockerfile`. Its `config.yaml` names `seed_command`, `app_command` (the application must bind `127.0.0.1` only), `generate_logs_command`, `port`, `logs_dir`, `ground_truth` and `grader`. The loader rejects a `ground_truth` or `grader` path inside `logs_dir` or `app/`, because both are shipped to the hunt container.

## Open-source targets and other use cases

- A finding in an open-source project is a lead, not a report. Before anyone contacts the maintainer, a human reproduces it against a specific release, confirms that the vulnerable path is reachable through the project's real interfaces, and checks that the cited file paths, function names and line numbers exist, because the model can still hallucinate them.
- Report through the private channel named in the project's `SECURITY.md` or `security.txt`, or through GitHub private vulnerability reporting, and say that AI was involved and which parts a human verified. Do not open a public issue while the bug is unfixed, because it discloses the vulnerability before a fix exists. Send the most serious finding first and let the maintainer answer before sending the rest.
- For binary analysis, start with the mitigations (KASLR, SMEP and the like) disabled and add them back one by one, build a dynamic analysis environment, scale with parallel autonomous agents, and add a hardened task verifier plus an agentic verifier against cheating. For embedded devices, give the model the hardware schematics together with the firmware or kernel binary.
- For a backlog, ask which known bugs chain together, because low and medium findings can compose into a critical one, and re-prioritize by the chains. For a bug of unclear impact, have the model attempt exploitation in a sandbox. On a stale backlog, have it downgrade or disprove what it can.

## Gotchas

- `patch` and `report` take a batch directory, `results/<target>/<timestamp>/`, not a target name, and each `run` writes a new one. `--resume` on a multi-run batch is rejected with the default `--runs 1`.
- Bedrock model ids need the inference-profile prefix of your region group (`us.`, `eu.`, `apac.` or `global.`). A bare `anthropic.` id usually fails on the first call with `ValidationException: Invocation of model ID ... with on-demand throughput isn't supported`.
- Set the Bedrock variables before running setup, because the allowlist is derived from them (`bedrock-runtime.<region>.amazonaws.com:443`), and re-run setup after a change of provider or region.
- On Bedrock, `AWS_PROFILE`, `~/.aws` and instance-profile credentials do not reach the agents, by design. Put credentials in the environment, and scope an access key to `bedrock:InvokeModel*`, because the agent process can see it.
- Thinking tokens count against the output limit. On a hard turn they can use up a 16K budget, the response stops with `stop_reason: max_tokens` before the tool call is emitted, and the transcript shows a stalled or failed tool call. Raise the limit with `export CLAUDE_CODE_MAX_OUTPUT_TOKENS=32000`.
- When editing harness code, keep `-e CLAUDECODE=` and `-e IS_SANDBOX=1` in `agent.py`. The first stops the nested-session check of the CLI inside the container, and the second lets it accept `--permission-mode bypassPermissions`. `--tools` restricts the available tools, while `--allowedTools` is only a permission allowlist.

Source: adapted from `README.md`, `CLAUDE.md`, `DEMO.md`, `harness/README.md`, `targets/README.md`, `docs/pipeline.md`, `docs/security.md`, `docs/agent-sandbox.md`, `docs/customizing.md`, `docs/troubleshooting.md`, `docs/other-use-cases.md`, `docs/best-practices.md`, `docs/detection-response.md`, `docs/patching.md`, `docs/blog-post.md`, `.claude/skills/customize/SKILL.md`, `.claude/skills/quickstart/SKILL.md`, `harness/prompts/system_prompt.py`, `harness/prompts/untrusted.py`, `harness/cli.py`, `harness/sandbox.py`, `bin/vp-sandboxed`, `scripts/setup_sandbox.sh`, `pyproject.toml` and `.claude/settings.json` of anthropics/defending-code-reference-harness (commit d3bea6b, Apache-2.0).
