---
name: commits
description: Writes commit messages, shapes commits, and drafts pull request descriptions. Use whenever creating, splitting, or describing commits or pull requests.
---

# Commits

These rules make each commit one readable, revertable change with a message the team can scan in `git log --oneline`.

## Follow the repository's convention

Before the first commit in a repository, read `git log --oneline -20`, the project's instruction files, any commitlint or CONTRIBUTING file, and the pull request template, and follow the convention they show for prefix, casing, and issue references, because a message that breaks the convention looks foreign in the history and can fail a hook. When the repository has no convention, use Conventional Commits.

<example>
The history reads `Auth: ...`, `Search: ...`, `Billing: ...`, so the new subject starts with the same kind of area prefix instead of `fix(search):`.
</example>

Write the message in the language the project instructions or the user set for commits, and in English otherwise, because the language of working metadata is a user decision and the history should not mix languages.

<example>
The project rules say commit messages are in German, so the subject and body are in German, while a repository without such a rule gets English messages.
</example>

## Write the subject and body

Make the subject one line that says what the commit changes, about 50 characters and never more than 72, with no trailing period, because `git log --oneline`, review tools, and notifications cut the subject near 72 characters and a subject that holds the explanation buries the change.

<example>
`Search: keep filters after changing page` is the subject, and the explanation of the old query code goes into the body.
</example>

Put a blank line after the subject and a body that says what problem existed, why this solution was chosen, and any side effects or limits, wrapped near 72 characters, because the diff already shows how and only the message can say why. Skip the body only when the subject says everything.

<example>
"The results page rebuilt its query from defaults on every page change, so filters were lost after page one. The page number is now added to the existing query instead."
</example>

Pass the subject and the body as separate arguments or through a file, using one `-m` for the subject and one more `-m` per body paragraph, or `-F` with a file or standard input, because a single `-m` holding the whole text becomes a one-line subject hundreds of characters long.

<example>
`git commit -m "Search: keep filters after changing page" -m "The page change rebuilt the query from defaults, so filters were lost."`, or in a POSIX shell `git commit -F - <<'EOF'` followed by the message lines and `EOF`.
</example>

Write in plain words and short sentences without em or en dashes, semicolons, or explanatory colons, keeping the colon only where the convention's prefix uses it, and use straight double quotes, because the history is read in the same plain style as every other text the user receives.

<example>
"Fix empty search results. The query builder dropped the category filter after page one" instead of "Fix empty search results; the query builder — after the refactor — dropped the filter".
</example>

Describe the change and its reason, not the tool or agent that produced it, and add no attribution lines unless the user asks, because the history belongs to the team and is read by people who do not care how the edit was typed.

<example>
"Billing: retry a failed invoice email once" with no mention of an AI assistant and no `Co-Authored-By` line.
</example>

## Shape the commits

Keep one logical change per commit, with refactoring, formatting, and behavior changes in separate commits and the build passing at each one, because a mixed commit cannot be reverted or bisected without losing the unrelated part.

<example>
Reformatting `search_form.php` goes into one commit and the filter fix into the next, so the fix can be reverted alone.
</example>

Stage only your own paths with `git add -- <paths>`, use `git add -p` for a file that also holds someone else's edits, and read `git diff --cached` before committing, because a shared working tree often contains other people's unfinished work, local configuration, or secrets that must not ship. Avoid `git add -A`, `git add .`, and `git commit -a` in such trees.

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
