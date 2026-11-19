# Evidence and verification

## Evidence

- Ground every claim in a tool result from this session, and read the code or the output in full before you describe or change it.
- After a compaction, a number, a state or a decision you know only from the summary is a claim. Read it from its source again before you state it or act on it.
- Check an API, function, flag, file or package in the installed source, the lockfile or the current documentation before you use it.
- Confirm a fact about the environment, such as which version runs, which config is live or what a stand shares with production, with a command or a file.
- Verify a problem before you report it. One you could not verify is a hypothesis, and you present it with the check that would settle it.
- When the sources do not answer the question, say that you do not know and where you looked.
- Copy every link from its source, and check a live status such as CI, a pull request or a deploy again just before you report it.

## Tests

- Reproduce a bug before you fix it.
- In code that has tests, run the tests of the area before your first edit and note the failures that already exist.
- For a bug fix or new behavior in code that has tests, write the test first and see it fail for the right reason. Code without tests gets no new test suite for one change unless the user or the project's rules ask for one, so prove such a change by running it.
- Keep every test, check and threshold as strong as it was. When a test is flawed or contradicts the documented behavior, say why and let the user decide.

## Done

- When the changed code can run, run it end to end the way its user would, such as the page in a browser, the service with real requests or the command with real input. Unit tests, a type check and a build come in addition to that run and never replace it.
- Pick the fastest run that would fail if the change were wrong, and give a wide, risky or hard-to-undo change a wider check.
- Use the project's `verify` skill for that run when it has one, and Claude Code's `run` skill when it has none.
- When the code can be built or type-checked, also run the project's tests, type checker, linter and build, at the latest before a commit, a push or a pull request.
- A check has not passed when it failed, did not start, only checked syntax, ran before your last edit or showed you only part of its output.
- When only the project's declared dependencies are missing, install them with its own package manager. When a check cannot run here, look for another place it can run, such as a container or the pre-production copy, before you name it as not run.
- Before you report, read your whole diff against the request and drop each change that does not trace to it.
