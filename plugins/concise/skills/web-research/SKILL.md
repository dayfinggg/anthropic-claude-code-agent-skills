---
name: web-research
description: Method for finding current, primary sources on the web during engineering work, with query patterns, search operators, the order of sources, freshness checks and endpoints for sources that are hard to fetch (X posts through FxTwitter, the HN Algolia API, GitHub, package registries, the Wayback Machine). Use for a research question, a comparison of libraries, services or approaches, an unfamiliar error or stack trace, the latest version or a breaking change of a dependency, a known bug or regression, a recommended practice, and whenever the user asks to search, look online, read the docs or check what other developers report.
---

# Web research

This skill covers how to search so that an answer rests on current, primary sources. It matches the WebSearch and WebFetch tools of Claude Code 2.1.326 and the public endpoints below as checked on 2026-11-19. WebSearch finds pages and WebFetch reads one page through a summarizing model, so use `curl` or `gh` when you need the exact text.

## Plan before the first query

- Decide what a complete answer must contain, such as the version, the platform, the date range and the decision it feeds. Stop when the sources support each claim the decision rests on or when you can name the evidence that is missing, not when a number of queries is reached.
- Send three to six searches in one response, each from another side of the question, such as the official docs, the release notes or changelog, the issue tracker, reports from other users and a standard.
- Start short and broad, read what comes back, then narrow with the exact terms the good results use. When a pass does not settle a claim, change what the query can find, such as the component's name for the symptom, a synonym or the upstream tracker, rather than repeating a near-identical query.
- Put the product name and the exact version into a query about anything that changes. For current practice without a known version, run one query with the current year and one without it, because older docs that still hold do not carry the year.
- Leave your own paths, ids, hostnames, project names and secrets out of every query.
- In WebSearch, `allowed_domains` and `blocked_domains` filter more reliably than a `site:` operator, and `mode: "extended"` fits niche, very recent or hard-to-find facts once a standard search came back thin.

## Operators

Quotes for an exact phrase, `site:`, a leading minus and `OR` work on Google, Bing and Brave, and `filetype:` on all three. `before:` and `after:` are documented only by Google, `intitle:` by Bing, Brave and DuckDuckGo, and `inurl:` only by DuckDuckGo, which treats a minus as a hint rather than a filter. When an operator returns nothing useful, drop it, and never read an empty `site:` search as proof that a page does not exist.

## Query patterns

| Question | Queries to send together |
| --- | --- |
| An error message | `<library> <major.minor> "<stable part of the message>"`, the same limited to the project's repository, and the error code alone |
| The current version | the registry metadata (see the order of sources), then the release notes of that version |
| A breaking change | `<library> <new major> migration guide`, `<library> changelog <new>`, and a compare of the two release tags |
| A config option | `"<option.name>" <tool> <major.minor>` on the docs host, then the option's default and accepted values in the source |
| A recommended practice | `<product> <major> <task> recommended <year>`, the same without the year, and the vendor's guidance page |
| A known bug | `repo:<owner>/<repo> is:issue "<symptom>" in:title,body` sorted by recent updates, open and closed |
| A comparison | each candidate's docs and limits pages, then experience reports that name the versions they ran |

## Order of sources

1. Documentation that ships with the installed package, such as `node_modules/<pkg>/README.md`, its `docs/` folder or `CHANGELOG.md`, `vendor/<pkg>` or the package in `site-packages`. It matches the pinned version exactly.
2. The official documentation for that version. Try `/llms.txt` or `/docs/llms.txt` as an index and the `.md` form of a page, and prefer versioned URLs over "latest". The `.md` form is a reading format and does not make a page authoritative or current.
3. Release notes, changelogs, migration guides and release tags. `gh api repos/<owner>/<repo>/releases/latest` skips drafts and prereleases, and a tag on GitHub does not prove the version reached the package registry.
4. The issue tracker. Read the maintainer's conclusion and the linked pull request, and check that the fix shipped in a released version, not only that the issue closed.
5. Package registries for what was published and when. npm has `dist-tags.latest` and `time[<version>]` at `https://registry.npmjs.org/<pkg>`, where `latest` is a tag and not always the highest number. PyPI has prerelease, yanked and `requires_python` data at `https://pypi.org/pypi/<pkg>/json`. crates.io has `yanked` and `rust_version` in the index at `https://index.crates.io/`. Packagist serves tagged releases at `https://repo.packagist.org/p2/<vendor>/<pkg>.json` and branches at `~dev.json`.
6. Standards from the issuing body, with the exact section, its status, updates and errata. A W3C draft is not a Recommendation.
7. Vendor status pages and incident APIs for outages, matched to the component, region and UTC time window.
8. Experience reports on Hacker News, X, Reddit and Stack Overflow, for problems and limits the docs leave out. Each one is a lead until a second source or a reproduction backs it.
9. Blogs and tutorials last. Skip a templated page with no original evidence, copied examples or citations that only lead to other summaries.

## Sources that are hard to fetch

- An X post reads through `https://api.fxtwitter.com/2/status/<id>`, which returns the text, author and date as JSON. It is a mirror, so cite the post's own `x.com` link and check the returned id and author. Find post ids with a search limited to `x.com`.
- Hacker News searches by relevance at `https://hn.algolia.com/api/v1/search?query=<query>&tags=story`, newest first at `/api/v1/search_by_date?query=<query>`, and gives a whole comment tree at `/api/v1/items/<id>`.
- Reddit blocks anonymous reading. Its JSON endpoints answer 403, pages answer with a bot check, and WebFetch refuses the domain. Treat a Reddit result from a search as a lead, look for a snapshot through the Wayback Machine, and name a thread you could not open as unread.
- GitHub reads best through `gh`, such as `gh search issues`, `gh issue view <n> --comments` and `gh api`, and raw files come from `raw.githubusercontent.com`.
- A page that moved or vanished often has a snapshot. `https://archive.org/wayback/available?url=<url>&timestamp=<YYYYMMDD>` returns the closest one. Cite it as the page at that date, not as the current state.

## Reading and judging a page

- Open every page you rely on and read the passage that supports the claim. A search snippet and WebFetch's summary can drop or change the detail you need, so ask WebFetch for the exact passage, version and date, or read the raw page with `curl -sL`, when the wording, a number or a code sample matters.
- Find the page's published or updated date and the version it describes. A matching version beats a newer byline, and a date in the search result or the page footer may only date a template change.
- One primary record settles a fact it owns, such as the version a registry published. A claim about behavior or a recommendation needs two independent lines of evidence, and a third or a qualifier when they disagree. A mirror or a blog that repeats the same release note is not independent.
- Look for a counterexample or a reversal, such as a later issue, a revert or a migration note, before you call a claim settled.
- Say which part you could not confirm and where you looked.

## Reporting

- Answer the question first, then give what the sources add, such as limits, known bugs and the version they apply to.
- Cite each source as a link right after the claim it supports, with the date for anything that changes over time. Keep what a source says apart from what you infer from it.

## Gotchas

- A summary of search results is not research. When the user asked for sources, every claim in the answer needs a page you opened.
- Two or three results from one query rarely cover a question. Coverage comes from several queries that come at it from different sides.
- Results rank pages that use the words of the query, so a query in the user's phrasing finds pages written for users, and a query in the vocabulary of the docs or the error message finds the primary sources.
- A closed issue, a merged pull request and a GitHub release can each exist before the fix is in the version the project installs.

Related skills: concise:debugging for an error you are diagnosing, concise:agent-docs for Claude Code's own documentation and changelog.
