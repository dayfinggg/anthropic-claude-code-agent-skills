export type StyleReminderState = {
  promptId: string
  count: number
  lastBatchId: string
  sentAt: number[]
  noteAt: number[]
}

export const firstReminderAt = 5
export const reminderInterval = 10
export const noteLimit = 2
export const noteGap = 3

const empty = (promptId = ''): StyleReminderState => ({ promptId, count: 0, lastBatchId: '', sentAt: [], noteAt: [] })

const counts = (value: unknown): number[] => Array.isArray(value)
  ? [...new Set(value.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0))]
  : []

export const readStyleReminderState = (value: unknown): StyleReminderState => {
  if (value === null || typeof value !== 'object') return empty()
  const state = value as { promptId?: unknown; count?: unknown; lastBatchId?: unknown; sentAt?: unknown; noteAt?: unknown }
  return {
    promptId: typeof state.promptId === 'string' ? state.promptId : '',
    count: typeof state.count === 'number' && Number.isInteger(state.count) && state.count >= 0 ? state.count : 0,
    lastBatchId: typeof state.lastBatchId === 'string' ? state.lastBatchId : '',
    sentAt: counts(state.sentAt),
    noteAt: counts(state.noteAt)
  }
}

export const recordToolBatch = (state: StyleReminderState, promptId: string, batchId: string): StyleReminderState => {
  const current = state.promptId === promptId ? state : empty(promptId)
  if (current.lastBatchId === batchId) return current
  return { ...current, count: current.count + 1, lastBatchId: batchId }
}

export const reminderDue = (state: StyleReminderState): number | undefined => {
  const { count } = state
  const due = count === firstReminderAt || (count > firstReminderAt && (count - firstReminderAt) % reminderInterval === 0)
  return due && !state.sentAt.includes(count) ? count : undefined
}

export const markReminderSent = (state: StyleReminderState, count: number): StyleReminderState => ({
  ...state,
  sentAt: state.sentAt.includes(count) ? state.sentAt : [...state.sentAt, count]
})

export const noteDue = (state: StyleReminderState): number | undefined => {
  const { count, noteAt } = state
  if (count === 0 || noteAt.length >= noteLimit || noteAt.includes(count) || state.sentAt.includes(count)) return undefined
  const last = noteAt.at(-1)
  return last !== undefined && count - last < noteGap ? undefined : count
}

export const markNoteSent = (state: StyleReminderState, count: number): StyleReminderState => ({
  ...state,
  noteAt: state.noteAt.includes(count) ? state.noteAt : [...state.noteAt, count]
})

type Row = { role: string; text: string; toolUses: ReadonlyArray<unknown> }

export const textBeforeToolCall = (messages: ReadonlyArray<Row>): boolean => {
  let index = messages.length - 1
  while (index >= 0 && messages[index]?.role !== 'assistant') index -= 1
  let text = false
  let tool = false
  for (let row = messages[index]; row !== undefined && row.role === 'assistant'; row = messages[--index]) {
    if (row.text.trim() !== '') text = true
    if (row.toolUses.length > 0) tool = true
  }
  return text && tool
}
