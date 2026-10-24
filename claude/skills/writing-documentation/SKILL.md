---
name: writing-documentation
description: Writes and updates README, CHANGELOG, CONTRIBUTING, AGENTS.md, guides, and API docs by Diataxis. Use for docs, readme, or changelog requests, or when a change makes a doc wrong.
---

# Writing documentation

## Scope

- Add no comments or docstrings to code. Put that reasoning in a document, commit message, or ADR.
- Write a document only when the user asks, or when the project keeps one and the change makes it wrong.
- When the API reference is generated from doc comments, tell the user and leave the code unchanged.
- Commit text belongs to writing-commit-messages, ADRs to recording-architecture-decisions, and versions to releasing-software.

## Workflow

1. Read the existing docs and follow their conventions, layout, and names.
2. Classify each page as tutorial, how-to guide, reference, or explanation. One page holds one type.
3. Run each command and example, or check it against the code and `--help`.
4. Update every mention of a renamed or removed command, flag, option, or endpoint.
5. Run the project's docs checks when they exist.
6. Tell the user which commands you could not run.
7. Say that an AI draft needs human review before publishing.

## Style

Every line you add or change follows these rules.

- Write plain words in sentences of at most 20 words, one fact each.
- Use no em dash, en dash, semicolon, or ellipsis.
- Put no colon before an explanation or a list.
- Use straight quotes only.
- Address the reader as "you", in active voice, also in tutorials.
- Put commands, file names, flags, values, and placeholders in code font. Use bold only for UI elements.
- Make link text name the target, never "click here".
- Use a numbered list for a procedure, with one imperative action per step.
- Set the language on each code fence and leave out a `$` prompt.
- Never put a real token, key, or password in a doc. Use a placeholder.

## Reference files

- [reference/diataxis.md](reference/diataxis.md) has the type compass and page splitting. Read it before writing a new page.
- [reference/changelog-and-readme.md](reference/changelog-and-readme.md) has changelog, release, and README rules. Read it when either file changes.
- [reference/style-and-agent-docs.md](reference/style-and-agent-docs.md) has finer style and `AGENTS.md` rules. Read it for placeholders, images, or an agent file.
- [examples.md](examples.md) has before and after pairs for a README and a changelog. Read it before rewriting either file.
