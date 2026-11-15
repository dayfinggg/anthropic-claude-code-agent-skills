---
name: python
description: Python code and projects with uv, ruff, ty, mypy and pytest, covering pyproject.toml, dependency groups, inline script metadata, packaging and Python version choice. Use when writing, reviewing, debugging or setting up Python code, adding or upgrading packages, running a .py script, configuring linting, type checking or tests, or moving off pip, Poetry, Black or Flake8. Also for uv.lock, conftest.py and externally-managed-environment errors.
---

# Python

This skill covers Python code and the uv, ruff, ty, mypy and pytest tool chain. It matches Python 3.15, uv 0.13, ruff 0.17, ty 0.0.104, mypy 2.4 and pytest 9.2. See what a project uses with `uv --version`, `uv run python -VV`, `uv run ruff --version`, `uv run ty --version` and `uv tree --depth 1`. Where the installed release is newer, its own `--help` and changelog are right.

## Check first

- Read `requires-python`, `.python-version` and the lockfile before choosing syntax or commands. `uv.lock` means uv, `poetry.lock` Poetry, `pdm.lock` PDM, and bare `requirements*.txt` pip or `uv pip`. Keep the project's tool. The uv defaults below apply to uv projects and new projects.
- Tool config lives in `[tool.ruff]` or `ruff.toml`, `[tool.ty]` or `ty.toml`, `[tool.mypy]` or `mypy.ini`, and `[tool.pytest]`, `[tool.pytest.ini_options]` or `pytest.toml`.

## Versions

- Python 3.15.0 shipped on 2026-10-09. 3.15 and 3.14 get bug fixes, 3.11 to 3.13 get security fixes only, and 3.10 reached end of life on 2026-10-01.
- A new application pins 3.15 with `uv python pin 3.15` once its dependencies ship 3.15 wheels, else 3.14. A new library sets `requires-python = ">=3.11"`.
- On 3.15 require 3.15.2 or later: 3.15.0 and 3.15.1 can deadlock or raise a spurious "partially initialized module" `ImportError` when several threads first import submodules of one package.
- uv 0.13 downloads 3.15 when no version is pinned and no suitable interpreter is installed.

## Running and dependencies

- Run everything in a uv project through `uv run`, as in `uv run pytest` or `uv run python -m app`. Bare `python` and `pytest` use whatever is on PATH, not `.venv`.
- `uv add httpx` adds a runtime dependency, `uv add --dev pytest` the `dev` group, `uv add --group lint ruff` a named group, and `uv add --optional cli typer` a published extra. `uv lock --upgrade-package httpx` upgrades one locked package.
- Dev, test, lint and docs tools go in `[dependency-groups]` (PEP 735), which never reaches the published metadata. `[project.optional-dependencies]` is only for optional runtime features installed as `pkg[extra]`.
- Commit `uv.lock` for libraries too. It pins the development environment, not what users install.
- Use `uvx <tool>` only for tools that do not import the project, such as ruff. `uvx pytest` and `uvx mypy` run without the project's dependencies.
- A one-file script declares its own dependencies (PEP 723): `uv init --script tool.py --python 3.15`, then `uv add --script tool.py httpx`, then `uv run tool.py`. Such a script ignores the surrounding project's dependencies.
- Set a dependency cooldown against hijacked releases: `[tool.uv] exclude-newer = "7 days"` ignores files uploaded in the last 7 days.

## Lint, format and types

- Ruff 0.16 and later enable 413 rules by default, up from 59. `select` replaces the default set and `extend-select` adds to it.
- Ruff 0.17 assumes Python 3.11 when neither `requires-python` nor `target-version` is set. Set `requires-python` so the `UP` fixes match the real floor.
- ty is beta at 0.0.x and any release may rename or split rules. Pin it exactly, as in `uv add --dev ty==0.0.104`, and run it as `uv run ty check` so it finds the project's packages.
- mypy 2.0 (2026-05) turned on `--local-partial-types` and `--strict-bytes` by default and dropped `--python-version 3.9`. Expect new errors when moving from 1.x.

## Simple, safe and fast Python

