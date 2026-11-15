# uv projects, scripts and packaging

Detail for uv 0.13 projects. The everyday commands are in `SKILL.md`.

## Projects and groups

- `uv init` creates a packaged application since uv 0.12: `src/<name>/`, the `uv_build` backend and a `[project.scripts]` entry run as `uv run <name>`. `uv init --lib` adds `py.typed`, and `uv init --no-package` gives the old unpackaged layout with `main.py`.
- uv syncs the `dev` group by default. Change the set with `[tool.uv] default-groups = ["dev", "test"]` or `"all"`, and leave groups out of production installs with `uv sync --no-dev` or `--no-default-groups`.
- A group includes another with `{include-group = "lint"}` inside its list.
- A legacy `[tool.uv] dev-dependencies` list merges into the `dev` group, and `uv add --dev` keeps writing to it while it exists. Move its entries into `[dependency-groups]`.
- Outside uv, pip 25.1 and later install a group with `pip install --group dev` or `--group path/to/pyproject.toml:dev`.
- `uv run other/script.py` uses the project that contains the script since uv 0.12, not the current directory. Pass `--project .` to force the current one.
- Since uv 0.12 the resolver falls back to pre-releases when no stable version fits, also for transitive requirements. Pass `--prerelease disallow` where a pre-release must not be picked.

## Scripts with inline metadata

- A script's metadata block needs a `dependencies` key even when the list is empty:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.15"
# dependencies = ["httpx"]
# ///
```

- With that shebang and `chmod +x`, the script runs directly. `uv lock --script tool.py` writes `tool.py.lock`, which later `uv run --script` and `uv add --script` calls reuse.

## Cooldown and resolution

- `exclude-newer` accepts an RFC 3339 timestamp, a friendly duration such as `"7 days"` (uv 0.9.17 and later), or an ISO 8601 duration such as `"P7D"`. `exclude-newer-package = { pkg = false }` exempts one package.
- uv always resolves build dependencies (`[build-system] requires` and those of source distributions) to their newest allowed versions at build time, and `uv.lock` does not pin them. Constrain them with `==` in `requires` or with `[tool.uv] build-constraint-dependencies`.

## Building and publishing

- `uv_build` builds pure Python only. Extension modules need another backend, such as `maturin` (`uv init --build-backend maturin`) or `scikit-build-core`.
- `uv init` writes `requires = ["uv_build>=0.13.N,<0.14"]`. uv uses its bundled backend only while that range allows its own version, and otherwise downloads a matching `uv_build` package. Raise the upper bound when moving to uv 0.14.
- Before publishing a library, run `uv build --no-sources`. `[tool.uv.sources]` path, Git and workspace entries apply only inside uv and would hide a broken published requirement.
- Write `license = "MIT"` as an SPDX expression plus `license-files = ["LICENSE"]` (PEP 639). The `license = {text = ...}` table and `License ::` classifiers are deprecated, and backends may reject a license expression combined with those classifiers.

## Environments and interpreters

- `uv venv` replaces an existing environment only with `--clear` (0.10 and later) and clears a directory that is not an environment only with `--clear --force` (0.12 and later).
- `uv python upgrade` moves managed interpreters to the latest patch, and project environments follow unless they were created with an exact patch.
- uv may pick a free-threaded 3.14 or newer interpreter when it comes first on PATH. Request `3.14+gil` when the GIL build is required.
- uv 0.13 prefers native ARM64 interpreters on Windows ARM64. Set `UV_PYTHON_ARCH=x86_64` where a dependency ships only x86-64 wheels.
