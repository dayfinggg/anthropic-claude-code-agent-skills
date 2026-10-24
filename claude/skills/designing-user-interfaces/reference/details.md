# Component, motion, security, and style details

## Components and states

- Interactive components have default, hover, focus, pressed, disabled, and loading states. Add selected or error where relevant.
- Destructive actions look distinct and sit apart. Prefer undo to a confirmation dialog for reversible actions.
- Web targets are at least 24 by 24 CSS pixels, and 44 is better for touch.
- Design for edge cases such as very long names, one item, thousands of items, and offline.
- Waits over about one second get a skeleton or progress bar that causes no layout jump.
- Use the accent color only for interactive and important elements.
- A control border needs 3:1 contrast only when nothing else shows the control.
- Tune dark mode instead of inverting the light palette.
- Content reflows at 320 CSS pixels wide.

## Forms

- When most fields are required, mark the optional ones.
- Do not validate per keystroke.

## Motion

- Motion explains change in about 150 to 300 milliseconds and never blocks input.
- Under reduced motion, motion becomes a fade or nothing.
- Spend motion on one orchestrated moment, such as the page load.
- Do not animate every section or card.

## Untrusted content

- Avoid `innerHTML`, `outerHTML`, `document.write`, `v-html`, and raw template output.
- If user HTML must render, sanitize it with DOMPurify first.
- Use `dangerouslySetInnerHTML` only on sanitized data.
- Links and image sources from user data allow only `https` and `http`.
- Stay compatible with a strict CSP, with no inline scripts or handlers.
- Trusted Types guards DOM sinks.

## Avoiding a generic look

Avoid these defaults of generated UI unless the brand asks for them.

- Cream or beige backgrounds, and a default near-black page.
- Italic accent words in headlines and numbered "01 02 03" section labels.
- A tracked all-caps eyebrow above every heading, and an arrow appended to link text.
- Monospace labels for ordinary text, and pill-shaped buttons everywhere.
- Identical rounded cards with the same soft shadow.
- Decorative gradient washes and gratuitous glassmorphism.
