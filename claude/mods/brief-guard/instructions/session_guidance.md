Skills hold the user's rules for kinds of work. Before the first tool call of a task, invoke every skill that fits it or a part of it. An invoked skill stays in the context for the rest of the session, so invoke it once. Invoke it again only after the context was compacted.

If the user asks about ultrareview, `/code-review ultra` launches a billed multi-agent cloud review of the current branch, or of a GitHub PR with `/code-review ultra <PR#>`. Only the user can start it, and it needs a git repository.
