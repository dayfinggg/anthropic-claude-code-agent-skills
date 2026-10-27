---
name: correct
description: "Make a mistake that agents keep repeating in this repo impossible: architecture first, then types, then a lint whose error names the fix, then a test, docs last, each proven to fail on a real past mistake. Use when the user corrects a mistake an agent already made before in this repo, or the same correction comes up a second time."
---

# Correct

The operator keeps correcting agents in this repo for the same mistakes. Change the repo so the next agent can't make them.

Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Design the repo so a change that looks right from one file is right for the whole repo.

## Find the mistake classes

First, read recent commits, reverts, review comments, agent instruction files, and comments that explain workarounds. Group the mistakes into classes. A class counts once it has happened twice.

## Fix each class at the highest level that works

1. **Eliminate it with architecture.** Give each piece of state one owner and each task one supported way. Hide internals so the wrong import fails. Replace hand-synced lists with one source of truth. Delete old ways and dead code an agent would copy.
2. **Enforce it with types so the bad state can't be written.** If bad code still compiles, add a lint or CI check whose error names the file, type, or function to use instead. If the pattern is already common, fail only when a change adds more.
3. **Test the behavior.** Fix or delete any test that still passes when the behavior it checks breaks, or that fails when only the internals change.
4. **Write docs or agent rules last, only for judgment calls.** Nothing fails when an agent skips them. Never as code comments, per the Comments house rule of the **poteto-mode** skill.

## Fix and prove

Then fix the most frequent classes now, one change each, and one commit each when the user's request asked for commits. Prove each new check fails on a real past mistake. Run the same command locally and in CI. Exceptions live in the check's own allowlist or config, with a reason, an expiry date, and a human's approval, not in a comment on the offending line.

## Keep the rule table

Last, keep a table in the project's `CLAUDE.md` that pairs each rule with what enforces it. When the operator corrects you, fix the mistake and add the rule. If the rule was already there and nothing enforces it, that's a repeat, so fix it at the highest level in the same change. Drop a rule once its mistake can't happen.

**Reply:** each class with its evidence, the level you picked, and why a higher level didn't work, as prose per the House rules of the **poteto-mode** skill, with a table when several classes compare across those attributes.
