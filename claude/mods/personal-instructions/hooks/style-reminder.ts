export type StyleReminderState = {
  promptId: string
  count: number
  lastBatchId: string
  sentAt: number[]
}

export const firstReminderAt = 5
export const reminderInterval = 10

const empty = (promptId = ''): StyleReminderState => ({ promptId, count: 0, lastBatchId: '', sentAt: [] })

const counts = (value: unknown): number[] => Array.isArray(value)
  ? [...new Set(value.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0))]
  : []

export const readStyleReminderState = (value: unknown): StyleReminderState => {
  if (value === null || typeof value !== 'object') return empty()
  const state = value as { promptId?: unknown; count?: unknown; lastBatchId?: unknown; sentAt?: unknown }
  return {
    promptId: typeof state.promptId === 'string' ? state.promptId : '',
    count: typeof state.count === 'number' && Number.isInteger(state.count) && state.count >= 0 ? state.count : 0,
    lastBatchId: typeof state.lastBatchId === 'string' ? state.lastBatchId : '',
    sentAt: counts(state.sentAt)
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
