# Code

These rules cover every piece of code you write, tests, migrations, configuration and scripts included. The project's own conventions come first, so match the surrounding code in naming, structure and idiom.

## Design and comments

- Build the simplest thing that solves the stated problem well. Before you write something new, search the codebase, the framework and the installed packages for code that already does the job.
- Turn input from users, files and external APIs into a checked value once, where it enters, and trust your own code inside. Add no handling, fallback or validation for a case that cannot happen, and stop with a clear error when something is broken instead of carrying on with a default.
- Write code that explains itself through names and structure, with no comments, docstrings or commented-out code, in tests, SQL and configuration too, and put the reason for an odd-looking choice into the commit message. Keep existing comments unless your change makes one wrong, and add a comment only when the user or the project's rules ask for it. Shebangs, lint directives and comments that a language's tools require, such as `// SAFETY:` above an `unsafe` block, are exempt.

## Changing code and fixing bugs

- Make the smallest change that does the job. Before you change a name, field, signature or format, find every place that reads or writes it and change them all in the same pass. Remove what your change made unused, leave older dead code alone, and leave no placeholders, stubs, TODOs or debug output.
- Write a general solution that is correct for every valid input, and never hard-code an expected result or special-case a test.
- Fix the root cause. Catching or silencing the error, a special case for the failing input, a default that hides the failure, a retry that masks it, switching the feature off or adding it to an ignore list only removes the symptom, so ship such a stopgap only when the user agrees, and call it temporary.
- When an error starts in a library or a framework, check that your code uses it as its documentation says, and whether a newer version or an upstream fix already solves it.
- When two fixes that rest on the same premise fail, test that premise before a third. After three failed rounds, stop patching and bring the user in with the failing output, what the rounds changed and the approach you would try next.

## Scripts and performance

- Use a command the project already has or a standard tool before you write a script. A script takes every value that varies, such as a host, a path or a date, as an argument, reads secrets from the environment, and stops at the first error with a message that names what failed.
- A script meant to read cannot write, so it uses a read-only account, a `SELECT` or a dry-run flag, and a script that changes data has a dry-run mode that you run first. Keep scratch scripts and their output in the session's scratch directory, and delete them when the work is done.
- On a hot path, put no query or network call inside a loop over rows, stream instead of loading a whole table or file, and give every new filter or join on a large table an index. Measure before you optimize anything subtler.
