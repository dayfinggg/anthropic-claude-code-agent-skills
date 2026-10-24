---
name: writing-commit-messages
description: Writes git commit messages and PR or MR descriptions in the repo's convention, else Conventional Commits. Use when asked to commit, amend, split commits, or write a commit message or PR description.
---

# Writing commit messages

Create commits only when the user asks.

Run `git log --oneline -20` first. Check for a commitlint config, `CONTRIBUTING.md`, and a pull request template.
Follow the repository convention exactly, including language, casing, prefixes, and issue references.
Otherwise use Conventional Commits.

```
<type>[(scope)][!]: <description>

<body>

<footers>
```

## Subject and body

- The subject is imperative, about 50 characters, at most 72, with no trailing period.
- Wrap the body at 72 characters after a blank line.
- The body states the problem in present tense, then why this change solves it.
- Name rejected alternatives, side effects, limits, and follow-ups. The diff already shows how.
- Skip the body when the subject says everything, as with a typo fix.
- State the reason only when the request, ticket, or code gives it. Otherwise ask the user.
- Describe the purpose, not a list of edited files.
- Use plain words and short sentences. Avoid em dashes, semicolons, and curly quotes.

## Footers

- Put footers in one block at the end in trailer form, such as `Refs: #123`.
- Follow the repository AI disclosure policy and the user's Claude Code attribution setting.
- Add no attribution trailer when neither asks for one.
- Never add `Signed-off-by`. It is the human author's certification.

## Shaping commits

- One commit holds one logical change, and the build passes at every commit.
- Put refactoring, behavior changes, and unrelated formatting in separate commits.
- Stage named files and review the staged diff.
- Keep secrets, credentials, internal hostnames, local config, and build output out of diffs and messages.
- Change git config only when asked.
- When a hook fails, fix the cause. Never use `--no-verify`.
- After an amend or fixup, confirm the message still matches the diff.

## References

- Read `references/details.md` for Conventional Commits types, breaking changes, signing, or a PR or MR description.
