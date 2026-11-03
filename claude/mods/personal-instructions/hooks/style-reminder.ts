export type StyleReminderState = {
  promptId: string
  batchIds: string[]
  sentAt: number[]
}

export const styleReminderThresholds: readonly number[] = [5, 10, 15]
const maxTrackedBatches = Math.max(...styleReminderThresholds)

const stringList = (value: unknown, limit: number): string[] => Array.isArray(value)
  ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0))].slice(0, limit)
  : []

export const readStyleReminderState = (value: unknown): StyleReminderState => {
  if (value === null || typeof value !== 'object') return { promptId: '', batchIds: [], sentAt: [] }
  const state = value as { promptId?: unknown; batchIds?: unknown; sentAt?: unknown }
  return {
    promptId: typeof state.promptId === 'string' ? state.promptId : '',
    batchIds: stringList(state.batchIds, maxTrackedBatches),
    sentAt: Array.isArray(state.sentAt)
      ? [...new Set(state.sentAt.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0))]
      : []
  }
}

export const recordToolBatch = (state: StyleReminderState, promptId: string, batchId: string): StyleReminderState => {
  const current = state.promptId === promptId ? state : { promptId, batchIds: [], sentAt: [] }
  return {
    ...current,
    batchIds: current.batchIds.length >= maxTrackedBatches || current.batchIds.includes(batchId)
      ? current.batchIds
      : [...current.batchIds, batchId]
  }
}

export const reminderDue = (state: StyleReminderState): number | undefined => {
  const count = state.batchIds.length
  return styleReminderThresholds.find(threshold => threshold === count && !state.sentAt.includes(threshold))
}

export const markReminderSent = (state: StyleReminderState, threshold: number): StyleReminderState => ({
  ...state,
  sentAt: state.sentAt.includes(threshold) ? state.sentAt : [...state.sentAt, threshold]
})
