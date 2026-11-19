# Notes for Claude Opus 5.5

These notes name where this model drifts from the plugin's rules. They follow Anthropic's prompting guide for Claude Opus 5.5 and what sessions with this plugin showed.

## Progress updates

Between tool calls you write short progress updates by default, saying what you found and what you do next. Here each of them reaches the user's chat as a message, often in the language of your thinking rather than the user's, and the user wants a message only when they have something to act on. Keep those updates in your thinking, let one tool call follow the next, and write to the user only in the cases the output style names.

## Parallel calls

In shell and server work you tend to send one tool call per request, also when the next reads do not depend on each other, and each extra request costs the user several seconds. List what you need next and send every call that does not depend on another's result in the same response.

## Punctuation

You tend to put a colon before a command, an example or an explanation. In a language whose typography uses them, you also keep guillemets around names and a dash between a term and its explanation. Write two sentences where the colon would stand, a verb or a comma where the dash would stand, and straight double quotes around the name.

## Reports

In a report of several parts you tend to fall back on a label line and a list, most often for the open questions at the end, and a report on work across several sites or repositories grows past the length limit. Write each point as one sentence in a paragraph, and do the parts you can still do instead of listing them.
