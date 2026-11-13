---
name: git
description: Current Git 2.56 and GitHub practice for commits, history rewriting, pushes, signing, pull requests, merging and branch rules. Use when committing, amending, rebasing, squashing or fixing up commits, force-pushing, resolving conflicts, cleaning up branches, working in worktrees, setting up or debugging commit signing (SSH, GPG, gitsign, an Unverified badge), opening, updating or merging PRs with gh, taking a PR to merge once CI is green, stacked PRs and gh stack, merge queues, rulesets, branch protection, CODEOWNERS, push protection blocking a push, removing a secret or file from history with git filter-repo, choosing gitleaks or TruffleHog, release-please versions and release notes, .gitattributes and CRLF line endings, or checking which Git or gh version is current.
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, and a skipped file or page is the usual cause of a wrong result.

1. Read `references/stacked-prs.md` in full with the Read tool (Facts, Commands safe without a TTY, Editing a stack, Exit codes).
2. Read `references/github-rules.md` in full with the Read tool (Rulesets and branch protection, Required signed commits, Merge queues, CODEOWNERS).
3. Read `references/secrets.md` in full with the Read tool (First move, Push protection blocked a push, Purging history, Scanners).
4. Open https://raw.githubusercontent.com/git/git/maint/GIT-VERSION-GEN (Current Git release (`DEF_VER`)) and compare it with the facts below.
5. Open https://github.com/cli/cli/tags.atom (Current gh release) and compare it with the facts below.
6. Open https://docs.github.com/api/article/body?pathname=/en/pull-requests/reference/stacked-pull-requests (Stacked PR rules) and compare it with the facts below.

## Check first

- Run `git version` and `gh --version`. Git older than 2.56.1 (or 2.55.1, 2.54.1, 2.53.1, 2.52.1, 2.51.3, 2.50.2 on older lines) is open to CVE-2026-111760, a remote code execution on recursive clone, and five other CVEs. Tell the user before cloning anything untrusted.
- Run `gh ruleset check <branch>` to see every rule that applies to the target branch, from repo and org rulesets alike. The branch does not need to exist.
- Read the merge settings: `gh api repos/{owner}/{repo} --jq '{allow_squash_merge, allow_rebase_merge, allow_merge_commit, squash_merge_commit_title}'`.
- Find config that changes behavior: `git config --show-origin --get-regexp '^(user|commit|tag|gpg|push|pull|rebase|merge)\.'`. Since Git 2.54 hooks can also come from config files, so list what will run with `git hook list --show-scope pre-commit`.
- Facts verified 2026-11.

## Defaults

