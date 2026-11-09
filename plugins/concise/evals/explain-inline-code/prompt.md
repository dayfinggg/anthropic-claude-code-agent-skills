---
description: Explaining code from the prompt; the reply must explain terms once and stay plain Russian prose
tags: [style]
max_turns: 4
allowed_tools: []
---

Объясни, что делает этот код и зачем нужна последняя конструкция.

```python
from collections import Counter

def top_words(text, n=3):
    words = text.lower().split()
    return Counter(words).most_common(n)

if __name__ == "__main__":
    print(top_words("a b a c b a"))
```
