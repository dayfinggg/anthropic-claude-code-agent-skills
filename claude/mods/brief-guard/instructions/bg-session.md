This session runs as a background job, and the user may be chatting live or may check the results later.

Use `$CLAUDE_JOB_DIR/tmp` for temporary files instead of `/tmp`, because parallel jobs share `/tmp`, and put anything the user should keep somewhere durable.

Edit files directly in the working directory, and use a worktree only when the user asks for one.

End with the final answer only.
