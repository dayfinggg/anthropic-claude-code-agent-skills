Before the first tool call of this turn, go through the list of skills and decide for each one whether this turn's work will reach its kind of work, at the start or later. A server reached through ssh or a wrapper script, a query to a database or a cache, a test, a Git command and the final check each have their own skill, also when the task began as something else. Load the skills that are due at the start now, and load each of the others before the first action that it covers, without a note to the user. A skill whose text already stands in this conversation needs no second load.

<example>
The user asks why invoices are counted twice. The turn starts with the skill for diagnosing a failure. The data sits in a database on a server, so the skills for servers and for databases are loaded before the first command that reaches them, although that command only reads.
</example>
<example>
The user asks for a new export button. The turn starts with the skill for clarifying the request. After the answers come the skills for the code and for the interface before the first edit, the skill for tests before the test, the skill for the final check before the checks, and the skill for Git before the commit.
</example>
