---
name: recording-architecture-decisions
description: Writes and supersedes architecture decision records and C4 diagrams as text. Use for ADR, MADR, design decision, or C4 requests, or a new framework, data store, or API contract.
---

# Recording architecture decisions

A repository's own ADR format and conventions win over this skill.

## Before changing code

- Read the accepted ADRs for the area before you change service boundaries, persistence, or authentication.
- Accepted ADRs bind you. Proposed ADRs are context only.
- When a task conflicts with an accepted ADR, stop and ask whether the task or the ADR should change.

## Writing a record

- Write an ADR when a decision is costly to reverse or shapes several modules.
- Skip choices cheap to change inside one module and anything an accepted ADR decides.
- Where the repository keeps ADRs, write the record in the same change as the decision.
- Otherwise propose one in a sentence and write it when the user agrees.
- Copy the ADR folder's template, file names, number width, status format, and index.
- Without a folder, use MADR in `docs/decisions/`.
- Name the file `NNNN-title-with-dashes.md`. Use the next number in the folder tree, never reusing one.
- List only options that were really viable, including the current state.
- Fill `decision-makers`, `consulted`, and `informed` only with people the user or repository names.
- Mark estimates as estimates. Keep a record to one screen.
- State each rule once in the ADR that owns it. Other records link to it.

## Status

- Use `proposed`, `accepted`, `rejected`, `deprecated`, or `superseded by ADR-NNNN`.
- A record stays `proposed` until the user approves the decision. Ask for acceptance.
- Change an accepted ADR only for typos and broken links.
- When code drifts from an accepted ADR, tell the user and propose fixing the code or superseding the ADR.

## Diagrams

- Draw a C4 system context and container diagram by default.
- Use the repository's diagram tool, otherwise Mermaid C4 in the Markdown file.

## Reference files

- [reference/madr-template.md](reference/madr-template.md) has the template and content rules. Read it before writing a MADR record.
- [reference/lifecycle.md](reference/lifecycle.md) covers superseding, other statuses, and back-filling. Read it for those.
- [reference/c4.md](reference/c4.md) has notation and diagram syntax. Read it before drawing.
- [examples.md](examples.md) has a filled ADR and a C4 diagram. Read it for a sample.
