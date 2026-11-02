export type StyleReminderState = {
  turnId: string
  indexes: number[]
  pending: boolean
}

export const styleReminderToolThreshold = 5

export const readStyleReminderState = (value: unknown): StyleReminderState => {
  if (value === null || typeof value !== 'object') return { turnId: '', indexes: [], pending: false }
  const state = value as { turnId?: unknown; indexes?: unknown; pending?: unknown }
  return {
    turnId: typeof state.turnId === 'string' ? state.turnId : '',
    indexes: Array.isArray(state.indexes) ? state.indexes.filter((index): index is number => Number.isSafeInteger(index)) : [],
    pending: state.pending === true
  }
}

export const recordToolStep = (state: StyleReminderState, turnId: string, index: number): StyleReminderState => {
  const current = state.turnId === turnId ? state.indexes : []
  return {
    turnId,
    indexes: current.length >= styleReminderToolThreshold || current.includes(index) ? current : [...current, index],
    pending: state.pending
  }
}

export const finishToolTurn = (state: StyleReminderState, turnId: string, reminder: boolean): StyleReminderState => ({
  turnId: '',
  indexes: [],
  pending: state.pending || (state.turnId === turnId && reminder && state.indexes.length >= styleReminderToolThreshold)
})
