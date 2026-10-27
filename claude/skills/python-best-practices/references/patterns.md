# Python patterns

Code examples for the rules in `SKILL.md`. The principles behind them are language-agnostic, see the **type-system-discipline** principle skill. The examples target Python 3.12 or newer unless a section says otherwise.

## Tagged unions with exhaustive `match`

Avoid a class whose optional fields can contradict each other:

```python
from dataclasses import dataclass


@dataclass
class FetchState:
    loading: bool
    body: str | None = None
    error: str | None = None
```

Give each state its own type. `assert_never` makes the checker fail when a new variant is added and one `match` forgets it.

```python
from dataclasses import dataclass
from typing import assert_never


@dataclass(frozen=True, slots=True)
class Loading:
    pass


@dataclass(frozen=True, slots=True)
class Ready:
    body: str


@dataclass(frozen=True, slots=True)
class Failed:
    error: str


type FetchState = Loading | Ready | Failed


def describe(state: FetchState) -> str:
    match state:
        case Loading():
            return "loading"
        case Ready(body=body):
            return f"{len(body)} bytes"
        case Failed(error=error):
            return f"failed: {error}"
        case _:
            assert_never(state)
```

On targets before 3.12, write the alias as `FetchState = Loading | Ready | Failed` or `FetchState: TypeAlias = ...`.

## Branded primitives with `NewType`

Two ids that are both `int` must not be interchangeable. A parse function is the only place that creates them.

```python
from typing import NewType

ChatId = NewType("ChatId", int)
TaskId = NewType("TaskId", int)


def parse_chat_id(raw: str) -> ChatId:
    value = int(raw)
    if value == 0:
        raise ValueError(f"Invalid chat id: {raw!r}")
    return ChatId(value)


def link_chat(chat: ChatId, task: TaskId) -> None:
    pass
```

Calling `link_chat(task_id, chat_id)` with swapped arguments now fails type checking.

## Parse at the boundary

Raw JSON is `object` until parsed. Describe its expected shape with `TypedDict` if it helps, but convert it into the domain type in one function and pass only the domain type onward.

```python
import json
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class Article:
    id: int
    title: str
    published_at: datetime


def parse_article(raw: object) -> Article:
    if not isinstance(raw, dict):
        raise ValueError("Article must be a JSON object")
    article_id = raw.get("id")
    title = raw.get("title")
    published_at = raw.get("published_at")
    if not isinstance(article_id, int) or article_id <= 0:
        raise ValueError(f"Invalid article id: {article_id!r}")
    if not isinstance(title, str) or not title.strip():
        raise ValueError("Article title is required")
    if not isinstance(published_at, str):
        raise ValueError("published_at must be an ISO 8601 string")
    return Article(article_id, title.strip(), datetime.fromisoformat(published_at))


article = parse_article(json.loads('{"id": 1, "title": "News", "published_at": "2026-10-27T12:45:00+02:00"}'))
```

When the project uses Pydantic or another schema library, define the model there and call its validation instead of writing the checks by hand.

## Settings read once

```python
import os
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Settings:
    bot_token: str
    database_url: str
    request_timeout: float


def load_settings() -> Settings:
    missing = [name for name in ("BOT_TOKEN", "DATABASE_URL") if not os.environ.get(name)]
    if missing:
        raise RuntimeError(f"Missing environment variables: {', '.join(missing)}")
    return Settings(
        bot_token=os.environ["BOT_TOKEN"],
        database_url=os.environ["DATABASE_URL"],
        request_timeout=float(os.environ.get("REQUEST_TIMEOUT", "10")),
    )
```

Call `load_settings()` once at startup and pass the object to whatever needs it.

## Errors with context

Avoid swallowing or flattening the cause:

```python
def load_config(path: str) -> dict[str, object]:
    try:
        with open(path) as handle:
            return json.load(handle)
    except Exception:
        return {}
```

Raise a specific error and keep the original as its cause:

```python
import json
from pathlib import Path


class ConfigError(Exception):
    pass


def load_config(path: Path) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as err:
        raise ConfigError(f"Config file not found: {path}") from err
    except json.JSONDecodeError as err:
        raise ConfigError(f"Config file is not valid JSON: {path}") from err
```

## Async with a task group and timeouts

```python
import asyncio

import httpx


async def fetch_all(client: httpx.AsyncClient, urls: list[str]) -> list[str]:
    async with asyncio.TaskGroup() as group:
        tasks = [group.create_task(fetch_one(client, url)) for url in urls]
    return [task.result() for task in tasks]


async def fetch_one(client: httpx.AsyncClient, url: str) -> str:
    async with asyncio.timeout(10):
        response = await client.get(url)
        response.raise_for_status()
        return response.text
```

If one request fails, the task group cancels the others and raises an `ExceptionGroup`. Use `except*` at the boundary to handle it.

## Subprocess and SQL without injection

```python
import sqlite3
import subprocess
from pathlib import Path


def git_log(repo: Path, author: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(repo), "log", f"--author={author}", "--oneline"],
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    )
    return result.stdout


def find_user(db: sqlite3.Connection, email: str) -> tuple[int, str] | None:
    return db.execute("SELECT id, email FROM users WHERE email = ?", (email,)).fetchone()
```

## Paths inside an allowed base

```python
from pathlib import Path

UPLOADS = Path("/var/app/uploads").resolve()


def upload_path(name: str) -> Path:
    candidate = (UPLOADS / name).resolve()
    if not candidate.is_relative_to(UPLOADS):
        raise ValueError(f"Path escapes the upload directory: {name!r}")
    return candidate
```
