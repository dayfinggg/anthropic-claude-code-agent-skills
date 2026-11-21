# Tools, skills and waiting

## Skills

Each skill of this plugin holds current practice for one area, such as git, a language, testing, a server, a database or web research, and it helps only when it is in context before the work in its area starts. Load the skill whose description covers what you are about to do before the first command or edit in that area, also when the first step only reads, such as the first git command, the first ssh session, the first SQL statement, the first edit of a file in a language, the first test you write or the first search for a research question. When the work moves into another area, load that area's skill as well. A question you can answer from files you already read and a small edit that follows the code around it need no skill.

After a skill loads, run the checks of its "Check first" section that bear on the step at hand, and read a reference file in full before the step its condition names. After a compaction only the start of each skill survives, so load the skill or read the reference again when the next step needs it.

## Choosing a tool

Use the tool built for the job, such as the file tools for files, WebSearch and WebFetch for the web and an MCP tool for the service it connects to, and the shell for builds, tests, git, package managers and commands on a server.

System messages name more tools than the ones you see, such as deferred tools and MCP servers, and ToolSearch loads them. When a task needs data or an action from a service such as a tracker, a CDN or cloud account, a browser or a database, load that service's tool with ToolSearch and call it, by exact name with `select:<name>` when a system message lists it and by service and action otherwise. Do this before you tell the user that you have no access, before you ask them to act for you, and before you reach the service with `curl`, a CLI or a script. One empty search does not prove that no tool exists, and a failed call is reported with its error.

## Calls and shell commands

Before each step, list what you need next, and send every call that does not depend on another's result together in one response, each as its own call. A shell command does one job, so a status check, a file read and a search are three calls rather than one command joined with `;` or `&&`, and every result and error then stands on its own. Join steps in one command only when each needs the one before it, such as a `cd` before a command or a build before its test.

Put a search pattern or any other literal string in a shell command in single quotes, because a backtick or a `$` inside double quotes runs as code. When you will report what a read found, or that it found nothing, keep its errors and its full output, because a failed read prints nothing too, `2>/dev/null` hides why, as after a refused `sudo -n`, and `| head` drops what lies past its limit. When you need more of a test, build or lint run than its last lines, write its output to a file and keep its exit code, because a pipe into `tail` or `grep` reports the status of the filter.

## Waiting and subagents

Run in the foreground only what finishes within about a minute. Start anything longer with `run_in_background` or watch it with the Monitor tool, carry on with other work, and let its completion notice arrive on its own. Wait for a condition inside a script with a timeout, because a foreground `sleep`, `until` or `while` loop holds the session, also inside `ssh`.

Give every remote call and every command that can stall a timeout. Prove a change with what you can run or read now, such as the last run's log or rows, and say when a scheduled event such as the next cron run will confirm it.

Hand work to a subagent when it is independent and can run in parallel, or when its output is bulky, such as a wide search or a long log. Its brief carries the user's request in their words and the constraints, because it does not see this conversation, and its report is a claim to check against its evidence.
