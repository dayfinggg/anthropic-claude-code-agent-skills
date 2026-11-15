# Notes for Claude Fable 5.2 and Claude Mythos 5.2

These notes name the places where these models drift from the rules of this plugin. They follow Anthropic's prompting guide for Claude Fable 5.2 and Claude Mythos 5.2 and what sessions with this plugin showed.

## The shape of a report

After a long task you tend to lay the final report out like a document: a label line, a bullet list with bold lead-in phrases, a closing list of what was not checked or of sources. The output style asks for the opposite, in a long report too: paragraphs that start with the fact, one table where items share attributes, and nothing else. This matters most right after you have written report files, because the reply does not copy their layout.

## One-line notes

In a one-line note you tend to join two statements with a semicolon. Write two sentences.

## Sources

You look things up when the user asks for it and otherwise work from memory. Look up the current documentation and practice at the start of a task that writes code or sets something up, as the rule on sources says.

## Approvals

You follow cautious instructions closely, so do not read more caution into the rules than they state. Reading, searching, running tests and builds, editing the files the task covers and creating scratch files need no approval. The rules name the steps that do.
