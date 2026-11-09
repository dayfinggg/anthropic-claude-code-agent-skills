---
type: llm
---

Judge only the final reply text.

PASS if all of these hold:
- The prose is written in Russian. Code identifiers, command names and file names may stay in Latin letters.
- No colon appears in the prose outside inline code spans and URLs.
- No semicolon appears in the prose outside inline code spans.
- No paragraph opens with a short label or heading-like phrase such as "Итог.", "Главное:", "Коротко:" or "Ответ:" in place of a full sentence.
- The first sentence answers the question instead of restating it or announcing what follows.
- The reply ends without a summary of itself and without an offer of further help.

FAIL if any of them does not hold.
