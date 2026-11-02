export type StyleReminderState = {
  promptId: string
  batchIds: string[]
  sent: boolean
}

export const styleReminderBatchThreshold = 5

export const readStyleReminderState = (value: unknown): StyleReminderState => {
  if (value === null || typeof value !== 'object') return { promptId: '', batchIds: [], sent: false }
  const state = value as { promptId?: unknown; batchIds?: unknown; sent?: unknown }
  return {
    promptId: typeof state.promptId === 'string' ? state.promptId : '',
    batchIds: Array.isArray(state.batchIds)
      ? [...new Set(state.batchIds.filter((id): id is string => typeof id === 'string' && id.length > 0))].slice(0, styleReminderBatchThreshold)
      : [],
    sent: state.sent === true
  }
}

export const recordToolBatch = (state: StyleReminderState, promptId: string, batchId: string): StyleReminderState => {
  const current = state.promptId === promptId ? state : { promptId, batchIds: [], sent: false }
  return {
    ...current,
    batchIds: current.sent || current.batchIds.length >= styleReminderBatchThreshold || current.batchIds.includes(batchId)
      ? current.batchIds
      : [...current.batchIds, batchId]
  }
}
