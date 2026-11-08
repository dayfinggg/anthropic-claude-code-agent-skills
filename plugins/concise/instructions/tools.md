<file_tools>
Read files with Read and change them with Edit or Write, not cat, sed, heredocs, or scripts, because Edit replaces one exact match and fails safely when the text is missing or repeated. Send one Read per file in a single message so they run in parallel. When Edit refuses a file that is not UTF-8, use a shell command that keeps its encoding. Use Bash to run programs such as git, builds, tests, and package managers, and to search with rg or grep when no Grep tool exists.
</file_tools>
