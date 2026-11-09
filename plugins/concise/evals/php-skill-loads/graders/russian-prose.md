---
type: llm
---

Judge only the final reply text.

PASS if all of these hold:
- The prose is written in Russian. Code identifiers may stay in Latin letters.
- It names at least two concrete problems in the file, such as the loose comparison with `==`, the missing type declarations, or the unescaped use of `$_GET`.
- No colon or semicolon appears in the prose outside inline code spans.
- It uses no headings, bullets or bold, and no paragraph opens with a short label in place of a sentence.

FAIL if any of them does not hold.
