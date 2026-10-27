---
name: python-best-practices
description: "Python best practices. Use when reading or editing any .py or .pyi file, pyproject.toml, or a requirements file."
---

# Python best practices

Apply the **type-system-discipline** principle skill first. Read the Python version the code runs on before writing syntax: `requires-python` in `pyproject.toml`, `.python-version`, the Docker image, or `python3 --version` on the host that runs it. Use features up to that version and none above it. In existing files, match the file's style and touch only the code the task changes.

| Rule | Summary |
|------|---------|
| Type hints everywhere | Annotate every function signature and every variable whose type is not obvious. `Any` only at a boundary before parsing, `object` when you mean any value. Run the project's checker (mypy or pyright) at its configured strictness. |
| Data shapes | `@dataclass(frozen=True, slots=True)` for internal values, or the project's model library (Pydantic, attrs, msgspec) when it has one. A dict with string keys does not travel past one function. `TypedDict` only describes raw JSON at the boundary. |
| Tagged unions | Model variants as separate frozen dataclasses joined in a union. Dispatch with `match` (3.10), and end with `case _: assert_never(value)` so the checker flags a new variant. No classes with optional fields that can contradict each other. |
| Branded primitives | `NewType('UserId', int)` for ids that must not mix, created only by a parse function. A small frozen class when the value needs behavior or validation of its own. |
| Enums | `Enum`, or `StrEnum` (3.11), for closed sets instead of string constants. |
| Interfaces | `typing.Protocol` for what a function needs from an argument, `abc.ABC` only for shared implementation. Pass dependencies in instead of creating them inside. |
| Modern typing by version | `X \| None` and `list[int]` (3.10), `Self` (3.11), `type` aliases, `class Box[T]` generics and `@override` (3.12), `TypeIs` (3.13), annotations without quotes for forward references (3.14). Older targets import from `typing_extensions` when the project already depends on it. |
| Boundary parsing | Request bodies, JSON, environment values, CLI arguments, files and database rows are untrusted. Parse them once with the project's schema library or explicit checks into the typed model, then trust the types inside. Read `os.environ` once into a settings object at startup and fail fast on missing values. |
| Errors | Raise specific exception classes. Never bare `except:`. `except Exception` only at a top-level boundary that logs and answers or re-raises. Chain with `raise NewError(...) from err`. No `except ...: pass`. |
| Resources | `with` for files, locks, connections and temporary directories. `pathlib.Path` over string paths. Pass `encoding='utf-8'` when opening text files on targets before 3.15. |
| Mutable defaults | No mutable default arguments. Use `None` and create the value inside, or `field(default_factory=list)` in a dataclass. |
| Async | `asyncio.TaskGroup` (3.11) over loose `create_task`, and keep a reference to every task you start. Wrap network calls in `asyncio.timeout` (3.11). No blocking calls inside a coroutine, move them to `asyncio.to_thread`. |
| Subprocess | `subprocess.run([...], check=True, timeout=...)` with an argument list. Never `shell=True` with any external value, never `os.system`. |
| Dangerous functions | No `eval`, `exec`, `pickle`, `marshal`, `shelve` or `yaml.load` without `SafeLoader` on external data. Parameterized SQL with the driver's placeholders, never f-strings in SQL. `secrets` for tokens and `hmac.compare_digest` to compare them. |
| Files and paths | Resolve with `Path.resolve()` and check `is_relative_to` the allowed base directory before reading or writing a path built from input. |
| Logging | `logging.getLogger(__name__)` per module with lazy `%s` arguments. No `print` in library or service code. It stays only for a CLI's real output. |
| Style | PEP 8 and PEP 20, and the project's formatter and linter (Ruff, Black, isort, flake8) with its config. f-strings for formatting. A comprehension when it reads in one line, a loop otherwise. |
| Packaging | `pyproject.toml`, a virtual environment, and the project's lockfile and tool (`uv.lock`, `poetry.lock`, hashed requirements). Never `sudo pip`. Add a package only after checking it on PyPI. |
| Real tests | pytest through public behavior, fixtures over setup methods, `tmp_path` and a real SQLite or test database over mocks. Mock only the network you do not own and the clock. |
| No comments | No docstrings or comments, per the Comments house rule of the **poteto-mode** skill. This outranks PEP 257 and any linter rule that asks for docstrings. When such a rule fails the build, mention it in one sentence instead of writing a docstring. A `# type: ignore[code]` or `# noqa: CODE` with a specific code stays only when the tool is wrong and required. |

Examples: `references/patterns.md`.
