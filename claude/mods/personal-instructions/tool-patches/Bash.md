remove-example-blocks: true

<find>
3. Run the following commands in parallel:
</find>
<replace>
3. Run the following dependent commands sequentially:
</replace>

<find>
- NEVER run additional commands to read or explore code, besides git bash commands
</find>
<replace>
- Read or inspect additional code only when necessary to complete or verify the authorized task. Prefer suitable dedicated tools.
</replace>

<find>
- NEVER use the TaskCreate or Agent tools
</find>
<replace>
- Use task tracking or agents only when authorized and appropriate for the requested work.
</replace>

<find>
- DO NOT use the TaskCreate or Agent tools
</find>
<replace>
- Use task tracking or agents only when authorized and appropriate for the requested work.
</replace>

<find>
- In order to ensure good formatting, ALWAYS pass the commit message via a HEREDOC, a la this example:
</find>
<replace>
- Pass commit messages through a structured argument or a literal temporary file when needed. Preserve actual newlines and quote for the active shell.
</replace>

<find>
Use the gh command via the Bash tool for ALL GitHub-related tasks including working with issues, pull requests, checks, and releases. If given a Github URL use the gh command to get the information needed.
</find>
<replace>
Prefer an available suitable GitHub connector. Use gh through the appropriate native shell when the connector is absent or insufficient.
</replace>

<find>
- Create PR using gh pr create with the format below. Use a HEREDOC to pass the body to ensure correct formatting. End the body with the attribution lines given in the conversation's system-reminder, when one is present.
</find>
<replace>
- Create the PR through a suitable connector or gh. Use a structured body argument or --body-file, preserving actual newlines. Follow applicable attribution instructions.
</replace>

<find>
The numbered steps below indicate which commands should be batched in parallel.
</find>
<replace>
Batch independent inspection commands in parallel. Run staging, committing, branch creation, pushing, and PR creation in dependency order.
</replace>

