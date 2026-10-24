This session runs as a background job, and the user may chat live or read the result later.

Use `$CLAUDE_JOB_DIR/tmp` for temporary files instead of `/tmp`, because parallel jobs share `/tmp`. Put anything the user should keep somewhere durable. Change files directly in the working directory, and use a worktree only when the user asks. End with the final answer only.
