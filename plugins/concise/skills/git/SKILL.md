---
name: git
description: Load before the first git commit, rebase, merge, push or branch cleanup in a task, before writing a commit message, resolving a conflict or opening or merging a pull request with gh, and when a push or merge is blocked by a rule, a commit shows Unverified, a secret landed in history or line endings break on Windows. Failing CI checks belong to github-actions.
---

# Git and GitHub

This skill matches Git 2.56, gh 2.104 and gh-stack 0.3. Run `git version` and `gh --version` first. Where the installed release is newer, its own `--help` and release notes are right about commands and flags.

## References

- Read [references/stacked-prs.md](references/stacked-prs.md) when you create, update, sync, restructure or merge stacked PRs, or when a `gh stack` command fails.
- Read [references/github-rules.md](references/github-rules.md) when a merge or push is blocked, or when you set up or debug rulesets, merge queues, required checks, required signatures or CODEOWNERS.
- Read [references/secrets.md](references/secrets.md) when push protection blocks a push, a secret was committed or pushed, history must be purged, or a secret scanner must be chosen or run.

## Check first

- Git older than 2.56.1 (or 2.55.1, 2.54.1, 2.53.1, 2.52.1, 2.51.3 and 2.50.2 on older lines) is open to CVE-2026-111760, a remote code execution on recursive clone, and five other CVEs. On such a version, tell the user before you clone anything untrusted, and leave out `--recurse-submodules`.
- Before you push to or merge into a shared branch, run `gh ruleset check <branch>`, which shows every repository and organization rule that applies to it, even before the branch exists.
- Before you pick a merge method or fold review fixes, read the merge settings with `gh api repos/{owner}/{repo} --jq '{allow_squash_merge, allow_rebase_merge, allow_merge_commit, squash_merge_commit_title}'`.
- Before the first commit, find the config that changes commits, pushes and merges with `git config --show-origin --get-regexp '^(user|commit|tag|gpg|push|pull|rebase|merge)\.'`. Git 2.54 and later also read hooks from config files, so list what will run with `git hook list --show-scope pre-commit`.

## Commits

- Commit only your own paths with `git add <new files>` and then `git commit -m '<msg>' -- <paths>`, because a bare `git commit` also takes whatever the user had staged.
- Follow the project's written commit rule or its commit tooling, such as commitlint or release-please. Without one, write [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), also when older commits use another style.
- End every commit message with a `Verified:` trailer in its last paragraph that names the check and what it showed in one short line, such as `Verified: npm test, 48 passed, checkout reaches the confirmation page`, or `Verified: none` with the reason, such as `Verified: none (docs only)`. Where the project has its own trailer for this, use that one. `git log --format='%h %(trailers:key=Verified,valueonly,separator=%x2C )'` lists the trailers, which shows unverified commits.
- Write the description as an imperative of about 50 characters, with no final period, that says what the change does when read alone in `git log --oneline`.
- Add a body only when the description cannot carry the reason, in two to five plain lines on what is wrong without the change, why this approach is right, and what the code cannot show, such as a limit or a deliberate omission. The history of the search, timestamps, measurements and file lists stay out, because the diff and the task record hold them.
- Make each commit one self-contained change with its tests and regenerated files, after which the build and tests pass. A rename, move or reformat goes in its own commit first. About 100 changed lines is normal and about 1,000 is too large.

## Rewriting history and pushing

- Unless the repository squash-merges, fold a review fix into the commit it fixes with `git commit --fixup=<sha>` and `git rebase --autosquash <base>`, which needs no `-i` or editor since Git 2.44.
- `git history` (experimental) edits commits in place without a rebase. `git history fixup <sha>` (2.55+) folds the staged changes into that commit and `git history drop <sha>` (2.56) removes one, while `reword` and `split` need an editor or a TTY. The master-branch docs list `squash` and `--gpg-sign`, which 2.56.1 does not have.
- Pass `--update-refs` to `git rebase`, or set `rebase.updateRefs=true`, when other local branches sit inside the rebased range, so their pointers move too. Branches checked out in another worktree stay where they are.
- After resolving conflicts, stage with `git add --resolved` (2.56), which stages only the conflicted paths and stops if a conflict marker is left.
- Before pushing a rewrite, compare it with the pushed commits using `git range-diff @{u}...HEAD`.
- Force-push only with a lease on the commit you rewrote from, `git push --force-with-lease=<branch>:<old-sha> origin <branch>`, or with `--force-with-lease --force-if-includes`, where `push.useForceIfIncludes=true` adds the second flag automatically.
- After a squash or rebase merge, `git branch -d` refuses because the SHAs differ. Prove the content landed with `git cherry -v origin/main <branch>` (no `+` lines) or the merged PR, then use `git branch -D`.

## Pull requests and merging

