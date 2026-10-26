---
name: commits
description: Writes commit messages, shapes commits, and drafts pull request descriptions. Use whenever creating, splitting, or describing commits or pull requests.
---

# Commits

These rules make each commit one readable, revertable change with a message the team can scan in `git log --oneline`.

## Follow the repository's convention

Before the first commit of a session in a repository, read `git log --oneline -20`, the project's instruction files, any commitlint or CONTRIBUTING file, and the pull request template, and follow the convention they show for prefix, casing, and issue references, because a message that breaks the convention looks foreign in the history and can fail a hook. When the history is empty or shows no consistent pattern and no project file names a convention, use Conventional Commits.

<example>
The history reads `Auth: ...`, `Search: ...`, `Billing: ...`, so the new subject starts with the same kind of area prefix instead of `fix(search):`.
</example>

Write the message in the language the project instructions or the user set for commits, and in English otherwise, because the language of working metadata is a user decision and the history should not mix languages.

<example>
The project rules say commit messages are in German, so the subject and body are in German, while a repository without such a rule gets English messages.
</example>

## Write the subject and body

Make the subject one line in the imperative mood that says what the commit changes, about 50 characters and never more than 72, with no trailing period, because review tools such as GitHub's commit list cut long subjects, Git's own guidance calls 50 characters the soft limit, and a subject that holds the explanation buries the change.

<example>
`Search: keep filters after changing page` is the subject, and the explanation of the old query code goes into the body.
</example>

Put a blank line after the subject and a body that says what problem existed, why this solution was chosen, and any side effects or limits, wrapped near 72 characters, because the diff already shows how and only the message can say why. Skip the body only when the subject says everything.

<example>
"The results page rebuilt its query from defaults on every page change, so filters were lost after page one. The page number is now added to the existing query instead."
</example>

Pass the message through a file, standard input, or a here-string so line breaks stay real, with the subject first, a blank line, then the body, because a literal `\n` inside one `-m` stays a backslash and turns the whole text into one long subject, and double-quoted arguments mangle backticks and `$`. Separate `-m` options per paragraph are fine for text without those characters.

<example>
In PowerShell, `@'` followed by the subject, a blank line, and the body, then `'@ | git commit -F -`. In a POSIX shell, `git commit -F - <<'EOF'` followed by the message lines and `EOF`.
</example>

Write in plain words and short sentences, and keep punctuation simple, with no em or en dashes and no semicolons and with colons only where the convention uses them, such as the subject prefix and trailers like `BREAKING CHANGE:` or `Signed-off-by:`, because a plain log is easy to scan.

<example>
Subject `Fix empty search results` with the body `The query builder dropped the category filter after page one.` instead of the single subject `Fix empty search results; the query builder dropped the category filter`.
</example>

Describe the change and its reason, not the tool or agent that produced it, and add no attribution lines unless the user asks, while in Claude Code the `attribution` setting with empty `commit` and `pr` values removes the generated lines deterministically, because the history belongs to the team and is read by people who do not care how the edit was typed.

<example>
"Billing: retry a failed invoice email once" with no mention of an AI assistant and no `Co-Authored-By` line.
</example>

## Shape the commits

Keep one logical change per commit, with refactoring, formatting, and behavior changes in separate commits and the build passing at each one, because a mixed commit cannot be reverted or bisected without losing the unrelated part.

<example>
Reformatting `search_form.php` goes into one commit and the filter fix into the next, so the fix can be reverted alone.
</example>

Stage only your own paths with `git add -- <paths>`, for a file that also holds someone else's edits answer `git add -p` through standard input with one answer per hunk, such as `"y`nn`n" | git add -p -- <path>` in PowerShell or `printf 'y\nn\n' | git add -p -- <path>` in a POSIX shell, and read `git diff --cached` before committing, because a shared working tree often contains other people's unfinished work, local configuration, or secrets that must not ship, and an agent shell has no terminal, so a bare `git add -p` prints its first prompt, stages nothing, and still exits 0. Avoid `git add -A`, `git add .`, and `git commit -a` in such trees.

<example>
`git status --short` shows the user's edited `.env.local`, so only `git add -- src/search/query.php` is staged.
</example>

Use the author identity the project instructions specify, passed with `-c user.name=... -c user.email=...` when the server's default identity belongs to someone else, because a commit recorded under the wrong person misleads everyone who reads the history later.

<example>
A server repository defaults to another developer's name, so the commit runs as `git -c user.name="..." -c user.email="..." commit ...` with the identity from the project rules.
</example>

Fix a pushed commit with a new commit instead of `--amend` or a rebase, because rewriting shared history breaks every clone that already pulled it.

<example>
A typo found in a commit already on `origin/main` gets a follow-up commit, while an unpushed local commit may still be amended.
</example>

After committing, confirm the result with `git log -1 --format="%h %an %s"` and `git status --short`, and report only the verified hash, because a failing hook or a wrong path can leave nothing committed while the command output looks normal.

<example>
The log shows `3f2a9c1 Alex Kim Search: keep filters after changing page` and a clean status, so `3f2a9c1` is the hash given to the user.
</example>

## Describe pull requests

Give a pull request a title that follows the subject rules and a description written for a reviewer who has not seen the work, covering what changed and why, how it was verified, and risks or follow-ups, using the repository's template when one exists, because the reviewer decides from the description which parts to read closely.

<example>
A summary saying search filters now survive a page change, a testing section listing the five filter combinations checked on the first three pages, and a risk note that search links saved before the change open without filters.
</example>
