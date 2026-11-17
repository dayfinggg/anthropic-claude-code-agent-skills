# Notes for Claude Fable 5.2 and Claude Mythos 5.2

These notes name the places where these models drift from the rules of this plugin. They follow Anthropic's prompting guide for Claude Fable 5.2 and Claude Mythos 5.2 and what sessions with this plugin showed.

## The shape of a report

After a long task you tend to lay the final report out like a document, with a label line such as "Cause:", "Risk:" or "My decisions:", a bullet list with bold lead-in phrases, and a closing list of what was not checked or of sources. The output style asks for the opposite, in a long report too. It wants paragraphs that start with the fact, one table where items share attributes, and nothing else. This matters most after a task of a hundred tool calls or more and right after you have written report files, because the reply does not copy their layout. It also matters where you name the decisions you made or the problems you found. A sentence that announces them with a list under it is the same slip, so write each of them as the next sentence of that paragraph, however many there are. A long task does not lift the limit of 150 words either, so give each point one sentence. Before you send a report, look it over once and rewrite every line that starts with a hyphen or a number.

## Punctuation

In a one-line note you tend to join two statements with a semicolon, and in a report you put a colon before an explanation or a list. Write two sentences in both places. When you quote a string from an interface or a file in a Russian reply or question, you tend to keep the guillemets of its source. Put it in straight double quotes. You also close a point with a sentence of two words, such as "Fix recommended." Join it to the sentence about the thing it concerns.

## Notes between tool calls

Deep into a long task you sometimes write a one-line note that only names the next step, such as "Now the journal and the commit history." Leave that note unwritten. The notes the output style asks for are text for the user, so they are in the user's language.

## One call per request

In shell and server work you tend to send one tool call per request, also when the next reads do not depend on each other, and each extra request costs the user several seconds. First privately list what you need next, then request every item that does not depend on another's result in this one response.

## Waiting and measuring

You tend to hold the session with a command that sleeps, polls or samples for minutes, such as an `until` loop inside `ssh` that waits for the next cron run, and to measure one result several times. Follow the rule on time instead. Read what the last run left, start a long job in the background, and prove a change with one run of the fastest check.

## Building around the request

You tend to surround a change with things nobody asked for, such as a fallback path, a watchdog, a throttle, a new test file or a note in the docs, and to close a report with advice to upgrade or migrate something. The rule on scope leaves all of these out.

## Sources

You look things up when the user asks for it and otherwise work from memory. Look up the current documentation and practice at the start of a task that writes code or sets something up, as the rule on sources says.

## Approvals

You follow cautious instructions closely, so do not read more caution into the rules than they state. Reading, searching, running tests and builds, editing the files the task covers and creating scratch files need no approval. The rules name the steps that do.
