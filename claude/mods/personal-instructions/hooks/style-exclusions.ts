const exclusions = [
  'If something could not be verified, say so first. ',
  'Keep it short by leaving things out, not by packing them in.',
  '- One idea per sentence, about 20 words, with a verb. ',
  '- No em-dashes, no parentheticals, no arrows.',
  '- Keep code out of prose. Name a file, function, or flag only when the reader has to go there, at most one per sentence and two per paragraph. Describe the rest in words. Commands, snippets, and error text go in a fenced code block.',
  '- Keep numbers out of prose. A measurement or count goes in a short table or on its own line, and only if it changes what the reader does.',
  '- Use a bulleted or numbered list for parallel items: findings, steps, options, files to look at. One or two sentences per bullet, never a paragraph. Bold the first few words of a bullet or paragraph, never a whole sentence. A single point or a line of argument stays in prose.',
  '- No headers in a message under about 500 words. Above that, at most three. If the user asks for no formatting, use none.',
  'Offering follow-ups after the task is done is fine; asking permission before doing the work is not.',
  '- Right before each session\'s tool call, in the same message, write a bold title line and one sentence on what it will do; it has started only once the tool result says so. Two or more at once: call `mcp__ccd_session__mark_chapter` first with a short batch title.',
  'say in one line which step you are starting on and which can run at the same time, each in its own session, and ',
  'say so in one line with what is left, and ',
  'say so in one line and ',
  'A skipped step with no session in the list may be running in a cloud session, which never reports back: say so in one line and leave it.',
  ', saying so in a line,',
  'Bold title line and one sentence right before the call; ',
  "they're likely watching it fill — keep them posted in a short line naming what you're on (outline up; now <topic>); ",
  'end with one line + the link, never the document.',
  ' and, in a codebase, says in one line that it can also be set up as files there',
  'Send deliverables as they are produced, not batched at the end of the task: a complete draft or a meaningfully updated version of the thing the user asked for is worth sending mid-task, so they can follow progress and redirect early.',
  'Every request that edits files or runs more than one command gets one (implement-and-test, investigate-then-fix, anything the user listed); only a single-command answer or pure conversation does not.',
  'Call it once in EVERY turn in which you kept a task list, changed files, ran commands, or completed multi-step work: when this turn\'s work is done, before any closing message (it also checks off the task list; no closing update_plan is needed).',
  'Skip it for short answers, pure conversation, or a brief read-and-explain turn — a reply that names a follow-up is not brief: ask or propose it, and call this.'
]

export function excludeStyleInstructions(text: string): string {
  let result = text
  for (const fragment of exclusions) result = result.replaceAll(fragment, '')
  const start = result.indexOf('# Task list and wrap-up (this app)')
  if (start !== -1) {
    const end = result.indexOf('<browsers>', start)
    if (end !== -1) result = result.slice(0, start) + result.slice(end)
  }
  return result
}

export function excludeAgentInstructions(text: string): string {
  const examples = text.indexOf('Example usage:')
  const body = examples === -1 ? text : text.slice(0, examples)
  return body
    .split('\n')
    .filter(line => !line.startsWith('- If the agent description mentions that it should be used proactively,')
      && !line.startsWith('- **Foreground vs background**:'))
    .join('\n')
    .split('\n\n')
    .filter(block => !block.startsWith('Fork yourself (pass `subagent_type: "fork"`) when ')
      && block !== 'Forks are cheap because they share your prompt cache.'
      && block !== '## When to fork')
    .join('\n\n')
}
