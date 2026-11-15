# Ruff, ty and mypy

Detail for ruff 0.17, ty 0.0.104 and mypy 2.4. The main defaults are in `SKILL.md`.

## Ruff

- Ruff 0.15 switched to the 2026 style guide and reformats code written under 0.14. Expect a repository-wide diff from that bump alone, and commit it separately.
- Ruff 0.16 dropped 18 opinionated `E` and `F` rules from the default set, among them `E402`, `E701`, `E731`, `E741`, `F403` and `F405`. Add them to `extend-select` where the project relied on them.
- Ruff 0.17 removed `DTZ001`, `DTZ005` and other `flake8-datetimez` rules from the default set. Add `DTZ` to `extend-select` where naive datetimes must be caught.
- Suppress one line with `# ruff: ignore[F401]` at its end or on the line above (0.16 and later), and a region with `# ruff: disable[N803]` and `# ruff: enable[N803]` (0.15 and later). `# noqa: F401` still works.
- `TID255` flags a `lazy import` whose name is used at module level, for example as a base class, because that use loads the module at once.
- `ANN` rules report missing annotations. Neither ty nor the default ruff set does.
- A ruff `isort.required-imports` entry for `from __future__ import annotations` keeps adding an import that 3.14 deprecates. Remove the entry once the floor is 3.14.
- The conda-forge build of ruff 0.17 no longer has a Python package, so `python -m ruff` fails there. Call `ruff` from PATH or install from PyPI.

## ty

- 0.0.97 renamed `unresolved-import` to `import-not-found`. The old name stays as an alias, and when one table sets both, the current name wins.
- Configure with `[tool.ty.environment] python-version = "3.14"` and `[tool.ty.rules]`, where each rule is `"error"`, `"warn"` or `"ignore"` and the key `all` sets every rule. Without `python-version` ty uses the `requires-python` floor.
- A `ty.toml` file wins over `pyproject.toml`, and the `[tool.ty]` table next to it is then ignored entirely.
- Suppress with `# ty: ignore[rule]`. In a `# type: ignore[...]` comment ty reads only codes with a `ty:` prefix, so one comment serves mypy and ty: `# type: ignore[arg-type, ty:invalid-argument-type]`. A bare `# type: ignore` silences every rule on the line.
- Adopt ty on an existing codebase with `ty check --add-ignore`, which writes `ty: ignore` comments, or with a baseline (preview since 0.0.93): set `[tool.ty] baseline = "ty-baseline.json"` and run `ty check --update-baseline`. The baseline format may change between releases.
- ty has no plugin system but built-in support for Django, Pydantic and pytest.

## mypy

- mypy 2.0 gave `--allow-redefinition` the behavior of 1.x `--allow-redefinition-new`. `--allow-redefinition-old` keeps the old behavior.
- mypy 2.0 respects `--ignore-missing-imports` for every package, including those whose stubs mypy 0.812 and earlier bundled, so missing `types-*` stubs for them no longer show up when that flag is set.
- Run mypy inside the project environment (`uv run mypy`), never through `uvx`, or it cannot see installed packages.
