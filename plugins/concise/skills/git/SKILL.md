---
name: git
description: Git and GitHub practice for commits and commit messages, history rewriting, force-pushes, commit signing, pull requests, merges and branch rules. Use when committing, rebasing, squashing, resolving conflicts, cleaning up branches or worktrees, opening or merging PRs with gh, when a push or merge is blocked, a commit shows Unverified, a secret landed in history, or line endings break on Windows.
---

# Git and GitHub

This skill matches Git 2.56, gh 2.104 and gh-stack 0.3. Run `git version` and `gh --version` first. Where the installed release is newer, its own `--help` and release notes are right about commands and flags.

## References

Each file below holds what this page only names. Read it in full with the Read tool before the first step its condition describes, also when that step comes late in a long task or after a compaction.

- [references/stacked-prs.md](references/stacked-prs.md): read when creating, updating, syncing, restructuring or merging stacked PRs, or when a `gh stack` command fails.
- [references/github-rules.md](references/github-rules.md): read when a merge or push is blocked, or when setting up or debugging rulesets, merge queues, required checks, required signatures or CODEOWNERS.
- [references/secrets.md](references/secrets.md): read when push protection blocks a push, a secret was committed or pushed, history must be purged, or a secret scanner must be chosen or run.

## Check first

- Git older than 2.56.1 (or 2.55.1, 2.54.1, 2.53.1, 2.52.1, 2.51.3, 2.50.2 on older lines) is open to CVE-2026-111760, a remote code execution on recursive clone, and five other CVEs. Tell the user before cloning anything untrusted.
- `gh ruleset check <branch>` shows every rule that applies to the target branch, from repository and organization rulesets alike. The branch does not need to exist.
- Read the merge settings: `gh api repos/{owner}/{repo} --jq '{allow_squash_merge, allow_rebase_merge, allow_merge_commit, squash_merge_commit_title}'`.
- Find config that changes behavior: `git config --show-origin --get-regexp '^(user|commit|tag|gpg|push|pull|rebase|merge)\.'`. Since Git 2.54 hooks can also come from config files, so list what will run with `git hook list --show-scope pre-commit`.

## Commits

- Commit only your paths: `git add <new files>`, then `git commit -m '<msg>' -- <paths>`. A bare `git commit` also commits whatever the user had staged before.
- Message format: follow the project's written rule or commit tooling (commitlint, release-please) when there is one. Otherwise write [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/): `<type>(<optional scope>): <description>`, then an optional body and footers. `feat` adds a feature and `fix` repairs a bug. Other common types are `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` and `revert`. Older commits in another style are not a reason to copy that style.
- A breaking change takes `!` before the colon or a `BREAKING CHANGE:` footer (uppercase, `BREAKING-CHANGE` is a synonym). Footers are `Token: value` or `Token #value`, with `-` in place of spaces in the token.
- Stamp every commit with how it was verified, in a `Verified:` trailer in the last paragraph of the message: the check and what it showed, on one line of about fifteen words, such as `Verified: npm test, 48 passed, checkout reaches the confirmation page`, or `Verified: none` with the reason, such as `Verified: none (docs only)`. List unverified commits with `git log --format='%h %(trailers:key=Verified,valueonly,separator=%x2C )'`. Where the project has its own trailer for this, use that instead.
- Description: what the commit does, in the imperative mood, about 50 characters, no final period, readable alone in `git log --oneline`. "Fix bug", "Phase 1" and "Address review comments" say nothing.
- Body: only when the description cannot carry the reason. Then two to five lines on what is wrong without the change and why this approach is right, with what the code cannot show, such as a limit or a deliberate omission. The history of the search, timestamps, measurements and file lists stay out, because the diff and the task record hold them. Write it in plain words, as the output style asks.
- One commit is one self-contained change with its own tests and regenerated files, and the build and tests pass after it. A rename, move or reformat goes in its own commit before the change that needs it. About 100 changed lines is normal and about 1,000 is too large.
- Fold review fixes into the commit they fix with `git commit --fixup=<sha>`, unless the repository squash-merges.

## Rewriting history and pushing

- Agent shells have no TTY, so rewrite history without an editor: `git commit --fixup=<sha>`, then `git rebase --autosquash <base>`. Since Git 2.44 `--autosquash` works without `-i`.
- `git history` (experimental) edits history in place without a rebase: `fixup <sha>` folds the staged changes into that commit (2.55+) and `drop <sha>` removes one (2.56). `reword` and `split` need an editor or a TTY. The master-branch docs already list `squash` and `--gpg-sign`, which 2.56.1 does not have.
- Use `git rebase --update-refs` (or `rebase.updateRefs=true`) when other local branches sit inside the rebased range, so their pointers move too. Branches checked out in another worktree are not moved.
- After resolving conflicts, stage with `git add --resolved` (2.56). It stages only the conflicted paths and stops if a conflict marker is left.
- Before pushing a rewrite, compare the rewritten commits with the pushed ones: `git range-diff @{u}...HEAD`.
- Force-push only with a lease tied to the commit you rewrote from: `git push --force-with-lease=<branch>:<old-sha> origin <branch>`, or `--force-with-lease --force-if-includes`. Set `push.useForceIfIncludes=true`.
- After a squash or rebase merge, `git branch -d` refuses because the SHAs differ. Prove the content landed with `git cherry -v origin/main <branch>` (no `+` lines) or the merged PR, then use `git branch -D`.

