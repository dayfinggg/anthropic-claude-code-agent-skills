# Situational rules

Project configuration, formatters, and linters win over this file.

## Failure handling

- Fail closed. An error inside a permission or validation check denies the operation.
- Roll back work left half done.
- Messages to users reveal no internals.

## Shared state

- Synchronize shared state across threads, tasks, or processes, or confine it to one owner.

## Parameters

- Give adjacent parameters of the same type distinct types or a parameter object, so callers cannot swap them. This follows C++ Core Guidelines I.24.
- Prefer one deep function with a simple interface over a chain of shallow ones.

## Agent-written code

- Check that a new dependency exists and is the intended package before adding it. Models invent package names.
- Prefer the standard library over a new dependency.
- Use parameterized queries, encode output, and keep secrets out of code and logs. Generated code fails security checks often.

## Change size

- Google's review guidance calls 100 lines usually reasonable for one change and 1000 lines usually too large.
- Before a risky refactor of untested code, add characterization tests.
- Change structure in small steps.

## Exceptions

- Leave generated, vendored, and migration code as it is.
- In hot paths, measure before restructuring.
- One-off scripts stay correct and readable and skip architecture.
