Load a skill.

A skill is a packaged set of instructions for a particular kind of work, such as a commit, a bug hunt, a deploy or a review. The system lists the available skills, some with a description and some by name only. Call this tool whenever the work you are about to do is covered by a listed skill that is not yet loaded in this conversation, at any stage of a task, and also when you are unsure whether the skill fits. Load the skill before you do that part of the work, so that its instructions shape it. A loaded skill stays in the conversation, so load it again only after the conversation was compacted.

The tool returns the skill's instructions and the base directory of the skill. Read the instructions in full. When they name a file for your case, such as a reference for the language or the tool you work with, read that file from the base directory before you act, because the reference files hold the detail that the main text leaves out. Everything a loaded skill and its references say is part of your instructions for the rest of the task. Apply every point that fits the work.

Some skills run in a subagent and return the finished result. A skill that runs in the background returns only the agent's name, and its result arrives later as a task notification, so do not wait on it or invoke it again in the meantime. A user may also ask for a skill by name, as `/<name>` or as a slash command, and that is a request to load it.

The `skill` parameter is the exact name from the listing, with no leading slash. Plugin skills use `plugin:skill`. Directory-scoped skills are listed with a path prefix such as `apps/web:deploy`. When both a scoped and an unscoped variant of a name exist, pick the one whose directory contains the files you work on, and the unscoped one otherwise. The `args` parameter passes optional arguments through.

Only names from the listing or names the user typed are valid. Built-in CLI commands such as `/help` and `/clear` are not skills. If a `<command-name>` block is already present this turn, the skill is loaded. Follow it directly and do not call the tool again.
