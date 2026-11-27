import type { EngineInterface, PluginOptions, PromptComposeSection, Register } from 'claude-code'

const RULES = 'instructions/rules.md'
const LANGUAGE = 'instructions/language.md'
const AFTER_TOOLS = 'instructions/after-tools.md'
const LANGUAGE_SLOT = '{{language}}'
const BARE = 'bare'

export const register: Register = (on, options) => {
  const deferredTools = namesIn(options.deferred_tools)
  const loadedTools = namesIn(options.loaded_tools)
  const excludedSections = namesIn(options.excluded_sections)
  const excludedReminders = namesIn(options.excluded_reminders)

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)

    if (e.traits.includes(BARE)) return composed

    const kept = composed.sections.filter(section => !excludedSections.has(section.id))
    const own = [section($, 'rules', await readOwn($, RULES)), section($, 'language', await languageNote($))]

    return { sections: [...kept, ...own.filter(item => item.text !== '')] }
  })

  on('tool.describe', async ($, e, next) => {
    const described = await next(e)

    if (deferredTools.has(e.tool)) return { ...described, isDeferred: true }
    if (loadedTools.has(e.tool)) return { ...described, isDeferred: false }

    return described
  })

  on('prompt.attachment', async ($, e, next) => {
    const attachment = await next(e)

    return excludedReminders.has(e.type) ? { ...attachment, text: null } : attachment
  })

  on('classic.PostToolBatch', async ($, e, next) => {
    const ran = await next(e)

    if (e.agent_id !== undefined) return ran

    const note = [await readOwn($, AFTER_TOOLS), await languageNote($)].filter(text => text !== '').join(' ')

    return { ...ran, additionalContext: [...(ran.additionalContext ?? []), note] }
  }).catch(($, e, next) => next(e))
}

async function languageNote($: EngineInterface): Promise<string> {
  const language = await $.settings.read({ key: 'language' })

  if (typeof language !== 'string' || language.trim() === '') return ''

  return (await readOwn($, LANGUAGE)).replaceAll(LANGUAGE_SLOT, language.trim())
}

async function readOwn($: EngineInterface, path: string): Promise<string> {
  return (await $.fs.read(`${$.plugin.root}/${path}`)).trim()
}

function section($: EngineInterface, name: string, text: string): PromptComposeSection {
  return { id: `${$.plugin.name}:${name}`, scope: 'session', text }
}

function namesIn(value: PluginOptions[string] | undefined): ReadonlySet<string> {
  return new Set(typeof value === 'object' ? value : [])
}
