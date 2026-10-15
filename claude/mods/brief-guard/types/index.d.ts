export type TurnMarks = {
  request: string
  silenceAllowed: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'brief-guard': { turn: TurnMarks }
  }
}
