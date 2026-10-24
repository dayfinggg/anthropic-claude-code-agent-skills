import type { ApiContentBlock } from 'claude-code'

const REQUEST_EXCERPT_LENGTH = 160
const UNDONE_WORK_REQUEST = /,? including what is not done or not verified(?: \(for example: [^)]*\))?/g
const STATUS_LINE_REQUEST = /they['’]re likely watching it fill[^)]*\);\s*/g
const SOURCES_REMINDER = /\n*REMINDER: You MUST include the sources above[^\n]*/g
const SESSION_BRIEF_BACKGROUND = /^Background \(from the session that started this one\):[\s\S]*?\r?\n\r?\nTask:\r?\n/
const SESSION_BRIEF_NOTES = /\r?\n\r?\nShared notes folder for this group of sessions[\s\S]*$/

export const EMPTY_REPLY_NUDGE = '[Your previous response had no visible output'

export const nonEmptyLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

const fill = (line: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(value), line)

const hasEmptySlot = (line: string, values: Record<string, string>) =>
  Object.entries(values).some(([key, value]) => !value && line.includes(`{${key}}`))

export const fillLines = (template: string, values: Record<string, string>) =>
  nonEmptyLines(template)
    .filter(line => !hasEmptySlot(line, values))
    .map(line => fill(line, values))
    .join('\n')

const typedTextOf = (text: string) =>
  text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<([A-Za-z][\w-]*)\b[^>]*>[\s\S]*?<\/\1\b[^>]*>/g, ' ')
    .split(/\r?\n/)
    .filter(line => !line.trimStart().startsWith('>'))
    .join('\n')

const taskOf = (text: string) =>
  SESSION_BRIEF_BACKGROUND.test(text) ? text.replace(SESSION_BRIEF_BACKGROUND, '').replace(SESSION_BRIEF_NOTES, '') : text

export const excerptOf = (text: string) =>
  typedTextOf(taskOf(text))
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, REQUEST_EXCERPT_LENGTH)

export const withoutUndoneWorkRequest = (text: string) => text.replace(UNDONE_WORK_REQUEST, '')

export const withoutStatusLineRequest = (text: string) => text.replace(STATUS_LINE_REQUEST, '')

const withoutSourcesLine = (text: string) => text.replace(SOURCES_REMINDER, '').trimEnd()

const isTextPart = (part: unknown): part is { type: 'text'; text: string } =>
  typeof part === 'object' && part !== null && 'type' in part && part.type === 'text' && 'text' in part && typeof part.text === 'string'

export const withoutSourcesReminder = (block: ApiContentBlock): ApiContentBlock => {
  if (block.type !== 'tool_result') return block
  const { content } = block
  if (typeof content === 'string') return { ...block, content: withoutSourcesLine(content) }
  if (!Array.isArray(content)) return block
  return { ...block, content: content.map(part => (isTextPart(part) ? { ...part, text: withoutSourcesLine(part.text) } : part)) }
}
