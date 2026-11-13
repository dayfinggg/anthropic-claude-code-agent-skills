## Before building

- Name the subject, the audience and the page's primary job, and confirm them when the brief leaves them open. Distinctive choices come from the subject's own world, its materials and vocabulary. Build with real content.
- Write a short plan first: four to six named hex colors, the typefaces and their roles, a layout concept with alignment, and the principles that make this page specific. Compare each choice with what you would produce for any similar prompt, and replace the ones that match.
- The brief's explicit visual direction wins, including when it asks for a look listed below.

## Defaults that read as generated

- A warm cream background (near `#F4F1EA`) with a high-contrast serif display face and a terracotta accent (near `#D97757`).
- A near-black background with a single acid-green or vermilion accent.
- A broadsheet layout with hairline rules, zero border radius and dense newspaper columns.
- The SaaS card kit: content cut into identical rounded cards, one radius on everything, the same soft `rgba(0,0,0,.1)` shadow under each, and gradient washes as decoration.
- Template chrome: a tracked all-caps eyebrow above every heading, metadata joined with middle dots, labels built as a word plus a spaced dash plus a fragment, tinted near-black (`#0B0B0B`, `#111`) instead of black, monospace for small data labels, and an arrow appended to link and button text.
- A hero built as a big number, a small label, supporting stats and a gradient accent.
- Accenting one word of a headline in italic, bold or color, all-caps labels, and labels above content that needs none.
- Numbered markers (01, 02, 03) on content that is not a sequence.
- A fade-and-slide entrance on every section and a hover transition on every card.

## Choices that hold up

- Use one or two typefaces chosen for this subject, with a deliberate scale, weights and spacing. Keep body lines under about 80 characters, and give serif body text a little more line height.
- Let structure carry information: borders, numbering, dividers and labels appear only where they encode something about the content.
- Spend boldness on one element and keep the rest quiet. Remove one decoration before calling it done.
- Use motion for one orchestrated moment or to answer a user action (open, expand, confirm). Respect `prefers-reduced-motion`.
- Layer shadows (ambient plus direct light) rather than one flat shadow, and keep nested radii concentric, with the child radius no larger than the parent's.
- Use `tabular-nums` for numbers that are compared, and `text-wrap: balance` on headings.
- Take screenshots and critique the result when the environment allows it. Capture the viewport or one element, not a full long page. Claude downscales images past 2,576 px on the long edge, and once a conversation holds more than 20 images, one over 3,000 px on either edge can fail every later request.

## Copy

- Name things the way users think of them ("notifications", not "webhook config"), in plain words rather than sales language.
- A button says what happens ("Save changes", not "Submit"), and the action keeps its name through the flow: "Publish" leads to a "Published" message.
- Error messages state what happened and how to fix it, without apologizing. Empty states invite the next action.
- Use sentence case, active voice and plain verbs, and give each piece of text one job.
