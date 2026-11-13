## Rulesets and branch protection

- Rulesets and classic branch protection stack. Nothing has priority: every rule from every source applies, and where two define the same rule the most restrictive version wins. `gh ruleset check <branch>` shows the combined result and `gh ruleset view <id>` one ruleset.
- A ruleset in Evaluate mode reports but does not block.
- Anyone with write access can post a commit status with any name. In a required status check rule, pin the expected source app, or a forged green status satisfies it.
- Dismiss-stale-approvals and require-approval-of-the-most-recent-push also dismiss approvals when the merge base brings in new changes. With either on, a merge commit created locally and pushed to the protected branch is rejected unless it matches the merge GitHub would create.
- Required reviewers by path (teams, up to 15) use gitignore syntax, including `!` negation, which CODEOWNERS does not support.
- Require linear history needs squash or rebase merging allowed. A required merge method that the repository has disabled blocks every merge.
- Commit metadata rules (Enterprise) apply only to new commits. For squash merges only the squash commit is checked. Committer-email patterns must also allow `noreply@github.com`, or merges made on the website fail.
- Push rulesets block file paths, extensions, path lengths and file sizes on private and internal repositories and their whole fork network.
- When a ruleset requires approvals, a pull request that Copilot opens under its own identity needs one more approval than configured (public preview, on by default).
## Required signed commits

- GitHub cannot sign commits created by Rebase and merge, so that method fails on a branch that requires signatures. Squash and merge commits made on GitHub are signed by GitHub.
- GitHub checks every commit of a test merge, so one unsigned commit on the head branch blocks even a squash merge. Re-sign the branch with `git rebase --force-rebase --gpg-sign <base>` and push with a lease.
- When a branch is created, rulesets check only commits not reachable from other branches. Classic protection does not check on creation unless branch creation is restricted.
- With vigilant mode on, unsigned commits show Unverified. A signed commit whose author is not the committer and uses vigilant mode shows Partially verified, which signature rules accept.
- Bot and GitHub App commits are verified only when created through the API without custom author, committer or signature data.

## Merge queues

- Workflows that report required checks must also run on `merge_group` (see concise:github-actions), or the queue waits until the status check timeout and fails. Other CI systems must build branches named `gh-readonly-queue/<base>/...`. The queue tests a merge-group SHA, not the PR head.
- A merge queue cannot be required by a classic protection rule whose branch pattern uses `*`. The ruleset rule Require merge queue exists only at repository level.
- `enqueuePullRequest` (GraphQL) adds a PR only if it can be queued now, without falling back to auto-merge. gh has no command to dequeue: use the `dequeuePullRequest` mutation or the web UI.
- Jumping the queue rebuilds every group in progress. A build concurrency of 0 stops the queue.
- With Only merge non-failing pull requests off, a PR that failed its own checks still merges when a later group containing it passes.

## CODEOWNERS

- GitHub reads the first file it finds in `.github/`, the root, then `docs/`, from the PR's base branch. A PR cannot change its own owners. In a stack the file comes from the stack base.
- The last matching line wins, and it replaces earlier owners instead of adding to them. Put all owners of a pattern on one line, because separate lines keep only the last.
- `!` negation, `[ ]` ranges and `\#` escapes do not work. Lines with bad syntax are skipped and owners without explicit write access are ignored, both silently. List syntax errors with `gh api repos/{owner}/{repo}/codeowners/errors`.
- Teams must be visible and have write access on the repository themselves. Enterprise teams cannot be owners. Paths are case-sensitive and the file must stay under 3 MB.
- Approval from any one owner on the matching line satisfies Require review from Code Owners. To require a specific team, use a ruleset required-reviewers rule.
- A pattern with no owners after it removes ownership for that path.
- Protect the file itself with a line such as `/.github/CODEOWNERS @org/admins`.
- Code owners are not requested on draft PRs until the PR is marked ready.