- Current releases: Git 2.56.1, gh 2.104.0, gh-stack 0.3.0, git-filter-repo 2.47.0, gitleaks 8.30.1, TruffleHog 3.99.
- Commit only your paths: `git add <new files>`, then `git commit -m '<msg>' -- <paths>`. A bare `git commit` also commits whatever the user had staged before.
- Before the first commit in a repo, read `git log --no-merges -20 --format=%s` and match its language, prefix style and casing. Use Conventional Commits only when the history, a commitlint config or release tooling uses them.
- One commit is one self-contained change that addresses just one thing. It carries its own tests and the files it regenerates, and the build and tests pass after it. A rename, move or reformat goes in its own commit before the change that needs it.
- Size: about 100 changed lines is a normal commit and about 1,000 is too large. Files count too: 200 lines in one file can be fine, spread across 50 files it is too large. A deleted file or a change from a trusted codemod counts as small. When the message body grows long, split the commit.
- Subject: what the commit does, in the imperative mood, about 50 characters, no final period, readable alone in `git log --oneline`. "Fix bug", "Fix build", "Phase 1" and "Address review comments" say nothing.
- Body: what is wrong without the change (present tense), why this approach is right, alternatives you rejected, and what the code cannot show, such as limits and deliberate omissions. Summarize a discussion in the body rather than only linking it.
- Fold review fixes into the commit they fix with `git commit --fixup=<sha>`, unless the repo squash-merges.
- Conventional Commits details: a breaking change takes `!` before the colon or a `BREAKING CHANGE:` footer (uppercase, `BREAKING-CHANGE` is a synonym). Footers are `Token: value` or `Token #value`, with `-` in place of spaces in the token.
- Agent shells have no TTY, so rewrite history without an editor. Fix an older commit with `git commit --fixup=<sha>` and then `git rebase --autosquash <base>`. Since Git 2.44 `--autosquash` works without `-i`.
- `git history` (experimental) edits history in place without a rebase: `fixup <sha>` folds the staged changes into that commit (2.55+) and `drop <sha>` removes one (2.56). `reword` and `split` need an editor or a TTY. The master-branch docs on GitHub already list `squash` and `--gpg-sign`, which 2.56.1 does not have.
- Use `git rebase --update-refs` (or `rebase.updateRefs=true`) when other local branches sit inside the rebased range, so their pointers move too. Branches checked out in another worktree are not moved.
- After resolving conflicts, stage with `git add --resolved` (2.56). It stages only the conflicted paths and stops if a conflict marker is left.
- Before pushing a rewrite, run `git range-diff @{u}...HEAD` to compare the rewritten commits with the pushed ones.
- Force-push only with a lease tied to the commit you rewrote from: `git push --force-with-lease=<branch>:<old-sha> origin <branch>`, or `--force-with-lease --force-if-includes`. Set `push.useForceIfIncludes=true`.
- A squash merge on GitHub takes its default message from the commit title and body when the PR has one commit, and from the PR title when it has two or more, unless the repo sets `squash_merge_commit_title` to `PR_TITLE`. Where release tooling parses Conventional Commits, keep both the PR title and a single commit's subject in that format.
- release-please: a `Release-As: 2.0.0` line in the body of a commit on the default branch forces that version (an empty commit works). To fix the notes of a squash-merged PR, add a `BEGIN_COMMIT_OVERRIDE` ... `END_COMMIT_OVERRIDE` block with the replacement messages to its PR body. That fails for plain merges. A `chore` or `build` commit opens no release PR.
- After a squash or rebase merge, `git branch -d` refuses because the SHAs differ. Prove the content landed with `git cherry -v origin/main <branch>` (no `+` lines) or the merged PR, then use `git branch -D`.
- Worktrees: one branch per worktree. A new worktree has no ignored files (`.env`, `node_modules`, build output). All refs, the stash, hooks, config and `.git/info/exclude` are shared by every worktree. Submodule support in worktrees is incomplete.
- Fix line endings in `.gitattributes`, which overrides every contributor's `core.autocrlf`: `* text=auto`, plus `*.sh text eol=lf` for files that must stay LF on Windows. Then run `git add --renormalize .` and commit the result.
- Signing: prefer SSH. Set `gpg.format=ssh`, `user.signingKey` to the `.pub` path or `key::ssh-ed25519 ...` (a bare `ssh-...` value is deprecated), `commit.gpgSign=true` and `tag.gpgSign=true`, because `commit.gpgSign` does not sign tags.
- Upload the key a second time as a signing key: `gh ssh-key add ~/.ssh/id_ed25519.pub --type signing`. The default type is authentication, which does not verify commits.
- Local checks of SSH signatures need `gpg.ssh.allowedSignersFile`. Without it `git verify-commit` and `git log --show-signature` report failure.
- Diagnose an Unverified badge with `gh api repos/{owner}/{repo}/commits/<sha> --jq .commit.verification`. The `reason` says what to fix: `unverified_email` or `no_user` (committer email is not a verified address on the account), `unknown_key` (key not uploaded as a signing key), `bad_email` (GPG key identities lack that email).
- Create PRs non-interactively: push the branch, then `gh pr create --base <base> --head <branch> --title '<title>' --body-file <file>`. `--head` skips gh's push and fork prompts. Without `--base`, gh uses `branch.<name>.gh-merge-base`, then the default branch.
- Merge with `gh pr merge <n> --squash --match-head-commit <reviewed-sha>` so a push after review cannot slip in.
- On a branch with a merge queue, `gh pr merge` needs no merge method because the queue sets it. It adds the PR to the queue when checks have passed and only turns on auto-merge when they have not. Confirm with `gh pr view <n> --json state,autoMergeRequest,mergeStateStatus`.
- Merge from scripts with the async merge API, `PUT /repos/{owner}/{repo}/pulls/{n}/merge-async` (GA 2026-10-01). It is the only API that merges stacked PRs, and unlike the legacy endpoint it can also queue a PR. It returns 202 with a request UUID to poll, an `enqueued` result is not a merge, and rules are checked when the merge runs, not at request time. Pass `sha` to pin the head.
- Wait for CI with `gh pr checks <n> --watch --fail-fast` (exit code 8 means pending, `--required` limits to required checks). Judge merge readiness by `mergeStateStatus` `CLEAN` on the head you verified, not by the absence of red checks, because a required check that never reported is missing, not failed.

## Gotchas

- A bare `--force-with-lease` compares against your remote-tracking ref. IDEs, gh and background fetches update that ref silently, so the lease passes and the push drops other people's commits. Give the expected SHA or add `--force-if-includes`.
- `--force` turns off every lease check, even when `--force-with-lease` is also on the command line.
- `git history` runs no hooks. Run the pre-commit checks and secret scan yourself after using it.
- `git history` rewrites every local branch that descends from the edited commit. Pass `--update-refs=head` to touch only the current branch, and `--dry-run` to print the ref updates first. In 2.56 it refuses any history that contains a merge and aborts on any conflict.
- Rewrites lose signatures. Rebase, amend and cherry-pick sign again only when `commit.gpgSign` is on or `-S` is passed. `git replay` writes unsigned commits, 2.56 `git history` has no signing option, and `git filter-repo` strips signatures. Branches that require signed commits then reject the push.
- In an agent shell GPG cannot ask for a passphrase and fails with `gpg failed to sign the data`. Ask the user to unlock gpg-agent or to use an SSH key loaded in ssh-agent.
- Closing keywords such as `Fixes #12` act only in PRs that target the default branch, or in commits that land on it. They are ignored while a PR targets another branch, such as a mid-stack PR or a release branch.
- `gh pr merge --admin` merges around the merge queue and the rules. It is a bypass, not a fix for a blocked merge.
- Branch names from other people are shell input. Git allows `$(...)`, backticks and `|` in them, so single-quote them in every command.
- An untrusted clone can contain an embedded bare repository whose hooks fire when a shell prompt runs `git status` in it. Set `git config --global safe.bareRepository explicit`, which becomes the default in Git 3.0, and avoid `--recurse-submodules` on unpatched Git.
- For CI triggers, workflow security (`merge_group`, `pull_request_target`) and reading or rerunning failed checks see concise:github-actions. For `git bisect` see concise:debugging. For reviewing a diff or answering review threads see concise:code-review.
