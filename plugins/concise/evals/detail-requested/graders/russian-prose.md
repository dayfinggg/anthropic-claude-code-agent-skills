---
type: llm
---

Judge only the final reply text. The user asked for detail, so a long reply is acceptable.

PASS if all of these hold:
- The prose is written in Russian. Parameter names and code may stay in Latin letters.
- No colon or semicolon appears in the prose outside inline code spans and URLs.
- Each technical term is explained in plain words the first time it appears.
- No paragraph opens with a short label such as "Что кэшируется:" in place of a full sentence.
- The reply ends without a recap and without an offer of further help.

FAIL if any of them does not hold.
