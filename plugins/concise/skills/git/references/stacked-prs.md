# Stacked pull requests with gh stack

## How stacks behave

- GitHub stacked PRs are GA since 2026-10-06 on all github.com plans and need no enablement. GitHub Enterprise Server did not have them at GA.
- A stack is a linear chain in one repository. Each PR targets the branch of the PR below it, and the bottom PR targets the trunk. Cross-fork and branching stacks are not supported.
- Install the CLI with `gh extension install github/gh-stack` (Git 2.36+). `gh stack init` turns on `rerere`. With more than one remote, set `remote.pushDefault` or pass `--remote <name>` to `push`, `submit`, `sync`, `rebase` and `link`.
- Every layer is evaluated as if it targeted the stack base, for required reviews, required checks, CODEOWNERS (read from the stack base), code scanning and required deployments. A workflow on `pull_request` for `main` runs for every layer, and `github.event.pull_request.stack` is set only for stacked PRs.
- PRs merge bottom-up as one operation, so merging a mid-stack PR also merges every unmerged PR below it. The PRs above retarget the trunk and get rebased automatically.
- Merging needs a fully linear history between the branches. Restore it with `gh stack rebase` then `gh stack push`, or with the Rebase stack button.
- Rebase stack on GitHub creates signed commits with the original authors and keeps approvals when the diff is unchanged, even with dismiss-stale-approvals on.
- Rule bypass works only for the lowest unmerged PR, and `gh stack merge` cannot bypass.
- A merge queue takes the stack in order, and removing or ejecting one PR also removes every PR above it.
- `gh pr merge` cannot merge a stack, so scripts use the async merge API from SKILL.md.
- A fully merged stack is closed, and `gh stack submit` with new branches on top starts a new stack.

## Commands safe without a TTY

Under a PTY the bare forms open a TUI or a prompt and block, so pass the explicit form.

| Use | Not | Why |
|---|---|---|
| `gh stack view --json` | `gh stack view` | opens a TUI |
| `gh stack init <branch>...` | `gh stack init` | prompts for names |
| `gh stack add <branch>` | `gh stack add` | prompts for a name |
| `gh stack submit --auto` | `gh stack submit` | opens an editor per PR |
| `gh stack checkout <pr-or-stack>` | `gh stack checkout` | opens a picker |
| `gh stack up`, `down`, `top`, `bottom` | `gh stack switch` | menu only |
| `gh stack merge <pr> --yes` | `gh stack merge` | without a target it merges the whole stack |
| `gh stack unstack` then `gh stack init` | `gh stack modify` | TUI only, no scripted reorder |

- `gh stack init <branch>...` adopts existing branches and creates missing ones, and `--base <branch>` sets a trunk other than the default branch.
- `gh stack submit --auto` creates draft PRs with generated titles unless `--open` is given. Fix titles and bodies afterwards with `gh pr edit`.
- `gh stack merge <pr>` merges that PR and every unmerged PR below it, all or nothing. Without a method flag it reuses the last method, and on a queue branch the method flags are ignored.
- `gh stack help <command>` prints the top-level help, so use `gh stack <command> --help`.
- `gh stack view --json` writes JSON to stdout and status to stderr, so branch on exit codes, not on stderr text.

## Editing a stack

- Commit a change in the layer that owns it with `gh stack checkout <branch>` (or `down`), the commit, `gh stack rebase --upstack`, `gh stack top` and `gh stack push`.
- `gh stack push` and `sync` push all branches in one atomic push with a per-branch `--force-with-lease`. Keep atomic pushes on.
- `gh stack sync` fetches, rebases only when the trunk moved, pushes and refreshes PR state. When the local and GitHub stacks have diverged it prints `Sync aborted` and exits 0 without pushing, so confirm the result with `gh stack view --json`.
- A sync conflict restores all branches. Run `gh stack rebase` to reproduce it, resolve, `git add`, then `gh stack rebase --continue` (or `--abort`).
- When a stack's base branch is deleted, GitHub retargets the stack but does not rebase it. Without a TTY, pass `--accept-base-change` to `sync` or `rebase` when the old base did not merge.
- For branches managed by Jujutsu, Sapling or git-town, `gh stack link <bottom> ... <top>` pushes them, opens draft PRs with the right bases and links them. It only adds PRs to a stack.

## Exit codes

2 means not in a stack, 3 a rebase conflict, 4 a GitHub API failure, 6 a branch in several stacks, and 7 a rebase already in progress. 8 means another `gh stack` process holds the lock, so retry after a few seconds. 9 means stacked PRs are not available for the repository, so tell the user. 10 means modify recovery is required, so run `gh stack modify --abort`.
