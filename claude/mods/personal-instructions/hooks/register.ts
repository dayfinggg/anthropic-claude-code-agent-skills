import type { PromptComposeSection, Register } from 'claude-code'
import { excludeAgentInstructions, excludeStyleInstructions } from './style-exclusions.ts'
import { markReminderSent, readStyleReminderState, recordToolBatch, reminderDue } from './style-reminder.ts'
import { checkAnswer, stopMessage } from './style-check.ts'

const sectionFiles: Readonly<Record<string, string>> = {
  intro: 'intro',
  system: 'system',
  doing_tasks: 'doing_tasks',
  actions: 'actions',
  tools: 'tools',
  session_guidance: 'session_guidance',
  context_management: 'context_management',
  communication: 'communication'
}
const removedSections = new Set(['tone', 'heron_brook'])
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
const inFlightStyleReminders = new Set<string>()
const styleReminderKey = (sessionId: string) => `personal-instructions.style-reminder.${sessionId}`
export const register: Register = on => {
  on('tool.call', { tool: 'Bash' }, ($, e, next) =>
    typeof e.timeout === 'number' && e.timeout > 0
      ? next(e)
      : { deny: `${$.plugin.name}: set timeout in milliseconds to the expected run time of this command, measure a directory tree, an archive, or a file of unknown size first, and run one heavy step per call.` }
  ).catch(($, e, next) => next.called ? next(e) : { deny: `${$.plugin.name}: its timeout guard failed.` })
  on('tool.call', { tool: 'PowerShell' }, ($, e, next) =>
    typeof e.timeout === 'number' && e.timeout > 0
      ? next(e)
      : { deny: `${$.plugin.name}: set timeout in milliseconds to the expected run time of this command, measure a directory tree, an archive, or a file of unknown size first, and run one heavy step per call.` }
  ).catch(($, e, next) => next.called ? next(e) : { deny: `${$.plugin.name}: its timeout guard failed.` })
  on('classic.Stop', async ($, e, next) => {
    const result = await next(e)
    if (result.block !== undefined || e.stop_hook_active) return result
    const answer = e.last_assistant_message
    if (typeof answer !== 'string' || !answer.trim()) return result
    const problems = checkAnswer(answer)
    return problems.length === 0 ? result : { ...result, block: stopMessage(problems) }
  }).catch(($, e, next) => next(e))
  on('tool.describe', async ($, e, next) => {
    const result = await next(e)
    const server = /^mcp__(.+?)__/.exec(e.tool)?.[1]
    const isClaudeMcp = server !== undefined && (
      claudeMcpServers.has(server) || server.startsWith('ccd_')
    )
    let description = excludeStyleInstructions(e.tool === 'Agent'
      ? excludeAgentInstructions(result.description)
      : result.description)
    if (e.tool === 'Bash' || e.tool === 'PowerShell') {
      try {
        const note = (await $.fs.read(`${$.plugin.root}/rules/command_note.md`)).trim()
        if (note) description = `${description.trimEnd()}\n\n${note}`
      } catch {}
    }
    return {
      ...result,
      description: server === undefined ? description.trimEnd() : description,
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
    if (e.reason === 'clear' || e.reason === 'logout') {
      try {
        await $.store.delete(styleReminderKey(e.sessionId))
      } catch {
      }
    }
    return result
  })
  on('prompt.section', { name: 'communication' }, async $ => ({ text: await $.fs.read(`${$.plugin.root}/rules/communication.md`) }))
  on('prompt.section', { name: 'tone' }, () => ({ text: null }))
  on('prompt.section', { name: 'heron_brook' }, () => ({ text: null }))
  on('prompt.attachment', { type: 'language' }, async ($, e, next) => {
    const result = await next(e)
    try {
      const text = await $.fs.read(`${$.plugin.root}/rules/language.md`)
      if (!text.trim()) return result
      return { ...result, text: result.text ? `${result.text.trimEnd()}\n\n${text.trim()}` : text }
    } catch {
      return result
    }
  })
  on('prompt.attachment', { type: 'mcp_instructions_delta' }, async ($, e, next) => {
    const result = await next(e)
    return { ...result, text: result.text === null ? null : excludeStyleInstructions(result.text) }
  })
  on('prompt.submit', async ($, e, next) => {
    if (e.isMeta || e.command || !e.text.trim()) return next(e)
    try {
      const reminder = await $.fs.read(`${$.plugin.root}/rules/style_reminder.md`)
      const context = [...(e.context ?? [])]
      if (reminder.trim()) context.push(reminder.trim())
      if (e.turnId) {
        const midturn = await $.fs.read(`${$.plugin.root}/rules/midturn_note.md`)
        if (midturn.trim()) context.push(midturn.trim())
      }
      return context.length === (e.context?.length ?? 0) ? next(e) : next({ ...e, context })
    } catch {
      return next(e)
    }
  }).catch(($, e, next) => next(e))
  on('classic.PostToolBatch', async ($, e, next) => {
    const result = await next(e)
    const batchId = e.tool_calls[0]?.tool_use_id
    if (e.agent_id !== undefined || !e.prompt_id || !batchId || result.block !== undefined || result.preventContinuation) return result
    const sessionId = e.session_id
    if (inFlightStyleReminders.has(sessionId)) return result
    inFlightStyleReminders.add(sessionId)
    try {
      const key = styleReminderKey(sessionId)
      const state = recordToolBatch(readStyleReminderState(await $.store.get(key)), e.prompt_id, batchId)
      const due = reminderDue(state)
      if (due === undefined) {
        await $.store.set(key, state)
        return result
      }
      const reminder = await $.fs.read(`${$.plugin.root}/rules/style_reminder.md`)
      if (!reminder.trim()) return result
      await $.store.set(key, markReminderSent(state, due))
      return { ...result, additionalContext: [...(result.additionalContext ?? []), reminder] }
    } catch {
      return result
    } finally {
      inFlightStyleReminders.delete(sessionId)
    }
  }).catch(($, e, next) => next(e))
  on('agent.spawn', async ($, e, next) => {
    if (e.fork || e.resume || e.workflow || !e.prompt.trim()) return next(e)
    try {
      const rules = await $.fs.read(`${$.plugin.root}/rules/subagent_rules.md`)
      if (!rules.trim()) return next(e)
      return next({ ...e, prompt: `${e.prompt.trimEnd()}\n\n${rules.trim()}` })
    } catch {
      return next(e)
    }
  }).catch(($, e, next) => next(e))
  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    const sections: PromptComposeSection[] = []
    let communication = false
    for (const section of result.sections) {
      if (removedSections.has(section.id)) continue
      const file = sectionFiles[section.id]
      if (section.id === 'communication') communication = true
      sections.push(file
        ? { ...section, text: await $.fs.read(`${$.plugin.root}/rules/${file}.md`), scope: 'session' }
        : { ...section, text: excludeStyleInstructions(section.text) })
    }
    if (!communication) {
      sections.push({ id: 'communication', text: await $.fs.read(`${$.plugin.root}/rules/communication.md`), scope: 'session' })
    }
    return { ...result, sections: [
      ...sections.filter(s => s.scope === 'shared'),
      ...sections.filter(s => s.scope === 'session' && s.id !== 'communication'),
      ...sections.filter(s => s.id === 'communication')
    ] }
  })
}
