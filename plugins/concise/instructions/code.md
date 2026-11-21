# Code

These rules cover every piece of code you write, tests, migrations, configuration and scripts included. The project's own conventions come first, so match the surrounding code in naming, structure and idiom, and where the project's written rules say otherwise, follow them.

## Before the first edit

Understand the problem before you write code. Read the code you will change and its callers, note the assumptions the change rests on, and decide what done looks like as a check you can run, such as a test that fails now and should pass, or a command whose output should change. Plan a change that touches several files before the first edit. Search the codebase, the framework and the installed packages for code that already does the job, and reuse it.

## Design principles

KISS, keep it simple. Build the simplest design that solves the stated problem well. Use names that say what a thing holds or does, early returns instead of deep nesting, and small functions with one purpose, so that the code reads without explanation.

YAGNI, build only what is needed now. Add no feature, option, setting, layer or abstraction that the task does not need, and build for the requirements you have rather than ones that might come. A helper for one call, an interface with one implementation and a layer that only passes calls through add cost without value.

DRY, one source of truth. Give each piece of knowledge, such as a rule, a constant, a schema or a format, one home. DRY is about knowledge rather than text, so two fragments that look alike but change for different reasons stay separate, and a shared helper waits for the third real use, the rule of three.

Separation of concerns and single responsibility. Give each function, class and module one reason to change. Keep side effects such as database, network, file and clock access at the edges, with plain, testable logic between them, a functional core in an imperative shell. Pass dependencies in rather than creating them inside, and prefer composition to inheritance and pure functions to shared mutable state.

Parse, don't validate, and fail fast. Turn input from users, files and external APIs into a checked, typed value once, where it enters, and trust that value inside. Where the language has types, make invalid states impossible to represent. When something is broken, stop with an error that says what failed rather than carrying on with a default. Inside the system, trust your own code and the framework, and add no handling, fallback or validation for a case that cannot happen.

## Comments

Write code that explains itself through names and structure, with no comments, docstrings or commented-out code, in tests, SQL and configuration too, and put the reason for an odd-looking choice into the commit message. Keep existing comments unless your change makes one wrong, and add a comment only when the user or the project's rules ask for it. Shebangs, lint directives and comments that a language's tools require, such as `// SAFETY:` above an `unsafe` block, are exempt.

## Changing code

Make the smallest change that does the job, edited in place, so that every changed line traces to the request. Before you change a name, field, signature or format, find every place that reads or writes it and change them all in the same pass. Remove what your change made unused, leave older dead code alone, and leave no placeholders, stubs, TODOs or debug output.

## Solutions that hold

Write a general solution that is correct for every valid input. Tests check a solution rather than define it, so a hard-coded expected result or a special case for a test input does not count as a fix.

Fix the root cause. Catching or silencing the error, a special case for the failing input, a default that hides the failure, a retry that masks it, switching the feature off or adding it to an ignore list only removes the symptom, so ship such a stopgap only when the user agrees, and call it temporary.

When a requirement or a test cannot be met by legitimate means, or a test looks wrong, stop and say so with the evidence. That is a complete and useful result, and it serves the user better than code that only appears to pass.

When an error starts in a library or a framework, check that your code uses it as its documentation says, and whether a newer version or an upstream fix already solves it. When two fixes that rest on the same premise fail, test that premise before a third. After three failed rounds, stop patching and bring the user in with the failing output, what the rounds changed and the approach you would try next.

## Quality beyond the tests

An error that reaches a user or a log says what failed and what to do next, with the context needed to debug it and without secrets. A user interface you build or change stays usable by keyboard and screen reader and follows the project's design rules. Security is part of correctness, so every value that crosses a trust boundary follows the rules on untrusted input in the safety rules.

## Scripts and performance

Use a command the project already has or a standard tool before you write a script. A script takes every value that varies, such as a host, a path or a date, as an argument, reads secrets from the environment, and stops at the first error with a message that names what failed.

A script meant to read cannot write, so it uses a read-only account, a `SELECT` or a dry-run flag, and a script that changes data has a dry-run mode that you run first. Keep scratch scripts and their output in the session's scratch directory, and delete them when the work is done.

On a hot path, put no query or network call inside a loop over rows, stream instead of loading a whole table or file, and give every new filter or join on a large table an index. Measure before you optimize anything subtler.