- Model a value as `@dataclass(frozen=True, slots=True)` or a `NamedTuple`, not a dict passed between functions or a class with hand-written `__init__`.
- Run programs with `subprocess.run([prog, arg], check=True, timeout=...)`. Never pass `shell=True` with any interpolated value, because the shell parses it.
- Give every `requests` call a `timeout=`. Without one it can hang forever. `httpx` defaults to 5 seconds of network inactivity.
- Extract tar archives with `extractall(path, filter="data")`. 3.14 made `data` the default, but code that must run on 3.13 or older passes it, because the old default allows absolute paths and links outside the target.
- In async code start tasks in `async with asyncio.TaskGroup() as tg:`. It cancels the siblings when one fails, while `gather` leaves them running. A bare `asyncio.create_task(...)` whose result is not stored can be garbage-collected mid-run.
- Write `datetime.now(UTC)`, not `datetime.utcnow()`, which returns a naive value and is deprecated since 3.12.
- Pass `logging` a constant `%`-style pattern with the values as arguments, as in `log.info("user %s", uid)`. An f-string formats even when the level is off and breaks grouping by message. Ruff's `G004` flags it but is not in the default set.
- Measure before optimizing. On 3.15 `python -m profiling.sampling run script.py` or `attach <pid>` samples a running process with almost no overhead, and `python -X importtime` shows slow imports. `lazy import` (3.15) defers a heavy import to first use.

## Gotchas

- `uv run` locks and syncs first, so it can rewrite `uv.lock` and `.venv`. Pass `--frozen` when those files must stay untouched, or `--locked` to fail on a stale lockfile.
- `uv sync` is exact and removes every package the lockfile does not select, including anything installed with `uv pip install`. Add dependencies with `uv add`.
- `uvx ruff` keeps reusing the version cached on its first run. Use `uv run ruff` for the project's pin, or `uvx ruff@latest`.
- `pip install` failing with `externally-managed-environment` means the interpreter belongs to the OS (PEP 668). Use a project with `uv add`, a one-off `uv run --with pkg`, or `uv tool install`, not `--break-system-packages`.
- On Unix other than macOS, 3.14 and later start `multiprocessing` and `ProcessPoolExecutor` workers with `forkserver`, not `fork`. Workers stop inheriting runtime globals and their arguments must pickle. Request `multiprocessing.get_context("fork")` where fork semantics are required.
- 3.15 makes UTF-8 the default for `open()` without `encoding` (PEP 686). Code that must also run on 3.14 or older still passes `encoding="utf-8"`.
- On Windows `os.kill(pid, 0)` is not a liveness check. Signal 0 is `signal.CTRL_C_EVENT` there, so the call sends a Ctrl+C event, and any other number kills the process through `TerminateProcess`. Use `psutil.pid_exists(pid)`.
- `frozendict` (3.15) is not a `dict` subclass, so `isinstance(x, dict)` rejects it. Check `collections.abc.Mapping`.
- Ruff 0.16 and later also format Python code blocks in `*.md` files, so `ruff format .` edits docs. Pass explicit paths, or wrap blocks in `<!-- fmt:off -->` and `<!-- fmt:on -->`.
- ty exits 1 on warnings by default. Set `[tool.ty.terminal] error-on-warning = false` or pass `--exit-zero-on-warning` only when warnings should pass.

## References

- [references/uv-packaging.md](references/uv-packaging.md): read when setting up or changing a uv project, dependency groups, scripts with inline metadata, the build backend, publishing, `uv venv` or interpreter selection, or when a uv command behaves differently after an upgrade.
- [references/lint-types.md](references/lint-types.md): read when configuring or upgrading ruff, ty or mypy, suppressing a diagnostic, adopting ty on an existing codebase, or when a lint or type error appears after an upgrade.
- [references/pytest-language.md](references/pytest-language.md): read when configuring pytest or pytest-asyncio, fixing pytest deprecation warnings, or writing code that uses typing or syntax from Python 3.12 to 3.15 against a given `requires-python` floor.

Related skills: concise:testing for test design and property tests, concise:debugging for failing tests and crashes, concise:architecture for src layout and import rules, concise:codebase-analysis for wide mechanical changes such as replacing a deprecated API.
