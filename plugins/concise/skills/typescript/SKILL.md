---
name: typescript
description: Writes and fixes TypeScript types and compiler settings. Use it whenever a task adds or changes types, generics, type guards, branded types, or utility types, and when tsc reports a type error. Use it to replace `any` with a strict type. Use it when editing tsconfig.json, choosing module, target, or resolution settings, or upgrading to TypeScript 6 or 7 with the Go-based native compiler.
---

<project_first>
Follow the project before this skill, as `code_rules` requires. Read the `tsconfig.json` files the code uses, including every file in the `extends` chain. Find the installed TypeScript version in the lockfile or in `node_modules/typescript/package.json`. Read how nearby code already writes types, such as brands, guards, schema libraries, and helper types. Reuse those patterns.

Apply a version fact only to the version the project uses. Upgrade TypeScript only when the user asks.
</project_first>

<boundary>
This skill covers types, type errors, and compiler configuration. Running TypeScript inside Node.js, with type stripping or a loader, belongs to the `node` skill. JavaScript language features, browser code, and React belong to the `javascript` skill.
</boundary>

<rules>
Each rule file explains one technique with examples, which this file does not repeat. Read a file whole as soon as the task needs its technique, also later in the task.
- When one object should define both values and types, read [as-const-typeof.md](references/as-const-typeof.md). It derives types from runtime values with `as const` and `typeof`.
- When you need a union of the items in an array or tuple, read [array-index-access.md](references/array-index-access.md). It gets element types with `[number]`.
- When you wrap a function or derive a type from another type, read [utility-types.md](references/utility-types.md). It covers `Parameters`, `ReturnType`, `Awaited`, `Omit`, `Partial`, `Record`, and related types.
- When a generic loses information or infers `unknown`, read [generics-basics.md](references/generics-basics.md). It covers type parameters, constraints, defaults, and inference.
- When a fluent API must remember earlier calls, read [builder-pattern.md](references/builder-pattern.md). It tracks state in the type of a chainable builder.
- When a config object widens to `string` or `string[]`, read [deep-inference.md](references/deep-inference.md). It keeps literal types in nested arguments with `const` type parameters.
- When a type depends on another type, read [conditional-types.md](references/conditional-types.md). It covers `extends ? :` logic and distribution over unions.
- When you need the element, argument, or return type of something, read [infer-keyword.md](references/infer-keyword.md). It extracts parts of a type with `infer`.
- For typed routes, event names, or key renames, read [template-literal-types.md](references/template-literal-types.md). It builds and parses string types.
- When a new type follows the shape of another type, read [mapped-types.md](references/mapped-types.md). It transforms each property of a type, with key remapping and modifiers.
- When values share a primitive type but mean different things, read [opaque-types.md](references/opaque-types.md). It brands primitives so different IDs or validated strings cannot mix.
- When a union or `unknown` value needs a specific type, read [type-narrowing.md](references/type-narrowing.md). It covers control-flow narrowing, type predicates, assertion functions, and exhaustive checks.
- When the return type depends on the argument type, read [function-overloads.md](references/function-overloads.md). It gives one function several call signatures.
- When an error message is long or unclear, read [error-diagnosis.md](references/error-diagnosis.md). It explains how to read long compiler errors and isolate their cause.
</rules>

<workflow>
A type problem takes four steps.

1. Capture the full compiler output before you change code. Use the project's type-check script, or `npx tsc --noEmit` when it has none.
2. Find the root cause as the `debugging` block requires. Typical causes are unsound inference, a missing constraint, an implicit `any`, or a widened literal.
3. Fix the cause with the simplest precise type. Replace each `any` with a real type, and check that every call site still compiles.
4. Run the type check again and read the output, as the `verification` block requires.

Prefer a plain type, a union, or an overload over a type-level construct when both express the same contract. Keep the type changes inside the scope of the task.
</workflow>

<upgrade_facts>
TypeScript 7.0 is the Go-based native compiler, released in July 2026. It ships in the standard `typescript` package and keeps the `tsc` command. In November 2026 the latest stable release is 7.0.2, and 7.1 is in beta.

These five facts matter most when a project moves to TypeScript 6 or 7.

- TypeScript 6.0 changed the defaults. Now `strict` is `true`, `module` is `esnext`, `types` is `[]`, and `rootDir` is the directory of `tsconfig.json`.
- Every option that TypeScript 6.0 deprecates is a hard error in 7.0. Examples are `baseUrl`, `moduleResolution` `node`, `target` `es5`, and `downlevelIteration`.
- Move to 6.0 first and fix each deprecation error. The `ignoreDeprecations` setting only hides them in 6.0.
- TypeScript 7.0 has no programmatic API. Tools that import `typescript`, such as typescript-eslint, still need the `@typescript/typescript6` package.
- An omitted `types` list no longer loads every `@types` package. List global packages such as `node` explicitly.

Read [typescript-6-7.md](references/typescript-6-7.md) before you edit a `tsconfig.json`, upgrade TypeScript, or fix errors that appeared after an upgrade.
</upgrade_facts>

<quick_examples>
<remove_any_with_generics>
This function loses all type information, because it takes and returns `any`.

```ts
function getProperty(obj: any, key: string): any {
  return obj[key];
}
```

A generic key constraint keeps the link between the key and the value type. With it, `getProperty({ name: "Alice" }, "name")` returns `string`.

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```
</remove_any_with_generics>

<narrow_an_unknown_response>
This function returns `any` for data from the network.

```ts
async function fetchUser(): Promise<any> {
  const res = await fetch("/api/user");
  return res.json();
}
```

The fix types the response as `unknown` and narrows it with a type guard before it returns. The guard runs at the system boundary, where `code_rules` asks for validation.

```ts
interface User { id: number; name: string }

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number" &&
    "name" in value &&
    typeof value.name === "string"
  );
}

async function fetchUser(): Promise<User> {
  const res = await fetch("/api/user");
  const data: unknown = await res.json();
  if (!isUser(data)) throw new Error("Invalid user shape");
  return data;
}
```
</narrow_an_unknown_response>
</quick_examples>
