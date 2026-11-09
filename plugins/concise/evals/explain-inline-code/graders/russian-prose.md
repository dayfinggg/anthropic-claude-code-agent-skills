---
type: llm
---

Judge only the final reply text.

PASS if all of these hold:
- The prose is written in Russian. Code identifiers may stay in Latin letters.
- No colon or semicolon appears in the prose outside inline code spans and URLs.
- Each technical term the reply introduces, such as "Counter" or the `__name__` check, is explained in plain words the first time it appears.
- No paragraph opens with a short label such as "Итог." or "Что делает код:" in place of a full sentence.
- The reply ends without a recap and without an offer of further help.

FAIL if any of them does not hold.
