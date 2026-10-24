# Changelog and README

## Changelog rules

These follow Keep a Changelog 1.1.x at keepachangelog.com/en/1.1.0.
The full file layout is in the second pair of [examples.md](../examples.md).

- Use Keep a Changelog 1.1.x unless the project already uses another format.
- Write entries for humans. Treat commit history only as a list of candidates.
- State the effect a user notices, never a commit subject or a hash.
- Add the entry under `## [Unreleased]` in the same change as the behavior.
- List every deprecation, removal, and breaking change with what to use instead.
- Put the newest version first, with its release date as `YYYY-MM-DD`.
- Keep `## [Unreleased]` at the top. Move its entries under the version heading at release.
- Use the groups Added, Changed, Deprecated, Removed, Fixed, and Security. Leave out empty groups.
- Start each entry with the affected feature, command, endpoint, or setting, with identifiers in code font.
- For a breaking change, say what to do instead and link the migration guide when one exists.
- Leave out changes nobody outside the team notices, such as refactoring, tests, and CI.
- Give every version an entry and a link definition, and say in the header whether the project follows Semantic Versioning.
- Point each version link to a comparison with the previous tag. Point `Unreleased` to the latest tag compared with `HEAD`.
- Keep a pulled release in the file and mark it `[YANKED]`, as in `## [0.0.5] - 2014-12-13 [YANKED]`.
- Keep the file name `CHANGELOG.md`, or an existing name such as `HISTORY`, `NEWS`, or `RELEASES`.

## From commits to entries

When the project uses Conventional Commits, read the history since the last tag and rewrite each relevant commit by hand.
Merge several commits about one feature into one entry.
This mapping is a starting point and not part of either convention.

| Commit type | Usual changelog group |
|---|---|
| `feat` | Added, or Changed when it alters existing behavior |
| `fix` | Fixed, or Security when it closes a vulnerability |
| `!` or a `BREAKING CHANGE` footer | Changed or Removed, always with migration steps |
| `perf` | Changed, when users notice the difference |
| `refactor`, `test`, `ci`, `build`, `style`, `chore`, `docs` | Usually no entry |

## Releasing

1. Let the releasing-software skill choose the version number.
2. Move the entries under `Unreleased` to a heading such as `## [1.5.0] - 2026-10-20`.
3. Leave an empty `## [Unreleased]` above it.
4. Update the link definitions for the new version and for `Unreleased`.

## README rules

No official README standard exists, so this is recommended practice.
GitHub shows a README from `.github/`, the repository root, or `docs/`, in that order of priority.

- Hold the purpose, install, a short quickstart, links into `docs/`, help, contributing, and the license.
- Use the sections Install, Quickstart, Documentation, Get help, Contributing, and License, after a one or two sentence summary.
- Add a section such as supported versions or a security policy link only when the project needs it.
- End the quickstart in visible output. Send option tables and API details to reference pages.
- Use relative links for repository files, because they keep working in clones and on other branches.
- Keep only badges the project maintains and that show something current.
- Run the install and quickstart commands in a clean environment before writing them.
