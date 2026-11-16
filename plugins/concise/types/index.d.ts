export type CommitGateEntry = {
  at: string
  outcome: 'would block' | 'blocked' | 'let through'
  cwd: string
  command: string
}

declare module 'claude-code' {
  interface PluginState {
    concise: { verifyingSkillRan: boolean; blockedCommits: number }
  }
}
