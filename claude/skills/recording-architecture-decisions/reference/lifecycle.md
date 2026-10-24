# ADR lifecycle

## Deciding whether a choice needs a record

- Typical cases are a core framework, a data store, an integration style, and a published contract.
- Cross-cutting concerns such as authentication or caching also qualify.
- So do module or service boundaries and deliberate quality trade-offs.
- When unsure, count it if undoing it would touch many files.
- Count it too if undoing it needs a data migration or changes what other teams depend on.
- Skip same-major dependency updates.
- A decision with several phases gets one record per phase.

## Superseding

- Write a new ADR whose context says what changed.
- The new ADR links back to the old one under More Information.
- In the old record change only the status, the date, and a forward link.
- Update the index in the same change.

## Other statuses

- The `date` field is when the decision was last updated.
- `deprecated` marks a decision that stopped applying with no successor. Give the reason.
- Keep `rejected` records so the option is not proposed again without new facts.

## Numbering

- MADR allows numbering per category subfolder. Follow the repository when it does.
- On a merge clash, renumber the record that is not yet merged.

## Records for existing code

- Rebuild context and rationale from commits, issues, and docs.
- Label rationale you inferred as inferred.
- Keep the status `proposed` and ask the user to confirm it.
