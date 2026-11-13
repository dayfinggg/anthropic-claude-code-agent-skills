## Detect the format

- `.specify/` plus `specs/NNN-name/` is Spec Kit (specify-cli 1.4.0).
- `.kiro/specs/<name>/` plus `.kiro/steering/` is Kiro.
- `openspec/specs/` plus `openspec/changes/` is OpenSpec (2.0.0).

## Spec Kit

- Install with `uv tool install specify-cli` (Python 3.11+). In an existing repo, commit first, then run `specify init --here --force --integration claude`, because `--force` may replace files at managed paths. Add numbered feature branches only through `specify extension add git`.
- For Claude Code it installs skills at `.claude/skills/speckit-<command>/SKILL.md`, invoked as `/speckit-specify`. The docs write them as `/speckit.specify`. Pass `--integration-options="--no-model-invocation"` to keep their descriptions out of the skill listing.
- Flow: `/speckit-constitution` once, writing `.specify/memory/constitution.md`. Then per feature `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement` and `/speckit-converge`, repeating implement and converge until converge reports Converged. Optional gates are `/speckit-clarify` before plan, `/speckit-checklist`, and `/speckit-analyze` before implement.
- Per feature it writes `specs/NNN-name/spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `tasks.md` and `checklists/`.
- The active feature comes from `.specify/feature.json` or `SPECIFY_FEATURE_DIRECTORY`, not from the Git branch. `git checkout` does not switch features.
- `spec.md` holds the what and why. The tech stack goes in the arguments of `/speckit-plan`.
- Analyze never edits files. Converge never edits code and only appends tasks to `tasks.md`.
- A checked item in a custom checklist means a reviewer approved the requirement's quality. Implement asks before passing unchecked items and must not tick them.
- Put into the constitution only principles already true in the repo or agreed by the team, with its docs, ADRs and CI as evidence. An invented rule becomes noise in every later gate.
- In an existing project, specify the next bounded change. Do not start by specifying the whole existing system.

## Kiro

- A spec is `.kiro/specs/<feature>/` with `requirements.md` (or `bugfix.md` for a bug), `design.md` and `tasks.md`. Keep one spec per feature, not one per repo.
- Requirements use EARS form: `WHEN <condition or event> THE SYSTEM SHALL <behavior>`.
- When requirements change, update `requirements.md`, then `design.md`, then regenerate the tasks (Sync Files in the IDE).
- Steering lives in `.kiro/steering/`. `product.md`, `tech.md` and `structure.md` load in every interaction. Add one focused file per topic.
- Steering front matter sets loading: `inclusion: always` (the default), `fileMatch` with `fileMatchPattern`, `manual` (pulled in with `#name` in chat), or `auto` with `name` and `description`. The front matter must be the very first content of the file.
- `#[[file:relative/path]]` in a steering file pulls in a live file instead of a copy that goes stale.

## OpenSpec

- 2.0.0 (2026-11-11) installs skills once in `.agents/skills/`, with links from `.claude/skills/`, and removed the `/opsx:*` commands: `/opsx:propose` is now `/openspec-propose`. Move a 1.x project with `openspec update` (preview with `--dry-run`) and commit the result. It overwrites edits made inside its own skills.
- Install from npm as `@fission-ai/openspec` (Node 22.12+) or with Homebrew as `openspec`, then run `openspec init --tools claude`.
- `openspec/specs/<capability>/spec.md` describes current behavior. A change is `openspec/changes/<change-id>/` with `proposal.md`, `design.md`, `tasks.md`, `.openspec.yaml` and delta specs under `specs/`. Archiving merges the deltas and moves the folder to `changes/archive/YYYY-MM-DD-<change-id>/`.
- Default flow: `/openspec-explore` when the approach is open, `/openspec-propose <change-id>`, `/openspec-apply-change`, `/openspec-archive-change`.
- Each requirement is `### Requirement: <name>` with `#### Scenario:` blocks of WHEN and THEN bullets.
- A delta has `## ADDED Requirements` (appended), `## MODIFIED Requirements` (replaces the old requirement, so write its complete new text with every scenario) and `## REMOVED Requirements` (with a reason). Marking a changed requirement as added leaves two competing requirements.
- A change without spec deltas fails validation unless `.openspec.yaml` sets `skip_specs: true`, which suits refactors, tooling and docs. Removing a capability's last requirement needs `retire_capabilities: true`.
- Agents run `openspec validate <change-id> --strict --json`, `openspec list --json`, `openspec show <item> --json` and `openspec archive <change-id> --yes`. Without `--yes`, archive waits for a prompt that a non-interactive run cannot answer. `openspec validate --archived` fails when an archived change has unchecked tasks.
- Give each change one intent that fits in one sentence.
