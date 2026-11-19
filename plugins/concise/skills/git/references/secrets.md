# Secrets in a repository: blocked pushes, purging history and scanners

## First move

- When the secret is real and has left the machine (pushed, shared, in CI logs), the user must revoke or rotate it first. Rewriting history does not un-leak it, because clones, forks, PR refs and cached views keep the old commits, and GitHub can still serve them by SHA until Support purges them.

## Push protection blocked a push

- Remove the secret from every commit in the push. A new commit that deletes it does not unblock the push, because the earlier commits still carry it.
- When only the last commit has it, fix the file and run `git commit --amend --all`.
- When an earlier commit introduced it, fix the file, stage the change, and run `git history fixup <first-sha-with-secret>` (Git 2.55+), or `git commit --fixup=<sha>` followed by `git rebase --autosquash <sha>~`. Then push again.
- The block lists at most five secrets per push, so push again after fixing them to see the rest.
- A secret that already has an alert in the repository is not blocked again, so a push that passes does not prove a clean history.
- With `push.default` set to `matching`, or a push of several refs, other branches with secrets can block the push.
- The bypass link in the error works only for the user who pushed and expires after three hours. Bypassing creates an alert and emails the admins.

## Purging history

- Purge only when rotation is not enough, and have everyone else stop pushing during the cleanup.
- Use git-filter-repo 2.47+ in a fresh clone, with `git filter-repo --sensitive-data-removal --invert-paths --path <path>` and a `--path` for every path the file ever had, or with `--replace-text <file-of-strings>`.
- `--sensitive-data-removal` first fetches all refs and can discard local-only work, hence the fresh clone. `--no-fetch` keeps local work but can leave the secret in other refs.
- Count the affected PRs with `grep -c '^refs/pull/.*/head$' .git/filter-repo/changed-refs` before pushing, because the push makes the rewrite irreversible.
- Push with `git push --force --mirror origin`. Pushes to `refs/pull/*` fail as expected, and other failures usually mean force-push protection that must be lifted for the cleanup.
- Then send GitHub Support the repository, the affected PR count, the First Changed Commit(s) line from the filter-repo output and any LFS orphan list. Only Support can purge cached views, PR refs and unreachable objects, and forks keep their copies.
- Collaborators must re-clone, or rebase their old branches onto the new history, because one merge of an old branch brings the secret back.
- The rewrite strips commit and tag signatures from every rewritten commit, including ones older than the secret.

## Scanners

- gitleaks 8.30 `gitleaks git` scans every ref by default (`git log -p --all`), and `--log-opts` replaces that, so `--log-opts='origin/main..HEAD'` scans only those commits. Use `gitleaks git --pre-commit --staged` for staged changes, `gitleaks dir` for files and `gitleaks stdin` for piped text, since `detect` and `protect` are deprecated since 8.19. Add `--redact` so findings do not print the secret.
- TruffleHog 3.99 (AGPL-3.0) verifies findings by sending each credential to its provider's API, so use `--no-verification` when the credential must not leave the machine.
- TruffleHog `--results=verified` hides real secrets whose verification failed or is not supported, while the default reports verified, unverified and unknown results. `--fail` exits with 183 when results are found.
- `trufflehog github-experimental --repo <url> --object-discovery` finds deleted and hidden commits that stay reachable through the fork network, and enumeration takes from twenty minutes to hours.
- Inline allow comments (`gitleaks:allow`, `trufflehog:ignore`) hide a finding for everyone, so add them only for confirmed test values.
