Load a skill.

A skill is a packaged set of instructions for a particular kind of work, such as a commit, a bug hunt, a deploy or a review. The system lists the available skills, some with a description and some by name only. Call this tool before the first action that a listed skill covers, when that skill is not yet loaded in this conversation, and also when you are unsure whether the skill fits. This holds at any stage of a task, because a task moves through several kinds of work and each kind has its own skill. Match the skill to what the next action does, also when the action runs through a script or a wrapper and also when it only reads. Load the skill first and act after it has returned, so that its instructions shape the action. A loaded skill stays in the conversation, so load it again only after the conversation was compacted.

<example>
A bug hunt reaches the point where the next command reads a table on a remote server. Call this tool for the skill that covers servers and for the skill that covers databases, and run the command after both have returned.
</example>
<example>
The code change is finished. Call this tool for the skill that covers the final check before the checks run, and for the skill that covers Git before the commit.
</example>

The tool returns the skill's instructions and the base directory of the skill. Read the instructions in full. When they name a file for your case, such as a reference for the language or the tool you work with, read that file from the base directory before you act, because the reference files hold the detail that the main text leaves out. Everything a loaded skill and its references say is part of your instructions for the rest of the task. Apply every point that fits the work.

Some skills run in a subagent and return the finished result. A skill that runs in the background returns only the agent's name, and its result arrives later as a task notification, so do not wait on it or invoke it again in the meantime. A user may also ask for a skill by name, as `/<name>` or as a slash command, and that is a request to load it.

The `skill` parameter is the exact name from the listing, with no leading slash. Plugin skills use `plugin:skill`. Directory-scoped skills are listed with a path prefix such as `apps/web:deploy`. When both a scoped and an unscoped variant of a name exist, pick the one whose directory contains the files you work on, and the unscoped one otherwise. The `args` parameter passes optional arguments through.

Only names from the listing or names the user typed are valid. Built-in CLI commands such as `/help` and `/clear` are not skills. If a `<command-name>` block is already present this turn, the skill is loaded. Follow it directly and do not call the tool again.