## Pull requests and merging

- Create PRs without prompts: push the branch, then `gh pr create --base <base> --head <branch> --title '<title>' --body-file <file>`. `--head` skips gh's push and fork prompts. Without `--base`, gh uses `branch.<name>.gh-merge-base`, then the default branch.
- Merge with `gh pr merge <n> --squash --match-head-commit <reviewed-sha>` so a push after review cannot slip in.
- A squash merge on GitHub takes its default message from the commit title and body when the PR has one commit, and from the PR title when it has two or more, unless the repository sets `squash_merge_commit_title` to `PR_TITLE`. Where release tooling parses commit messages, keep both the PR title and a single commit's subject in that format.
- On a branch with a merge queue, `gh pr merge` needs no merge method because the queue sets it. It adds the PR to the queue when checks have passed and only turns on auto-merge when they have not. Confirm with `gh pr view <n> --json state,autoMergeRequest,mergeStateStatus`.
- Merge from scripts with the async merge API, `PUT /repos/{owner}/{repo}/pulls/{n}/merge-async`. It is the only API that merges stacked PRs, and unlike the legacy endpoint it can also queue a PR. It returns 202 with a request UUID to poll, an `enqueued` result is not a merge, and rules are checked when the merge runs. Pass `sha` to pin the head.
- Wait for CI with `gh pr checks <n> --watch --fail-fast` (exit code 8 means pending, `--required` limits to required checks). Judge merge readiness by `mergeStateStatus` `CLEAN` on the head you verified, because a required check that never reported is missing, not failed.
- release-please: a `Release-As: 2.0.0` line in the body of a commit on the default branch forces that version (an empty commit works). To fix the notes of a squash-merged PR, add a `BEGIN_COMMIT_OVERRIDE` ... `END_COMMIT_OVERRIDE` block with the replacement messages to its PR body. A `chore` or `build` commit opens no release PR.

## Signing

- Prefer SSH signing. Set `gpg.format=ssh`, `user.signingKey` to the `.pub` path or `key::ssh-ed25519 ...` (a bare `ssh-...` value is deprecated), `commit.gpgSign=true` and `tag.gpgSign=true`, because `commit.gpgSign` does not sign tags.
- Upload the key a second time as a signing key: `gh ssh-key add ~/.ssh/id_ed25519.pub --type signing`. The default type is authentication, which does not verify commits.
- Local checks of SSH signatures need `gpg.ssh.allowedSignersFile`. Without it `git verify-commit` and `git log --show-signature` report failure.
- Diagnose an Unverified badge with `gh api repos/{owner}/{repo}/commits/<sha> --jq .commit.verification`. The `reason` says what to fix: `unverified_email` or `no_user` (the committer email is not a verified address on the account), `unknown_key` (the key is not uploaded as a signing key), `bad_email` (the GPG key identities lack that email).

## Worktrees and line endings

- One branch per worktree. A new worktree has no ignored files (`.env`, `node_modules`, build output). All refs, the stash, hooks, config and `.git/info/exclude` are shared by every worktree. Submodule support in worktrees is incomplete.
- Fix line endings in `.gitattributes`, which overrides every contributor's `core.autocrlf`: `* text=auto`, plus `*.sh text eol=lf` for files that must stay LF on Windows. Then run `git add --renormalize .` and commit the result.

## Gotchas

- A bare `--force-with-lease` compares against your remote-tracking ref. IDEs, gh and background fetches update that ref silently, so the lease passes and the push drops other people's commits. Give the expected SHA or add `--force-if-includes`.
- `--force` turns off every lease check, even when `--force-with-lease` is also on the command line.
- `git history` runs no hooks, so run the pre-commit checks and the secret scan yourself after using it. It rewrites every local branch that descends from the edited commit: pass `--update-refs=head` to touch only the current branch and `--dry-run` to print the ref updates first. In 2.56 it refuses any history that contains a merge and aborts on any conflict.
- Rewrites lose signatures. Rebase, amend and cherry-pick sign again only when `commit.gpgSign` is on or `-S` is passed. `git replay` writes unsigned commits, 2.56 `git history` has no signing option, and `git filter-repo` strips signatures. Branches that require signed commits then reject the push.
- In an agent shell GPG cannot ask for a passphrase and fails with `gpg failed to sign the data`. Ask the user to unlock gpg-agent or to use an SSH key loaded in ssh-agent.
- Closing keywords such as `Fixes #12` act only in PRs that target the default branch, or in commits that land on it. They are ignored while a PR targets another branch, such as a mid-stack PR or a release branch.
- `gh pr merge --admin` merges around the merge queue and the rules. It is a bypass, not a fix for a blocked merge.
- Branch names from other people are shell input. Git allows `$(...)`, backticks and `|` in them, so single-quote them in every command.
- An untrusted clone can contain an embedded bare repository whose hooks fire when a shell prompt runs `git status` in it. Set `git config --global safe.bareRepository explicit` and avoid `--recurse-submodules` on unpatched Git.

Related skills: concise:github-actions for CI triggers, workflow security and failed checks, concise:debugging for `git bisect`, concise:code-review for reviewing a diff or answering review threads.
