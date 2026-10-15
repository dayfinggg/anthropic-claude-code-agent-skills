export type LimitGauge = { kind: string; label: string; value: string; fill: number }

export type UsageSummary = { limits: LimitGauge[]; costUsd: number | null } | null

export type TokenTotals = { input: number; output: number; cacheRead: number; cacheWrite: number }

declare module 'claude-code' {
  interface PluginState {
    'usage-line': { summary: UsageSummary; tokenTotals: TokenTotals }
  }
}
