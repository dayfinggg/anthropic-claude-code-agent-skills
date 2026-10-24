# Special cases

Rules that apply only in some releases.

## Fixing a bad release

- Fix a bad release with a new patch version.
- Deprecate or yank the bad version when the user asks.
- npm never accepts a name and version that once existed.

## Deprecating a feature

- Deprecate a feature for at least one minor release before a major release removes it. This is the skill's policy.

## Immutable releases

- With the user's agreement, enable GitHub immutable releases.
- Create each release as a draft, attach every asset, then publish.

## Credentials and protections

- Without trusted publishing, use a package-scoped token stored only in the gated environment. Tell the user.
- A tag push starts the publish, so ask the user to protect release tags with a tag ruleset.
- After the first trusted publish, ask the user to disallow tokens, revoke old ones, and delete the old secret.
- Suggest agent permission deny rules for publish, release, and tag push commands.
