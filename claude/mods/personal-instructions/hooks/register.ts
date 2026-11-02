import type { PromptComposeSection, Register } from 'claude-code'
import { excludeAgentInstructions, excludeStyleInstructions } from './style-exclusions.ts'
import { readStyleReminderState, recordToolBatch, styleReminderBatchThreshold } from './style-reminder.ts'

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
  on('classic.PostToolBatch', async ($, e, next) => {
    const result = await next(e)
    const batchId = e.tool_calls[0]?.tool_use_id
    if (e.agent_id !== undefined || !e.prompt_id || !batchId || result.block !== undefined || result.preventContinuation) return result
    const sessionId = e.session_id
    if (inFlightStyleReminders.has(sessionId)) return result
    inFlightStyleReminders.add(sessionId)
    try {
      if (!conciseStyleSessions.has(sessionId)) await $.prompt.compose()
      if (conciseStyleSessions.get(sessionId) !== true) return result
      const key = styleReminderKey(sessionId)
      const state = recordToolBatch(readStyleReminderState(await $.store.get(key)), e.prompt_id, batchId)
      if (state.sent) return result
      if (state.batchIds.length < styleReminderBatchThreshold) {
        await $.store.set(key, state)
        return result
      }
      await $.prompt.compose()
      if (conciseStyleSessions.get(sessionId) !== true) return result
      const reminder = await $.fs.read(`${$.plugin.root}/rules/style_reminder.md`)
      if (!reminder.trim()) return result
      await $.store.set(key, { ...state, sent: true })
      return { ...result, additionalContext: [...(result.additionalContext ?? []), reminder] }
    } catch {
      return result
    } finally {
      inFlightStyleReminders.delete(sessionId)
    }
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
