---
name: python
description: Current Python 3.15 practice for uv, ruff, ty, mypy and pytest, pyproject.toml packaging, dependency groups and inline script metadata. Use when writing, reviewing, debugging or setting up Python code or projects, adding or upgrading packages or Python versions, creating a virtual environment, running a .py script, choosing a Python version, or configuring linting, formatting, type checking or tests. Triggers include pyproject.toml, uv.lock, requirements.txt, .python-version, ruff.toml, ty.toml and conftest.py, commands such as pip install, uvx, uv add and pytest, moving off Poetry, Black, Flake8 or mypy, PEP 723 and PEP 735, and errors such as externally-managed-environment.
---

## Read first

Go through these steps before you act on this skill. Do each step whose condition fits the task, and read each such file in full with the Read tool. When you cannot tell whether a step fits, do it. When the work later reaches a step you skipped, do it then.

1. Fetch https://peps.python.org/api/release-cycle.json (Python branch status) with `curl -sL` or WebFetch when the task depends on that version or rule, and follow the page where it is newer than this skill.
2. Fetch https://pypi.org/rss/project/uv/releases.xml (Current uv release) with `curl -sL` or WebFetch when the task depends on that version or rule, and follow the page where it is newer than this skill.
3. Fetch https://pypi.org/rss/project/ruff/releases.xml (Current ruff release) with `curl -sL` or WebFetch when the task depends on that version or rule, and follow the page where it is newer than this skill.

## Check first

- Read `requires-python`, `.python-version` and the lockfile before choosing syntax or commands. `uv.lock` means uv, `poetry.lock` Poetry, `pdm.lock` PDM, and bare `requirements*.txt` means pip or `uv pip`. Keep the project's tool. The uv defaults below apply to uv projects and new projects.
- Tool config sits in `[tool.ruff]` or `ruff.toml`, `[tool.ty]` or `ty.toml`, `[tool.mypy]` or `mypy.ini`, and `[tool.pytest]`, `[tool.pytest.ini_options]` or `pytest.toml`.
- Run `uv --version`, `uv run python -VV`, `uv run ruff --version`, `uv run ty --version` and `uv tree --depth 1` for the versions actually in use.
- Facts verified 2026-11.

## Defaults

