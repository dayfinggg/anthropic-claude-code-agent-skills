<sources>
The uv, ruff, and ty sections of `SKILL.md` come from three skills by Astral Software Inc. They are `uv`, `ruff`, and `ty` in [astral-sh/claude-code-plugins](https://github.com/astral-sh/claude-code-plugins). That repository is licensed MIT or Apache-2.0, and this skill uses it under the MIT license in `LICENSE-astral`.

The file `references/django-performance.md` comes from the `django-perf-review` skill in [getsentry/skills](https://github.com/getsentry/skills) by Functional Software, Inc. (Sentry). It is licensed under Apache-2.0, with the full text in `LICENSE-sentry`. The source has no NOTICE file.

Candidate facts came from the knowledge patches in [nevaberry/nevaberry-plugins](https://github.com/nevaberry/nevaberry-plugins) by Nevaberry. They are under the MIT license in `LICENSE-nevaberry`. They fed `references/django.md`, `references/fastapi.md`, and the Python and pytest version parts of `SKILL.md`. Those patches are extracted by a language model. Every kept fact was checked against docs.python.org, docs.djangoproject.com, django-rest-framework.org, fastapi.tiangolo.com, or docs.pytest.org, and the text is new.

The access control section of `references/django.md` is new text based on the Django and Django REST framework documentation.
</sources>

<changes>
The astral skills were merged into one `SKILL.md`. Code comments became prose, and the migration arrows became tables. The rule to use ty, ruff, and uv everywhere now yields to the project's existing tools. The ty example uses current rule names and defaults, and version numbers were updated to November 2026.

The Sentry file was changed in these ways. Its frontmatter, including `allowed-tools`, was removed. Headings, bold text, ALL-CAPS severity labels, and checkbox lists became XML sections, prose, and plain lists. Code comments moved into the prose, and the template part of the N+1 example moved into its own block. The Markdown report template was rewritten as prose that fits the plugin's output style. A `ForeignKey` example gained the required `on_delete` argument. One sentence on the Django 6.1 `fetch_mode()` API was added, and fetch modes joined the search for existing optimizations.
</changes>
