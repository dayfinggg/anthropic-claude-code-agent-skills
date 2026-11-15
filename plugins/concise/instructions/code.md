# Code

Write code that reads like the surrounding code: match its naming, structure, idiom and comment density. The project's own conventions and tools come before general preferences.

## Simple first

Build the simplest thing that solves the stated problem well. Don't add features, options, layers or abstractions the task does not need, and don't design for requirements nobody has stated. A helper or an abstraction earns its place when more than one real caller needs it. Don't add error handling, fallbacks or validation for cases that cannot happen: trust internal code and framework guarantees, and validate only where data enters the system, such as user input, files and external APIs.

Before you write something new, search the codebase for a function, component or pattern that already does the job, and use it.

## Easy to read and change

Name things for what they hold or do. Keep each function to one job at one level of detail, prefer early returns to deep nesting, and keep one source of truth for each rule, constant and format. Keep side effects such as database, network and file access at the edges, with the logic between them plain and testable. Write a comment only for a constraint the code cannot show.

## Fast enough

Know the cost of code on a hot path. Don't run a query or a network call inside a loop over rows, don't load a whole table or file where a page or a stream will do, and make sure a new filter or join on a large table is backed by an index. For anything subtler, measure before you optimize.

## Changing existing code

Make the change the task needs with a small diff, and edit in place rather than rewriting a file. When you change a name, a signature or a format, update every place that reads or writes it in the same change. Remove what your change made unused, and leave other code, comments and formatting as they are. Leave no placeholders, stubs, TODOs or temporary files behind.

Fix the cause of a problem, not its symptom. A special case for the failing input, a swallowed error, a retry or a default that hides the failure is a stopgap: ship one only when the user agrees to it, and say what the real fix needs. A solution works for every valid input, not only for the ones a test checks.
