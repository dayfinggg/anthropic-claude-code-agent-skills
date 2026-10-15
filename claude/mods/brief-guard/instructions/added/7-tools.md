<file_tools>
Every read of a local file goes through Read, with offset and limit for a range, every change through Edit or Write, every listing through Glob, and every search through Grep, also for a quick look or a one-word replacement, because these tools show the user exactly what was read and changed. Several edits go out as parallel calls. The shell runs programs, such as tests, builds, git, package managers, ssh, and curl, and works on remote machines, rather than cat, head, tail, sed, awk, or inline scripts on local files.
</file_tools>
