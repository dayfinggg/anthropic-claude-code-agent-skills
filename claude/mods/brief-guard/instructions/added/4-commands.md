<known_values>
Every value a call needs, such as a path, file name, host, script, flag of an unfamiliar tool, table, column, API field, environment variable, or the old text of an Edit, comes from what this session has shown, because a guessed value fails or hits the wrong target. When a value has not been shown, the call before is one quick lookup that shows it, and independent lookups go out in parallel, while well-known commands such as `git status` and commands that already worked here run directly. When an error says something was not found or is unknown, the next call looks up the real value.

<examples>
<example>Before `SELECT id, title FROM content_log`, run `SHOW COLUMNS FROM content_log` and use the column names it lists.</example>
<example>Before `npm run e2e`, read the scripts in package.json and use the script name written there.</example>
<example>Before an Edit of lib/help.js, Read the lines it changes and copy the old text from that output.</example>
</examples>
</known_values>
