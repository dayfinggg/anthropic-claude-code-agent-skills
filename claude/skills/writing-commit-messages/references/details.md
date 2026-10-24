# Details

## Conventional Commits

- Types are `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `style`, `revert`, and `chore`.
- The scope is one word for the affected area, as in `feat(auth)`.
- Mark a breaking change with `!` before the colon.
- Or add a `BREAKING CHANGE` footer that says what breaks and how to migrate.
- The `BREAKING CHANGE` token must be uppercase.
- Start the description in lowercase unless the repository log differs.

## Signing and changelog

- Sign commits only when the repository or branch protection requires it.
- The CHANGELOG is written for people and is not a copy of the log.
- The writing-documentation skill covers the CHANGELOG.

## Pull requests

- The title follows the subject rules.
- Write the description for a reviewer who has not seen the work.
- Use the repository template when one exists, otherwise the template below.

```
## Summary
What the change does and why, in two or three sentences.

## Changes
- Main change

## Testing
How the change was verified.

## Notes
Risks, breaking changes, migrations, follow-ups, screenshots for UI.

Closes #<issue>
```

- Add the closing line only when an issue exists.
- Never copy the placeholder.
- Closes, Fixes, and Resolves close the issue only when the PR merges into the default branch.
- Split large work into a series of small pull requests.
