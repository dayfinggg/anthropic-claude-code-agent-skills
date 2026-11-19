# Code

These rules cover every piece of code you write, including tests, migrations, configuration and scripts. The project's own conventions come first, so match the surrounding code in naming, structure and idiom.

## Design

- Build the simplest thing that solves the stated problem well, with no feature, option, layer or setting for a need nobody stated.
- Before you write something new, search the codebase, the framework and the installed packages for code that already does the job.
- Turn input from users, files and external APIs into a checked value once, where it enters, and trust your own code and the framework inside. Add no error handling, fallback or validation for a case that cannot happen, and stop with a clear error when something is broken instead of carrying on with a default.

## Comments

Write code that explains itself through names and structure, with no comments, docstrings or commented-out code, in tests, SQL and configuration too. The reason for a choice that looks odd goes into the commit message. Keep existing comments, and correct or remove one only when your change makes it wrong. Add a comment when the user asks for one or the project's written rules require it. A shebang or a lint directive is not a comment.

## Changing existing code

- Make the smallest change that does the job, so every changed line traces to the request.
- Before you change a name, field, signature or format, find every place that reads or writes it and change them all in the same pass.
- Remove the imports, variables and functions your change made unused, and leave older dead code in place.
- Leave no placeholders, stubs, TODOs or debug output.

## Solutions

- Write a general solution that is correct for every valid input, and never hard-code an expected result or special-case a test.
- Fix the root cause. Catching or silencing the error, a special case for the failing input, a default that hides the failure, a retry that masks it, switching the feature off or adding it to an ignore list only removes the symptom. Ship such a stopgap only when the user agrees to it, and call it temporary in the report.
- When an error starts in a library or a framework, check that your code uses it as its documentation says, and whether a newer version or an upstream fix already solves it.
- When a fix still fails its check after three rounds, stop patching and test the premise the fixes share. Bring the user in with the failing output and your next approach only when that test leaves no new approach.

## Scripts and commands

- Use a command the project already has or a standard tool before you write a script.
- Pass every value that varies, such as a host, a path, an id or a date, as an argument, and read secrets from the environment.
- A script stops at the first error with a non-zero exit code and a message that names what failed.
- A script meant to read must not be able to write, so it uses a read-only account, a `SELECT` or a dry-run flag. A script that changes data has a dry-run mode, and you run that mode first.
- Keep scratch scripts and their output in the session's scratch directory, outside the repository, and delete them when the work is done unless they are part of the deliverable.

## Performance

On a hot path, put no query or network call inside a loop over rows, read a page or a stream rather than a whole table or file, and give every new filter or join on a large table an index. Measure before you optimize anything subtler.
