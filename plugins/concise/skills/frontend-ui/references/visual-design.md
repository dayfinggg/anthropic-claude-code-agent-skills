# Visual design without the default look

## Contents

- How to use this list
- Patterns to avoid and what to do instead
- Before building
- shadcn/ui without the stock look
- Choices that hold up
- Copy
- Checking the result

## How to use this list

- Without design direction a model falls back on a few default looks, and a general instruction such as "avoid a generic AI look" only swaps one default for another. Naming the specific patterns works. Anthropic's own example: "Do not use a cream or off-white background, italic accent words in headlines, numbered 01/02/03 section labels, monospace labels, or pill-shaped buttons."
- Treat every pattern below as off unless the brief or the project's existing design asks for it. The brief's explicit direction and the project's design system win over this list.
- After the first render, name what the page used instead of the banned patterns. If that is another stock choice, add it to the list for this task and revise.

## Patterns to avoid and what to do instead

| Avoid | Do instead |
|---|---|
| Cream or off-white page background (near `#F4F1EA`, `#FAF7F2`) | Take the background from the subject: a clean white or a true dark surface, or a saturated brand field for one section. Decide it in the color plan, not by habit. |
| Italic, bold or colored accent word inside a headline | Write the headline so it needs no highlight. Carry emphasis with size, weight or placement of the whole line. |
| Numbered section labels (01, 02, 03) on content that is not a sequence | Number only real steps of a process. Elsewhere let the section heading stand alone. |
| Monospace for small labels, metadata or numbers | Use the text face with `font-variant-numeric: tabular-nums` (Tailwind `tabular-nums`). Keep monospace for code. |
| Pill-shaped buttons (`rounded-full`) everywhere | Pick one corner radius from the type and grid, often small, and apply it to buttons, inputs and cards alike. |
| Tracked all-caps eyebrow above every heading | Drop the eyebrow. Use a label only where it encodes something the heading does not. |
| Warm serif display face with a terracotta accent (near `#D97757`) | Choose the typeface for the subject and audience, and test it against the second most likely choice. |
| Near-black page with one acid-green or vermilion accent | If the page is dark, build a full dark palette with several related surfaces and a measured accent. |
| Purple-to-blue gradient on white, gradient text in headlines | Solid colors from the palette. Use a gradient only where it depicts something, such as light or depth in an image. |
| Identical rounded cards in a 3-column grid with an icon, title and two lines each | Vary the layout by content weight: a list, a table, one large item with smaller ones, or plain prose with headings. |
| Hero made of a huge number, a small label and a row of stats | Lead with what the visitor came for: the product, the answer or the action. Put numbers where they support a claim. |
| One soft shadow (`shadow-sm`, `rgba(0,0,0,.1)`) under every element | Separate with space and alignment first. Use elevation only for things that float (menus, dialogs), with a layered shadow. |
| Broadsheet look: hairline rules, zero radius, dense newspaper columns | Use rules only between real groups, and size columns to the content's line length. |
| Metadata joined with middle dots, labels like "Word - fragment", an arrow appended to every link | Plain sentences or a definition list for metadata. Links say where they go without decoration. |
| Fade-and-slide entrance on every section, hover lift on every card | One purposeful motion, such as the response to a user action. Respect `prefers-reduced-motion`. |
| Default fonts (Inter, Roboto, Arial, system UI) and their usual swap (Space Grotesk) | A typeface chosen for this subject, or the project's brand font, set with a deliberate scale. |
| Emoji as section icons | One icon set from the project (`lucide-react` in a default shadcn setup), or no icons. |

## Before building

- Name the subject, the audience and the page's primary job, and confirm them when the brief leaves them open. Distinctive choices come from the subject's own world, its materials and vocabulary. Build with real content, not lorem ipsum.
- Write a short plan first: four to six named colors with hex or `oklch` values, the typefaces and their roles, a layout idea with its alignment grid, and the two or three principles that make this page specific. Compare each choice with what you would produce for any similar prompt, and replace the ones that match.

## shadcn/ui without the stock look

- The stock shadcn/ui look is itself a default: neutral or zinc base color, rounded cards with a border and a small shadow, the template's sans font. Change the theme tokens in `globals.css` (`--radius`, `--primary`, `--background`, `--font-sans`) instead of overriding classes component by component. `tailwind.baseColor` in `components.json` is fixed after `init`, and `npx shadcn@latest migrate base-color` changes it later.
- A `Card` is for a group that must read as one object. Most content needs headings, spacing and alignment, not a card.
- Keep the component variants and semantic tokens (`bg-primary`, `text-muted-foreground`) so the design stays consistent and dark mode keeps working.

## Choices that hold up

- One or two typefaces with a deliberate scale, weights and spacing. Body lines under about 80 characters (`max-w-[60ch]`), unitless line height around 1.5, and a little more for serif body text. `text-wrap: balance` on headings.
- Color from a small token set in `oklch`, with contrast checked for every text and control pair in both themes.
- Structure carries information: borders, numbering, dividers and labels appear only where they encode something about the content.
- Spend boldness on one element per view and keep the rest quiet. Remove one decoration before calling it done.
- Layer shadows (ambient plus direct light) where something floats, and keep nested radii concentric, with the inner radius equal to the outer radius minus the padding.
- `tabular-nums` for numbers that are compared, and `font-size` in `rem`, never `px`.

## Copy

- Name things the way users think of them ("notifications", not "webhook config"), in plain words rather than sales language.
- A button says what happens ("Save changes", not "Submit"), and the action keeps its name through the flow: "Publish" leads to a "Published" message.
- Error messages state what happened and how to fix it, without apologizing. Empty states invite the next action.
- Use sentence case, active voice and plain verbs, and give each piece of text one job.

## Checking the result

- Take screenshots and critique them against the list above when the environment allows it. Capture the viewport or one element, not a full long page: Claude downscales images past 2,576 px on the long edge, and once a request holds more than 20 images a stricter size limit applies to every image in it.
- Check light and dark themes, a 320 px wide viewport, 200% zoom and keyboard focus in the same pass.
