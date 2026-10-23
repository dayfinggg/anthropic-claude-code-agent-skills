export type LimitGauge = { kind: string; label: string; value: string; fill: number }

export type UsageSummary = { limits: LimitGauge[]; costUsd: number | null } | null

export type TokenKind = 'input' | 'output' | 'cacheRead' | 'cacheWrite'

export type TokenTally = { tokens: number; usd: number }

export type TokenTotals = Record<TokenKind, TokenTally>

declare module 'claude-code' {
  interface PluginState {
    'usage-line': { summary: UsageSummary; tokenUsage: TokenTotals }
  }
}
