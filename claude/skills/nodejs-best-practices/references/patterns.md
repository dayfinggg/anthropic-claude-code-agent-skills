# Node.js patterns

Code examples for the rules in `SKILL.md`, written as ES modules for Node 22 or newer. In a CommonJS package, use `require` with the same `node:` specifiers. TypeScript code follows the same patterns with the types from the **typescript-best-practices** skill.

## Config read once at startup

Avoid reading `process.env` deep inside the code, where a missing value surfaces as `undefined` long after startup:

```js
export async function notify(text) {
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, { method: "POST", body: text });
}
```

Parse the environment once, fail fast, and pass the result in:

```js
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function positiveInt(name, fallback) {
  const raw = process.env[name] ?? String(fallback);
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer, got ${raw}`);
  return value;
}

export function loadConfig() {
  return Object.freeze({
    botToken: required("BOT_TOKEN"),
    databaseUrl: required("DATABASE_URL"),
    port: positiveInt("PORT", 3000),
    requestTimeoutMs: positiveInt("REQUEST_TIMEOUT_MS", 10_000),
  });
}
```

Start the process with `node --env-file=.env server.js` instead of adding a dotenv package.

## Outbound calls with a deadline

```js
export async function fetchJson(url, { timeoutMs, signal } = {}) {
  const deadline = AbortSignal.timeout(timeoutMs ?? 10_000);
  const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, deadline]) : deadline });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`, { cause: await response.text() });
  }
  return response.json();
}
```

The result of `response.json()` is untrusted data. Parse it into the domain shape before using it.

## Streams through `pipeline`

Avoid `.pipe()` chains, which leak file handles and swallow errors when one stream fails:

```js
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";

createReadStream("export.csv").pipe(createGzip()).pipe(createWriteStream("export.csv.gz"));
```

Use `pipeline`, which propagates errors, handles backpressure and closes every stream:

```js
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

await pipeline(createReadStream("export.csv"), createGzip(), createWriteStream("export.csv.gz"));
```

## Errors with a cause, handled at the boundary

```js
export class ArticleNotFound extends Error {
  constructor(id, options) {
    super(`Article ${id} not found`, options);
    this.name = "ArticleNotFound";
    this.id = id;
  }
}

export async function loadArticle(db, id) {
  let row;
  try {
    row = await db.get("SELECT id, title FROM articles WHERE id = ?", [id]);
  } catch (err) {
    throw new Error(`Loading article ${id} failed`, { cause: err });
  }
  if (!row) throw new ArticleNotFound(id);
  return row;
}
```

The request handler is the one place that turns errors into responses:

```js
export async function handleGetArticle(request, response, { db, logger }) {
  try {
    const id = Number.parseInt(request.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      response.status(400).json({ error: "Invalid article id" });
      return;
    }
    response.json(await loadArticle(db, id));
  } catch (err) {
    if (err instanceof ArticleNotFound) {
      response.status(404).json({ error: err.message });
      return;
    }
    logger.error({ err, path: request.path }, "article request failed");
    response.status(500).json({ error: "Internal error" });
  }
}
```

## Graceful shutdown

```js
import { createServer } from "node:http";

export function serve({ handler, port, pool, logger }) {
  const server = createServer(handler).listen(port);

  const shutdown = async (signal) => {
    logger.info({ signal }, "shutting down");
    await new Promise((done) => server.close(done));
    await pool.end();
    process.exitCode = 0;
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "unhandled rejection");
    process.exit(1);
  });

  return server;
}
```

## Child processes without a shell

Avoid `exec` with interpolated input, which runs through a shell:

```js
import { exec } from "node:child_process";

exec(`git log --author=${author}`);
```

Use `execFile` with an argument array:

```js
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export async function gitLog(repo, author) {
  const { stdout } = await run("git", ["-C", repo, "log", `--author=${author}`, "--oneline"], { timeout: 30_000 });
  return stdout;
}
```

## Paths inside an allowed base

```js
import { resolve, sep } from "node:path";

const UPLOADS = resolve("/var/app/uploads");

export function uploadPath(name) {
  const candidate = resolve(UPLOADS, name);
  if (!candidate.startsWith(UPLOADS + sep)) throw new Error(`Path escapes the upload directory: ${name}`);
  return candidate;
}
```

## Safe dictionaries from input

Avoid copying parsed JSON into a plain object key by key, which lets a `__proto__` key change the prototype:

```js
export function mergeSettings(target, input) {
  for (const [key, value] of Object.entries(input)) target[key] = value;
  return target;
}
```

Copy only the keys you expect, or keep input-keyed data in a `Map`:

```js
const ALLOWED = new Set(["theme", "language", "timezone"]);

export function mergeSettings(target, input) {
  const next = { ...target };
  for (const [key, value] of Object.entries(input)) {
    if (ALLOWED.has(key) && typeof value === "string") next[key] = value;
  }
  return next;
}
```

## Type tags in checked JavaScript

Only when the project type-checks JavaScript with `checkJs` or `// @ts-check`, a JSDoc block with type tags and no prose is allowed:

```js
/**
 * @param {string} url
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<unknown>}
 */
export async function getJson(url, options = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(options.timeoutMs ?? 10_000) });
  return response.json();
}
```
