import type { Register } from 'claude-code'

import { FORK, instructAgent, noteAgent } from './agents'
import {
  EVERY_TOOL,
  applyRules,
  loadReminders,
  loadSwitchNotice,
  loadToolDescriptions,
  loadToolReminders,
  rewriteAttachment,
} from './instructions'
import { bindingsIn, namesIn, placed } from './options'

export const register: Register = (on, options) => {
  const deferredTools = namesIn(options.deferred_tools)
  const loadedTools = namesIn(options.loaded_tools)
  const excludedSections = namesIn(options.excluded_sections)
  const excludedReminders = namesIn(options.excluded_reminders)
  const sectionOrder = [...namesIn(options.section_order)]
  const agentExcludedSections = namesIn(options.agent_excluded_sections)
  const modelBoundSkills = bindingsIn(options.model_bound_skills)

  const skillsHiddenFrom = (model: string): ReadonlySet<string> =>
    new Set(modelBoundSkills.filter(([, bound]) => !model.includes(bound)).map(([skill]) => skill))

  const isDeferred = (tool: string): boolean | undefined => {
    if (deferredTools.has(tool)) return true

    return loadedTools.has(tool) ? false : undefined
  }

  on('tool.describe', async ($, e, next) => {
    const described = await next(e)
    const descriptions = await loadToolDescriptions($)
    const description = descriptions.get(e.tool) ?? described.description

    return placed({ ...described, description }, isDeferred(e.tool))
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)

    if (e.agentId !== undefined || ran.deny !== undefined) return ran

    const reminders = await loadToolReminders($, await $.session.model())
    const due = [reminders.get(String(e.tool)), reminders.get(EVERY_TOOL)].flatMap(text =>
      text === undefined ? [] : [text],
    )

    return due.length === 0 ? ran : { ...ran, context: [...(ran.context ?? []), ...due] }
  }).catch(($, e, next) => next(e))

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    const asleep = e.tools.filter(tool => deferredTools.has(tool))

    return {
      sections: await applyRules(
        $,
        e.model,
        asleep,
        excludedSections,
        sectionOrder,
        composed.sections,
      ),
    }
  })

  on('prompt.attachment', async ($, e, next) => {
    if (excludedReminders.has(e.type)) return { text: null }

    const attachment = await next(e)

    if (attachment.text === null) return attachment

    const hidden = skillsHiddenFrom(await $.session.model())

    return { ...attachment, text: await rewriteAttachment($, e.type, attachment.text, hidden) }
  })

  on('prompt.submit', async ($, e, next) => {
    const reminders = await loadReminders($, await $.session.model())

    return next(reminders.length === 0 ? e : { ...e, context: [...(e.context ?? []), ...reminders] })
  }).catch(($, e, next) => next(e))

  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)

    if (spawned.deny === undefined) noteAgent(spawned.agentId, e.fork ? FORK : spawned.model)

    return spawned
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) {
      await instructAgent($, e.agentId, sectionOrder, agentExcludedSections)
    }

    return next(e)
  })

  on('classic.PostModelSwitch', async ($, e, next) => {
    const switched = await next(e)
    const tools = await $.tool.list()
    const asleep = tools.map(tool => tool.name).filter(tool => deferredTools.has(tool))
    const notice = await loadSwitchNotice($, e.to_model, asleep)

    return notice === undefined
      ? switched
      : { ...switched, additionalContext: [...(switched.additionalContext ?? []), notice] }
  }).catch(($, e, next) => next(e))
}
