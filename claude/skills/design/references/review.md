# Review and verification

## Look at the rendered result

Render the interface and inspect it at a narrow phone width, an intermediate tablet width, and a wide desktop width, plus the widths just before layout changes, and inspect each supported theme. Batch the checks for one render and fix what one look reveals before looking again, because source code shows intent and not outcome, and repeated renders without fixes repeat the same findings.

<example>
Render `390`, `768`, and `1440` pixels in light and dark as one batch, then fix the overflow found at `390` before rendering again.
</example>

Run the bundled inspection script on a URL or an HTML file when Playwright is available. Replace `<skill-dir>` in the commands below with this skill's base directory, which is shown when the skill loads, because this reference file is read as plain text and a shell would treat a placeholder variable as empty. Run the commands in the host's own shell, such as PowerShell on a Windows host, and use `python3` where `python` is not on the path. Keep the working directory in the user's project when Playwright is installed there or globally. The Node runner uses the Playwright package installed in the current project or globally, and the Python runner needs the Python Playwright package. Both share the same measurements. The runners load `collect.js`, `focus.js`, and `settle.js` from the same folder as page fragments, so run only the two `inspect_page` entry points.

<example>
For a built page, run the Node runner from the project folder on `dist/index.html`.
</example>

```text
node "<skill-dir>/scripts/inspect_page.mjs" <url-or-file> --out <dir> --widths 390,768,1440 --schemes light,dark
```

```text
python "<skill-dir>/scripts/inspect_page.py" <url-or-file> --out <dir> --widths 390,768,1440 --schemes light,dark
```

Write the output to the session scratchpad or the system temp folder, not into the project, and delete it after reading the screenshots unless the user wants to keep them, because inspection output is a by-product that would otherwise stay on the user's machine.

<example>
For a built page, run the Node runner on `dist/index.html` with `--out` pointing at the scratchpad folder, read the screenshots, then delete that folder.
</example>

When Playwright is not installed in the project or globally, install it in a temporary folder outside the project, run the Node runner from that folder with the page given by an absolute path, and delete the folder afterwards, because the project's dependencies stay untouched and a side check leaves nothing behind. A fresh install also needs a matching Chromium build, which `npx playwright install chromium` fetches when it is not cached.

<example>
In a new folder under the system temp folder, `npm install playwright` and `npx playwright install chromium` are followed by the runner on `C:/work/acme-site/dist/index.html`, and the whole folder is deleted once the screenshots are read.
</example>

Treat the script's findings as leads. It saves full-page screenshots and `report.json` with text contrast failures, horizontal overflow and its offenders, pointer targets below `24px`, a keyboard focus walk, font families, the count of font sizes and radii, and markers such as tracked uppercase labels, gradient text, thick left borders, `transition: all`, and missing reduced-motion rules. Contrast over images or gradients is marked uncertain, small targets may meet a spacing exception, and a clean report does not prove good design. Full-page screenshots can cut sticky or viewport-height panels at the window height, so confirm such cuts by scrolling before calling them layout bugs. Read the screenshots yourself, because the script measures defects and cannot judge hierarchy or fit.

<example>
A report with zero contrast failures still gets its hero screenshot read, and a clipped sticky header in the full-page image is confirmed by scrolling before it is logged as a bug.
</example>

Add `--state "name=selector && selector"` once per state when a state beyond the first load needs measuring, because validation errors, open menus, and dialogs never appear in a first-load render. By default the script inspects the page as it first loads, and each `--state` reloads the page, clicks each selector in order, and measures that state too. A state whose control is hidden at some width reports a click error for that width, so add the step that reveals it. Use the project's browser automation for states that need typing or network failures. Each run also saves a viewport screenshot, which shows fixed and sticky elements where users see them.

<example>
`--state "errors=button[type=submit]"` reloads the form, clicks submit, and measures the validation state, and at `390` pixels a hidden menu needs `--state "nav=button[aria-label=Menu] && a[href='/pricing']"`.
</example>

When no browser automation is available and Playwright cannot be installed, say so and describe what remains unverified rather than reporting success, because an unrendered result may still be broken.

<example>
The reply says `Not rendered, Playwright could not be installed here, so overflow and contrast are unchecked`.
</example>

## Check the design against its intent

Walk these checks against the rendered result before reporting, and fix the failures that block the user's task first, because a polished surface that hides its primary action still fails.

<example>
A pricing page with a refined palette but a `Start trial` button below the fold gets the button moved up before any color tuning.
</example>

- The squint test shows the intended primary element, secondary element, and groups in order.
- The primary action and the information the brief requires are findable within seconds.
- Edges align, spacing follows the scale, and tight and generous intervals form a rhythm.
- Type roles are few and distinct, the body measure is readable, and the face renders in the product's script.
- Color roles keep one meaning, the accent has one job, and contrast passes in every theme.
- Every state from the states list is reachable and designed, including empty, loading, error, and long content.
- Keyboard focus is visible on every control in a logical order, and enlarged text and `200%` zoom keep content usable.
- Motion has a job, does not block input, and has a reduced-motion variant.
- Nothing from the generic defaults list appears without a reason tied to this subject.
- Copy is specific, consistent, and free of invented facts.

Before finishing, remove each decoration you added that the brief does not call for, because decoration added to fill space is the commonest leftover of generated work, and leave the product's existing styling as it is unless the task is a redesign.

<example>
A gradient wash that the new pricing table added is deleted because the brief does not ask for it, while the existing card shadows stay.
</example>

## Critique without editing

When the user asks for a review or critique, inspect the actual interface first and leave the files unchanged, because the user asked for judgment and not for edits. Report findings in prose, one paragraph per finding in order of impact on the user's task, each with evidence such as a screenshot region, selector, or measured value, the principle it violates, and a concrete fix. Separate defects such as failing contrast, missing states, or broken layout from taste such as palette or typeface, and do not invent numeric scores, because usability heuristics are rules of thumb. Confirm serious findings with real use when possible.

<example>
The first paragraph says the `.btn-secondary` text is 2.8:1 on `#F2F2F2`, fails 4.5:1, and should use `#595959`, and a closing paragraph lists the palette preference separately as taste.
</example>

## Report honestly

State in one clause which widths and themes were inspected, and spend the rest of the report on what was not verified, such as real devices, screen readers, or production data, and on invented content and integrations that are not connected, because the reader decides what to trust from the gaps.

<example>
`Checked 390, 768, 1440 in light and dark with the script. Not checked, real phones and screen readers. Prices and the contact email are placeholders.`
</example>
