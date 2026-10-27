export type SkillNames = string[]

declare module 'claude-code' {
  interface PluginState {
    oortveil: { skillsBeforeCompaction: StateFamily<SkillNames> }
  }
}
