export type TurnMarks = {
  request: string
}

declare module 'claude-code' {
  interface PluginState {
    'brief-guard': { turn: TurnMarks }
  }
}
