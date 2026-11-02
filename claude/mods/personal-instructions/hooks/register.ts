import type { PromptComposeSection, Register } from 'claude-code'
import { excludeAgentInstructions, excludeStyleInstructions } from './style-exclusions.ts'
import { finishToolTurn, readStyleReminderState, recordToolStep } from './style-reminder.ts'

const sectionFiles: Readonly<Record<string, string>> = {
  intro: 'intro',
  system: 'system',
  doing_tasks: 'doing_tasks',
  actions: 'actions',
  tools: 'tools',
  session_guidance: 'session_guidance',
  context_management: 'context_management'
}
const removedSections = new Set(['tone', 'communication', 'heron_brook'])
const deferredTools = [
  'Artifact',
  'ScheduleWakeup',
  'Workflow',
  'ReportFindings',
  'SearchPlugins',
  'SuggestPluginInstall',
  'SuggestSkills',
  'ListAgents'
]
const claudeMcpServers = new Set([
  'Claude_Browser',
  'Claude_Preview',
  'claude-in-chrome',
  'computer-use',
  'terminal',
  'visualize',
  'workspace',
  'ide',
  'claude_ai_Claude_Docs',
  '1a59c906-04da-521d-bda7-7f71b9f9e01c'
])
const conciseStyleSessions = new Map<string, boolean>()
const inFlightStyleReminders = new Set<string>()
const styleReminderKey = (sessionId: string) => `personal-instructions.style-reminder.${sessionId}`

export const register: Register = on => {
  on('tool.describe', async ($, e, next) => {
    const result = await next(e)
    const server = /^mcp__(.+?)__/.exec(e.tool)?.[1]
    const isClaudeMcp = server !== undefined && (
      claudeMcpServers.has(server) || server.startsWith('ccd_')
    )
    return {
      ...result,
      description: excludeStyleInstructions(e.tool === 'Agent'
        ? excludeAgentInstructions(result.description)
        : result.description),
      ...(deferredTools.includes(e.tool) || isClaudeMcp ? { isDeferred: true } : {})
    }
  })
  on('session.start', async ($, e, next) => {
    $.ui.invalidate('tool.describe')
    $.ui.invalidate('prompt.section')
    $.ui.invalidate('prompt.attachment')
    return next(e)
  })
  on('session.end', async ($, e, next) => {
    const result = await next(e)
    conciseStyleSessions.delete(e.sessionId)
    if (e.reason === 'clear' || e.reason === 'logout') {
      try {
        await $.store.delete(styleReminderKey(e.sessionId))
      } catch {
      }
    }
    return result
  })
  on('prompt.section', { name: 'communication' }, () => ({ text: null }))
  on('prompt.section', { name: 'tone' }, () => ({ text: null }))
  on('prompt.section', { name: 'heron_brook' }, () => ({ text: null }))
  on('prompt.attachment', { type: 'language' }, () => ({ text: null }))
  on('prompt.attachment', { type: 'mcp_instructions_delta' }, async ($, e, next) => {
    const result = await next(e)
    return { ...result, text: result.text === null ? null : excludeStyleInstructions(result.text) }
  })
  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta || e.turnId || !['composer', 'bridge', 'sdk'].includes(e.origin.kind)) return next(e)
    let sessionId: string
    try {
      sessionId = await $.session.id()
    } catch {
      return next(e)
    }
    if (inFlightStyleReminders.has(sessionId)) return next(e)
    inFlightStyleReminders.add(sessionId)
    let reminderState: ReturnType<typeof readStyleReminderState> | null = null
    let reminder: string | null = null
    try {
      const key = styleReminderKey(sessionId)
      const state = readStyleReminderState(await $.store.get(key))
      if (state.pending) {
        if (!conciseStyleSessions.has(sessionId)) await $.prompt.compose()
        if (conciseStyleSessions.get(sessionId) === true) {
          reminder = await $.fs.read(`${$.plugin.root}/rules/style_reminder.md`)
          reminderState = state
        } else {
          await $.store.delete(key)
        }
      }
    } catch {
      reminderState = null
      reminder = null
    }
    if (reminderState === null || reminder === null) {
      inFlightStyleReminders.delete(sessionId)
      return next(e)
    }
    try {
      await $.store.set(styleReminderKey(sessionId), { ...reminderState, pending: false })
    } catch {
      inFlightStyleReminders.delete(sessionId)
      return next(e)
    }
    try {
      return await next({ ...e, context: [...(e.context ?? []), reminder] })
    } catch (error) {
      try {
        await $.store.set(styleReminderKey(sessionId), reminderState)
      } catch {
      }
      throw error
    } finally {
      inFlightStyleReminders.delete(sessionId)
    }
  })
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    if (e.agentId === undefined && result.toolUses.length > 0) {
      try {
        const sessionId = await $.session.id()
        const key = styleReminderKey(sessionId)
        const state = readStyleReminderState(await $.store.get(key))
        await $.store.set(key, recordToolStep(state, e.turnId, e.index))
      } catch {
      }
    }
    return result
  })
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId === undefined) {
      try {
        const sessionId = await $.session.id()
        const key = styleReminderKey(sessionId)
        const state = readStyleReminderState(await $.store.get(key))
        const completed = finishToolTurn(state, e.turnId, e.reason === 'answer' && !e.isAborted && conciseStyleSessions.get(sessionId) === true)
        if (completed.pending || completed.indexes.length > 0) await $.store.set(key, completed)
        else await $.store.delete(key)
      } catch {
      }
    }
    return result
  })
  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    try {
      const sessionId = await $.session.id()
      conciseStyleSessions.set(sessionId, e.outputStyle?.name === 'Concise Personal')
      if (e.outputStyle?.name !== 'Concise Personal') await $.store.delete(styleReminderKey(sessionId))
    } catch {
    }
    const sections: PromptComposeSection[] = []
    for (const section of result.sections) {
      if (removedSections.has(section.id)) continue
      const file = sectionFiles[section.id]
      sections.push(file
        ? { ...section, text: await $.fs.read(`${$.plugin.root}/rules/${file}.md`), scope: 'session' }
        : { ...section, text: excludeStyleInstructions(section.text) })
    }
    return { ...result, sections: [
      ...sections.filter(s => s.scope === 'shared'),
      ...sections.filter(s => s.scope === 'session')
    ] }
  })
}
