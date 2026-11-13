## First move

- If the secret is real and has left the machine (pushed, shared, in CI logs), the user must revoke or rotate it first. Rewriting history does not un-leak it: clones, forks, PR refs and cached views keep the old commits, and GitHub can still serve them by SHA until Support purges them.

## Push protection blocked a push

- Remove the secret from every commit in the push. A new commit that deletes it does not unblock the push, because the earlier commits still carry it.
- Secret only in the last commit: fix the file, then `git commit --amend --all`.
- Secret introduced earlier: fix the file, stage the change, then `git history fixup <first-sha-with-secret>` (Git 2.55+), or `git commit --fixup=<sha>` followed by `git rebase --autosquash <sha>~`. Then push again.
- The block lists at most five secrets per push. Push again after fixing them to see the rest.
- A secret that already has an alert in the repository is not blocked again, so a push that passes is not proof of a clean history.
- With `push.default` set to `matching`, or a push of several refs, other branches with secrets can block the push.
- The bypass link in the error works only for the user who pushed and expires after three hours. Bypassing creates an alert and emails the admins.
## Purging history

- Purge only when rotation is not enough. Everyone else must stop pushing during the cleanup.
- Use git-filter-repo 2.47+ in a fresh clone: `git filter-repo --sensitive-data-removal --invert-paths --path <path>` with a `--path` for every path the file ever had, or `--replace-text <file-of-strings>`.
- `--sensitive-data-removal` first fetches all refs and can discard local-only work, which is why a fresh clone is used. `--no-fetch` keeps local work but can leave the secret in other refs.
- Count the affected PRs before pushing: `grep -c '^refs/pull/.*/head$' .git/filter-repo/changed-refs`. Pushing makes the rewrite irreversible.
- Push with `git push --force --mirror origin`. Pushes to `refs/pull/*` fail, which is expected. Other failures usually mean force-push protection that must be lifted for the cleanup.
- Then send GitHub Support the repository, the affected PR count, the First Changed Commit(s) line from the filter-repo output and any LFS orphan list. Only Support can purge cached views, PR refs and unreachable objects, and forks keep their copies.
- Collaborators must re-clone, or rebase their old branches onto the new history. One merge of an old branch brings the secret back.
- The rewrite strips commit and tag signatures from every rewritten commit, including ones older than the secret.

## Scanners

- gitleaks 8.30: `gitleaks git` scans every ref by default (`git log -p --all`). `--log-opts` replaces that, so `--log-opts='origin/main..HEAD'` scans only those commits. Use `gitleaks git --pre-commit --staged` for staged changes, `gitleaks dir` for files and `gitleaks stdin` for piped text. The `detect` and `protect` commands are deprecated since 8.19. Add `--redact` so findings do not print the secret.
- TruffleHog 3.99 (AGPL-3.0) verifies findings by sending each credential to its provider's API. Use `--no-verification` when the credential must not leave the machine.
- TruffleHog `--results=verified` hides real secrets whose verification failed or is not supported. The default reports verified, unverified and unknown results. `--fail` exits with 183 when results are found.
- `trufflehog github-experimental --repo <url> --object-discovery` finds deleted and hidden commits that stay reachable through the fork network. Enumeration takes from twenty minutes to hours.
- Inline allow comments (`gitleaks:allow`, `trufflehog:ignore`) hide a finding for everyone. Add them only for confirmed test values.