- Push the branch, then run `gh pr create --base <base> --head <branch> --title '<title>' --body-file <file>`, where `--head` skips gh's push and fork prompts. Without `--base`, gh uses `branch.<name>.gh-merge-base` and then the default branch.
- Merge with `gh pr merge <n> --squash --match-head-commit <reviewed-sha>`, or the repository's method, so a push after the review cannot slip in.
- A squash merge on GitHub takes its default message from the commit title and body when the PR has one commit, and from the PR title when it has more, unless the repository sets `squash_merge_commit_title` to `PR_TITLE`. Where release tooling parses commit messages, keep both the PR title and a single commit's subject in its format.
- On a branch with a merge queue, `gh pr merge` needs no merge method because the queue sets it. It queues the PR when checks have passed and only turns on auto-merge when they have not, so confirm with `gh pr view <n> --json state,autoMergeRequest,mergeStateStatus`.
- Merge from scripts with the async merge API, `PUT /repos/{owner}/{repo}/pulls/{n}/merge-async`, with `sha` to pin the head. It is the only API that merges stacked PRs, and unlike the legacy endpoint it can queue a PR. It returns 202 with a request UUID to poll, an `enqueued` result is not a merge, and rules are checked when the merge runs.
- Wait for CI with `gh pr checks <n> --watch --fail-fast` started with `run_in_background`, where exit code 8 means pending and `--required` limits it to required checks. Judge merge readiness by `mergeStateStatus` `CLEAN` on the head you verified, because a required check that never reported is missing rather than failed.
- release-please forces a version from a `Release-As: 2.0.0` line in the body of a commit on the default branch, and an empty commit works. To fix the notes of a squash-merged PR, add a `BEGIN_COMMIT_OVERRIDE` ... `END_COMMIT_OVERRIDE` block with the replacement messages to its PR body. A `chore` or `build` commit opens no release PR.

## Signing

- Prefer SSH signing with `gpg.format=ssh`, `user.signingKey` set to the `.pub` path or `key::ssh-ed25519 ...` (a bare `ssh-...` value is deprecated), `commit.gpgSign=true` and `tag.gpgSign=true`, because `commit.gpgSign` does not sign tags.
- Upload the key again as a signing key with `gh ssh-key add ~/.ssh/id_ed25519.pub --type signing`, because the default type, authentication, does not verify commits.
- Without `gpg.ssh.allowedSignersFile`, `git verify-commit` and `git log --show-signature` report every SSH signature as failed.
- Diagnose an Unverified badge with `gh api repos/{owner}/{repo}/commits/<sha> --jq .commit.verification`. Its `reason` is `unverified_email` or `no_user` when the committer email is not a verified address on the account, `unknown_key` when the key is not uploaded as a signing key, and `bad_email` when the GPG key identities lack that email.

## Worktrees and line endings

- A new worktree has no ignored files such as `.env`, `node_modules` or build output, while refs, the stash, hooks, config and `.git/info/exclude` are shared by all worktrees. Submodule support in worktrees is incomplete.
- Fix line endings in `.gitattributes`, which overrides every contributor's `core.autocrlf`, with `* text=auto` plus `*.sh text eol=lf` for files that must stay LF on Windows, then commit the result of `git add --renormalize .`.

## Gotchas

- A bare `--force-with-lease` compares against your remote-tracking ref, which IDEs, gh and background fetches update silently, so the lease passes and the push drops other people's commits. `--force` anywhere on the command line turns every lease check off.
- `git history` runs no hooks, so run the pre-commit checks and the secret scan yourself after it. It rewrites every local branch that descends from the edited commit unless you pass `--update-refs=head`, and `--dry-run` prints the ref updates first. In 2.56 it refuses any history that contains a merge and aborts on any conflict.
- Rewrites lose signatures. Rebase, amend and cherry-pick sign again only with `commit.gpgSign` on or `-S`, while `git replay`, 2.56 `git history` and `git filter-repo` write unsigned commits, which a branch that requires signatures rejects. Re-sign with `git rebase --force-rebase --gpg-sign <base>` before the push.
- In an agent shell GPG cannot ask for a passphrase and fails with `gpg failed to sign the data`. Ask the user to unlock gpg-agent, or sign with an SSH key loaded in ssh-agent.
- Closing keywords such as `Fixes #12` act only in PRs that target the default branch or in commits that land on it, and are ignored while a PR targets another branch, such as a mid-stack PR or a release branch.
- `gh pr merge --admin` merges around the merge queue and the rules, so use it only when the user asks for that bypass.
- Git allows `$(...)`, backticks and `|` in branch names, so single-quote another person's branch name in every command.
- An untrusted clone can contain an embedded bare repository whose `core.fsmonitor` setting runs a command when a shell prompt runs `git status` in it. Set `git config --global safe.bareRepository explicit` before you work in one.

Related skills: concise:github-actions for CI triggers, workflow security and failed checks, concise:debugging for `git bisect`, concise:code-review for reviewing a diff or answering review threads.
