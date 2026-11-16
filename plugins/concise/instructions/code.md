# Code

These rules hold for every piece of code you write: product code, tests, migrations, configuration, one-off scripts, probes and shell commands of more than a line. A helper script that only reads data or checks a page meets the same bar as the feature it serves, because a careless script breaks things as surely as careless product code.

The project's own conventions and tools come first. Match the surrounding code in naming, structure and idiom.

## Design

- KISS: build the simplest thing that solves the stated problem well.
- YAGNI: add no feature, option, layer or setting for a need nobody has stated. The right amount of complexity is the minimum the task needs.
- DRY: each piece of knowledge, such as a rule, a constant or a format, has one source of truth. DRY is about knowledge, not about text that looks alike, so two fragments that change for different reasons stay separate. Before you write something new, search the codebase for a function, component or pattern that already does the job.
- Rule of Three: live with two similar cases and extract a shared helper when the third real one appears.
- SOLID and separation of concerns: give each function, class and module one reason to change, pass dependencies in instead of creating them inside, and keep interfaces small. Keep side effects such as database, network, file and clock access at the edges, with plain, testable logic between them (a functional core in an imperative shell). None of this justifies an interface with a single implementation or a layer that only passes calls through.
- Prefer composition to inheritance, pure functions to shared state, and immutable data.
- Parse, don't validate: at a system boundary turn input from users, files and external APIs into a typed value once, and pass that value inward. Fail fast: when something is broken, stop with a clear error instead of continuing on a default. Make illegal states unrepresentable where the language has types. Inside the system trust your own code and the framework, and add no error handling, fallback or validation for a case that cannot happen.
- Clean Code naming: a name says what the thing holds or does, so the code reads without explanation. Prefer early returns to deep nesting.

## Comments

Write self-documenting code without comments, docstrings or commented-out code, in scripts, tests, SQL and configuration too, even where the older code of the file has them. Put the meaning into names and structure, and the reason for a choice that looks odd into the commit message. Leave existing comments as they are, unless your change makes one wrong: then correct or remove it. Add a comment only when the user asks for one or the project's written rules require it. A line the toolchain reads, such as a shebang or a lint directive, is not a comment.

## Scripts, probes and one-off commands

- First look for a command the project already has or a standard tool that does the job. Write a script only when neither exists.
- Before you write a script, load the skill for its language and for what it drives, such as concise:shell, concise:python or concise:database.
- Pass every value that varies, such as a host, a path, an id or a date, as an argument. Hard-code none of them, and read secrets from the environment.
- Make the script stop at the first error with a non-zero exit code and a message that names what failed. Do not silence errors or throw away output you will need to diagnose a failure.
- Wait for a condition, such as an element, a response or a file, with a timeout. Do not sleep for a fixed time. In a session, keep a wait longer than a few seconds out of the foreground: watch the condition with the Monitor tool, or start the command in the background and carry on until its completion notice arrives.
- A script that is meant to read must not be able to write: use a read-only account or transaction, a `SELECT`, a dry-run flag. A script that changes data has a dry-run mode that prints what it would change, and you run that mode first.
- Keep scratch scripts and their output outside the repository, in the session's scratch directory. Delete the temporary files, helper scripts and test data you created when the work is done, unless they are part of the deliverable.

## Changing existing code

- Make surgical changes: the smallest diff that does the job, edited in place. Every changed line traces to the request.
- Before you change a name, field, signature or format, find every place that reads or writes it and change them all in the same pass.
- Do not improve adjacent code, comments or formatting, and do not leave the code you touched worse than you found it. Remove the imports, variables and functions your change made unused. Mention older dead code instead of deleting it.
- Split a large change into small steps that each end in a check. Before you report, read your whole diff against the request and drop each change that does not trace to it.
- Structural changes such as a rename, a move or a reformat go in their own commit, before the behavioral change that needs them.
- Leave no placeholders, stubs, TODOs, debug output or dead code.
- Record every change you made, including small ones, in the commit message or the project's own log. Load the concise:git skill before you commit, rebase or open a pull request.

## Solutions

- Write a general solution that is correct for every valid input, not only for the cases a test checks. Never hard-code an expected result or add a special case for a test.
- Fix the root cause. A stopgap is anything that only removes the symptom: catching or silencing the error, a special case for the failing input, a default or fallback that hides the failure, a retry that masks it, switching the feature off, adding the failing item to an ignore or skip list, patching a library at runtime. Ship a stopgap only when the user agrees to it, call it temporary in the report and say what the real fix needs.
- Do not substitute a narrower, safer, merely compatible or easier-to-test solution because it is more likely to pass the checks at hand.
- When an error starts in a library or a framework, first check that your code uses it as its documentation says and whether a newer version or an upstream fix already solves it.
- When a fix still fails its check after three rounds, stop patching and bring the user in with the failing output, what the three rounds changed and the approach you would try next.
- When the complete fix is out of reach because information, access or a decision is missing, name what blocks it and ask. A step that only looks hard or slow is not out of reach.

## Performance

Know the cost of code on a hot path: no query or network call inside a loop over rows, no whole table or file loaded where a page or a stream will do, and an index behind every new filter or join on a large table. For anything subtler, measure before you optimize.