- Python 3.15 is current: 3.15.0 shipped 2026-10-09 and 3.15.2 is the latest patch. 3.14 still gets bugfixes, 3.11 to 3.13 get security fixes only, and 3.10 reached end of life on 2026-10-01.
- A new application pins 3.15 with `uv python pin 3.15` once its dependencies ship 3.15 wheels, else 3.14. A new library sets `requires-python = ">=3.11"`. uv 0.13 downloads 3.15 when nothing is pinned or installed.
- Run everything in a uv project through `uv run`, as in `uv run pytest` or `uv run python -m app`. Bare `python` and `pytest` use whatever is on PATH, not `.venv`.
- `uv add --dev pytest` writes the `dev` group, `uv add --group lint ruff` a named group, and `uv add --optional cli typer` a published extra. `uv lock --upgrade-package httpx` upgrades one locked package.
- `uv init` creates a packaged application since uv 0.12, with `src/<name>/`, the `uv_build` backend and a `[project.scripts]` entry run as `uv run <name>`. `uv init --lib` adds `py.typed`, and `uv init --no-package` restores the old unpackaged layout.
- `uv_build` builds pure Python only. Extension modules need `uv init --build-backend maturin` or `scikit-build-core`.
- Before publishing a library, run `uv build --no-sources`. `[tool.uv.sources]` path, Git and workspace entries apply only inside uv.
- Use `uvx <tool>` only for tools that do not import the project, such as ruff. `uvx pytest` and `uvx mypy` run in an isolated environment without the project's dependencies.
- Commit `uv.lock` for libraries too. It pins the development environment, not what users install.
- `uv python upgrade` moves managed interpreters to the latest patch, and project environments follow unless they were created with an exact patch.
- Dev, test, lint and docs tools go in `[dependency-groups]` (PEP 735), which never reaches published package metadata. `[project.optional-dependencies]` holds optional runtime features that users install as `pkg[extra]`.
- uv syncs the `dev` group by default. Change the set with `[tool.uv] default-groups = ["dev", "test"]` or `"all"`, and leave it out of production installs with `uv sync --no-dev` or `--no-default-groups`. A group nests another with `{include-group = "lint"}`.
- Outside uv, pip 25.1 and later install a group with `pip install --group dev` or `--group path/to/pyproject.toml:dev`.
- A single-file script declares its own dependencies (PEP 723). Create it with `uv init --script tool.py --python 3.15`, add packages with `uv add --script tool.py httpx`, and run it with `uv run tool.py` or this shebang:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.15"
# dependencies = ["httpx"]
# ///
```

- A script's `dependencies` key must be present even when empty, and a script with this block ignores the surrounding project's dependencies. `uv lock --script tool.py` writes `tool.py.lock`, which later `uv run` and `uv add --script` calls reuse.
- `[tool.uv] exclude-newer = "7 days"` ignores files uploaded in the last 7 days, a cooldown against hijacked releases. Relative values work since uv 0.9.17, also as `P7D`. `exclude-newer-package = { pkg = false }` exempts one package.
- Write `license = "MIT"` as an SPDX expression plus `license-files = ["LICENSE"]` (PEP 639). The `license = {text = ...}` table and `License ::` classifiers are deprecated, and backends may reject a license string combined with those classifiers.
- Ruff 0.16 and later enable about 400 rules by default, up from 59. `select` replaces that default set and `extend-select` adds to it.
- Ruff 0.17 assumes Python 3.11 when neither `requires-python` nor `target-version` is set. Set `requires-python` so `UP` fixes match the real floor.
- Ruff suppresses one line with `# ruff: ignore[F401]` at its end or on the line above (0.16+), and a region with `# ruff: disable[N803]` and `# ruff: enable[N803]` (0.15+). `# noqa: F401` still works.
- ty is beta at 0.0.x, and any release may rename or split rules. 0.0.97 renamed `unresolved-import` to `import-not-found` and kept the old name as an alias. Pin it exactly, as in `uv add --dev ty==0.0.102`, and rerun it after each bump.
- ty reads `[tool.ty.environment] python-version = "3.14"` and `[tool.ty.rules]` levels `"error"`, `"warn"` or `"ignore"`, where `all = "error"` sets every rule. Without a `python-version` it targets the `requires-python` floor.
- ty suppresses with `# ty: ignore[rule]`. One comment serves mypy and ty as `# type: ignore[arg-type, ty:invalid-argument-type]`. Adopt ty on an existing codebase with `ty check --add-ignore` or a baseline, `ty check --update-baseline --baseline ty-baseline.json` (preview since 0.0.93).
- ty checks unannotated function bodies but does not report missing annotations. Add ruff's `ANN` rules for that. It has no plugins but built-in support for Django, Pydantic and pytest.
- Typing on a 3.12 floor: `def first[T](xs: list[T]) -> T`, `class Box[T]:`, `type Pair = tuple[int, int]` and `@typing.override` replace `TypeVar` and `TypeAlias` boilerplate.
- Typing on a 3.13 floor: type parameter defaults such as `class Box[T = int]:`, `typing.TypeIs`, `typing.ReadOnly` and `warnings.deprecated`.
- Typing on a 3.14 floor: annotations are evaluated lazily (PEP 649), so forward references need no quotes. `from __future__ import annotations` is deprecated. Read annotations with `annotationlib.get_annotations()`.
- Typing on a 3.15 floor: `typing.TypeForm[T]`, `TypedDict` with `closed=True` or `extra_items=T`, and `@typing.disjoint_base`.
- Python 3.14 adds `t"..."` template strings, which return `string.templatelib.Template` for libraries that escape interpolations in SQL, HTML or shell text. `except A, B:` needs no parentheses when there is no `as`.
- Python 3.15 adds `lazy import json` and `lazy from pathlib import Path`, which defer loading until first use. `__lazy_modules__ = ["json"]` gives the same effect on 3.15 and stays eager on older versions.
- Python 3.15 adds built-in `frozendict(...)` and `MISSING = sentinel("MISSING")`, unpacking in comprehensions as in `[*xs for xs in lists]` and `{**d for d in dicts}`, and `re.prefixmatch()` as the preferred name for `re.match()`.
- pytest 9 reads native TOML from `[tool.pytest]` or `pytest.toml`, with real lists and integers. One file cannot hold both `[tool.pytest]` and `[tool.pytest.ini_options]`.

```toml
[tool.pytest]
strict = true
testpaths = ["tests"]
addopts = ["-ra"]
```

- pytest's `strict = true` enables `strict_config`, `strict_markers`, `strict_parametrization_ids` and `strict_xfail`, plus strict options added later, so it suits a locked pytest. Set strictness there, since pytest 9.0.x silently ignored `--strict-markers` in `addopts`.
- pytest-asyncio 1.0 removed the `event_loop` fixture. Pick loops with `@pytest.mark.asyncio(loop_scope="module")` or `@pytest_asyncio.fixture(loop_scope="module")`, set `asyncio_default_fixture_loop_scope` (it warns when unset), and supply custom loops through the `pytest_asyncio_loop_factories` hook (1.4+) instead of overriding `event_loop_policy`.

## Gotchas

