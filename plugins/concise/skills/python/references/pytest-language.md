# pytest and newer Python features

Detail for pytest 9.2, pytest-asyncio 1.5, and Python syntax and typing from 3.12 to 3.15. Use a feature only when `requires-python` is at least the version given.

## pytest configuration

- pytest 9 reads native TOML from `[tool.pytest]` in `pyproject.toml` or `[pytest]` in `pytest.toml`, with real lists and integers. One file cannot hold both `[tool.pytest]` and `[tool.pytest.ini_options]`.

```toml
[tool.pytest]
strict = true
testpaths = ["tests"]
addopts = ["-ra"]
```

- `strict = true` turns on `strict_config`, `strict_markers`, `strict_parametrization_ids` and `strict_xfail`, and every strictness option pytest adds later. Use it with a locked pytest version. Set strictness there rather than in `addopts`, because pytest 9.0.x silently ignored `--strict-markers` and `--strict-config` in `addopts` (fixed in 9.1.0).
- Since 9.2, top-level keys in a `pytest.toml` without a `[pytest]` table are an error instead of being ignored.

## pytest deprecations and breaks

- 9.2 makes `indirect`, `ids` and `scope` of `parametrize` keyword-only. A call such as `parametrize("a", "b", [(1, 2)])` now raises `TypeError`.
- 9.1 deprecates generators and other non-`Collection` iterables as `argvalues`. Pass a list or tuple.
- 9.1 deprecates class-scoped fixtures written as instance methods, and 9.2 extends that to module, package and session scope. Define such fixtures at module level or with `@classmethod`.
- 9.2 schedules `yield_fixture` for removal. Use `@pytest.fixture` with `yield`.

## pytest-asyncio

- 1.0 removed the `event_loop` fixture. Choose the loop with `@pytest.mark.asyncio(loop_scope="module")` or `@pytest_asyncio.fixture(loop_scope="module")`.
- Set `asyncio_default_fixture_loop_scope`, which warns when unset. 1.5 adds the value `"fixture-scope"`, which makes each async fixture use its own `scope` as loop scope.
- Overriding `event_loop_policy` is deprecated since 1.4. Supply custom loops through the `pytest_asyncio_loop_factories` hook and select them per test with `@pytest.mark.asyncio(loop_factories=[...])`.

## Typing by floor

- A 3.12 floor allows `def first[T](xs: list[T]) -> T`, `class Box[T]:`, `type Pair = tuple[int, int]` and `@typing.override`, which replace `TypeVar` and `TypeAlias` boilerplate.
- A 3.13 floor adds type parameter defaults such as `class Box[T = int]:`, `typing.TypeIs`, `typing.ReadOnly` and `warnings.deprecated`.
- From 3.14 annotations are evaluated lazily (PEP 649), so forward references need no quotes, and `from __future__ import annotations` is deprecated. Read annotations with `annotationlib.get_annotations(obj, format=Format.FORWARDREF)` when names may be undefined.
- A 3.15 floor adds `typing.TypeForm[T]` for values that are type expressions, `TypedDict` with `closed=True` or `extra_items=T` (PEP 728), and `@typing.disjoint_base` (PEP 800).

## Syntax and built-ins

- 3.14 adds `t"..."` template strings, which return `string.templatelib.Template` for libraries that escape interpolations in SQL, HTML or shell text, and allows `except A, B:` without parentheses when there is no `as`.
- 3.15 adds `lazy import json` and `lazy from pathlib import Path`, which defer loading until first use. They are allowed only at module level, not in a function, class body or `try` block, and star and `__future__` imports cannot be lazy. `__lazy_modules__ = ["json"]` gives the same effect on 3.15 and stays eager on older versions.
- 3.15 also adds built-in `frozendict(...)` (hashable when its contents are), `MISSING = sentinel("MISSING")`, unpacking in comprehensions as in `[*xs for xs in lists]` and `{**d for d in dicts}`, and `re.prefixmatch()` as the preferred name for `re.match()`.
