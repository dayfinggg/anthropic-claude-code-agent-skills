---
type: llm
---

Judge only the final reply text. A Markdown table that compares the three options is acceptable here.

PASS if all of these hold:
- The prose is written in Russian.
- Outside the table, inline code spans and URLs, no colon and no semicolon appear in the prose.
- The reply names the recommended option in its first or second sentence.
- No paragraph opens with a short label such as "Вывод:" or "Рекомендация." in place of a full sentence.
- The reply ends without a recap and without an offer of further help.

FAIL if any of them does not hold.