- `uv run` locks and syncs first, so it can rewrite `uv.lock` and `.venv`. Pass `--frozen` when those files must stay untouched, or `--locked` to fail on a stale lockfile.
- `uv sync` is exact and removes every package the lockfile does not select, including anything installed with `uv pip install`. Add dependencies with `uv add`.
- `uvx ruff` keeps reusing the version cached on its first run. Use `uv run ruff` for the project's pin, or `uvx ruff@latest`.
- `uv run other/script.py` uses the project that contains the script since uv 0.12, not the current directory. Pass `--project .` to force the current one.
- `uv venv` replaces an existing environment only with `--clear` (0.10+) and clears a non-environment directory only with `--force` (0.12+).
- Since uv 0.12 the resolver falls back to pre-releases when no stable version fits, also for transitive requirements. Pass `--prerelease disallow` where a pre-release must not be picked.
- `uv init` writes `uv_build>=0.13.8,<0.14`. After a uv minor upgrade the bundled backend no longer satisfies it, so builds fall back to downloading the old `uv_build` package. Raise the upper bound as each uv release note asks.
- `uv.lock` does not pin build dependencies. uv resolves `[build-system] requires` and the build requirements of source distributions to their newest allowed versions at build time. Pin them with `==` or `[tool.uv] build-constraint-dependencies`.
- A legacy `[tool.uv] dev-dependencies` list merges into the `dev` group, and `uv add --dev` keeps writing to it while it exists. Move its entries into `[dependency-groups]`.
- `pip install` failing with `externally-managed-environment` means the interpreter belongs to the OS (PEP 668). Use a project with `uv add`, a one-off `uv run --with pkg`, or `uv tool install`, not `--break-system-packages`.
- Ruff 0.16 and later also format Python code blocks in `*.md` files, so `ruff format .` edits docs. Pass explicit paths, or wrap blocks in `<!-- fmt:off -->` and `<!-- fmt:on -->`.
- Ruff 0.15 switched to the 2026 style guide and reformats code written under 0.14. Expect a repository-wide diff from that bump alone.
- A ruff `isort.required-imports` entry for `from __future__ import annotations` keeps adding that deprecated import. Remove it once the floor is 3.14.
- ty exits 1 on warnings by default since 0.0.52. Set `[tool.ty.terminal] error-on-warning = false` or pass `--exit-zero-on-warning` only when warnings should pass.
- A `ty.toml` file wins over `pyproject.toml`, and the `[tool.ty]` table next to it is ignored entirely.
- ty finds packages through the active environment or `.venv`. Run `uv run ty check`, or sync first, to avoid false `import-not-found` errors.
- mypy 2.0 (2026-05) enables `--local-partial-types` and `--strict-bytes` by default, gives `--allow-redefinition` new semantics (`--allow-redefinition-old` keeps the old ones), and no longer targets Python 3.9. Expect new errors when upgrading from 1.x.
- On Unix other than macOS, Python 3.14 and later start `multiprocessing` and `ProcessPoolExecutor` workers with `forkserver`, not `fork`. Workers stop inheriting runtime globals and their arguments must pickle. Request `multiprocessing.get_context("fork")` explicitly if fork semantics are required.
- Python 3.15.0 and 3.15.1 can deadlock when several threads first import `package.submodule` at once. Require 3.15.2 or later.
- Pass `logging` calls a constant `%`-style pattern with the values as arguments, as in `log.info("user %s", uid)`. An f-string formats even when the level is off and breaks grouping by message pattern. Ruff's `G004` flags it but is not in the default rule set.
- On Windows `os.kill(pid, 0)` is not a liveness check. Signal 0 is `signal.CTRL_C_EVENT` there, so the call sends a Ctrl+C console event, and any other number kills the process through `TerminateProcess`. Use `psutil.pid_exists(pid)`.
- Python 3.15 makes UTF-8 the default for `open()` without `encoding`. Code that must also run on 3.14 or older still passes `encoding="utf-8"`.
- `lazy import` inside a function, class body or `try` block is a `SyntaxError`, and star or `__future__` imports cannot be lazy. A lazy name used at module level, for example as a base class, loads at once, which ruff's `TID255` flags.
- `frozendict` is not a `dict` subclass, so `isinstance(x, dict)` rejects it. Check `collections.abc.Mapping`.
- uv may pick a free-threaded 3.14 or newer interpreter that comes first on PATH. Request `3.14+gil` when the GIL build is required.
- pytest 9.2 makes `indirect`, `ids` and `scope` of `parametrize` keyword-only. pytest 9.1 deprecates generators as `argvalues`, and 9.1 and 9.2 deprecate class, module, package and session fixtures defined as instance methods. Pass lists, and define such fixtures at module level or with `@classmethod`.
