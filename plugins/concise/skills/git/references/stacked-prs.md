## Facts

- GitHub stacked PRs are GA since 2026-10-06 on all github.com plans and need no enablement. GitHub Enterprise Server gets them in a later release.
- A stack is a linear chain in one repository. Each PR targets the branch of the PR below it, and the bottom PR targets the trunk. Cross-fork stacks and branching stacks are not supported.
- Install the CLI with `gh extension install github/gh-stack` (Git 2.36+). `gh stack init` turns on `rerere`. With more than one remote, set `remote.pushDefault` or pass `--remote <name>` to `push`, `submit`, `sync`, `rebase` and `link`.
- Every layer is evaluated as if it targeted the stack base: required reviews, required checks, CODEOWNERS (read from the stack base), code scanning and required deployments. A workflow on `pull_request` for `main` runs for every layer. `github.event.pull_request.stack` is set only for stacked PRs.
- PRs merge bottom-up as one operation. Merging a mid-stack PR also merges every unmerged PR below it. The PRs above retarget the trunk and get rebased automatically.
- Merging needs a fully linear history between the branches. Restore it with `gh stack rebase` then `gh stack push`, or the Rebase stack button.
- Rebase stack on GitHub creates signed commits with the original authors and keeps approvals when the diff is unchanged, even with dismiss-stale-approvals on.
- Rule bypass works only for the lowest unmerged PR. `gh stack merge` cannot bypass.
- In a merge queue the stack is queued in order. Removing or ejecting one PR also removes every PR above it.
- `gh pr merge` cannot merge a stack. Scripts must use the async merge API (see SKILL.md).
- A fully merged stack is closed. Running `gh stack submit` with new branches on top starts a new stack.

## Commands safe without a TTY

Under a PTY the bare forms open a TUI or a prompt and block. Always pass the explicit form.

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

- `gh stack init <branch>...` adopts existing branches and creates missing ones. `--base <branch>` sets a trunk other than the default branch.
- `gh stack submit --auto` creates draft PRs with generated titles unless `--open` is given. Fix titles and bodies afterwards with `gh pr edit`.
- `gh stack merge <pr>` merges that PR and every unmerged PR below it, all or nothing. Without a method flag it reuses the last method. On a queue branch the method flags are ignored.
- `gh stack help <command>` prints the top-level help. Use `gh stack <command> --help`.
- `gh stack view --json` writes JSON to stdout and status to stderr. Branch on exit codes, not on stderr text.

## Editing a stack

- Commit a change in the layer that owns it: `gh stack checkout <branch>` (or `down`), commit, `gh stack rebase --upstack`, `gh stack top`, `gh stack push`.
- `gh stack push` and `sync` push all branches in one atomic push with a per-branch `--force-with-lease`. Keep atomic pushes on.
- `gh stack sync` fetches, rebases only when the trunk moved, pushes and refreshes PR state. When the local and GitHub stacks have diverged it prints `Sync aborted` and exits 0 without pushing, so confirm the result with `gh stack view --json`.
- On a sync conflict all branches are restored. Run `gh stack rebase` to reproduce the conflict, resolve, `git add`, then `gh stack rebase --continue` (or `--abort`).
- When a stack's base branch is deleted, GitHub retargets the stack but does not rebase it. Without a TTY pass `--accept-base-change` to `sync` or `rebase` when the old base did not merge.
- Branches managed by Jujutsu, Sapling or git-town: `gh stack link <bottom> ... <top>` pushes, opens draft PRs with the right bases and links them. It only adds PRs to a stack.

## Exit codes

- 2: not in a stack. 3: rebase conflict. 4: GitHub API failure. 6: branch is in several stacks. 7: rebase already in progress. 8: stack locked by another `gh stack` process, retry after a few seconds. 9: stacked PRs not available for the repository, tell the user. 10: modify recovery required, run `gh stack modify --abort`.
