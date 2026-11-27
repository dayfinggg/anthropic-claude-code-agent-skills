import type { EngineInterface, PluginOptions, PromptComposeSection, Register } from 'claude-code'

const RULES = 'instructions/rules.md'
const TURN = 'instructions/turn.md'
const BARE = 'bare'

export const register: Register = (on, options) => {
  const deferredTools = namesIn(options.deferred_tools)
  const loadedTools = namesIn(options.loaded_tools)
  const excludedToolLines = namesIn(options.excluded_tool_lines)
  const excludedSections = namesIn(options.excluded_sections)
  const excludedReminders = namesIn(options.excluded_reminders)

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)

    if (e.traits.includes(BARE)) return composed

    const kept = composed.sections.filter(section => !excludedSections.has(section.id))

    return { sections: [...kept, section($, 'rules', await readOwn($, RULES))] }
  })

  on('tool.describe', async ($, e, next) => {
    const described = await next(e)
    const description = withoutLines(described.description, excludedToolLines)

    if (deferredTools.has(e.tool)) return { ...described, description, isDeferred: true }
    if (loadedTools.has(e.tool)) return { ...described, description, isDeferred: false }

    return { ...described, description }
  })

  on('prompt.attachment', ($, e, next) => (excludedReminders.has(e.type) ? { text: null } : next(e)))

  on('prompt.submit', async ($, e, next) => {
    if (e.turnId !== undefined || e.command !== undefined || e.isMeta === true) return next(e)

    return next({ ...e, context: [...(e.context ?? []), await readOwn($, TURN)] })
  })
}

async function readOwn($: EngineInterface, path: string): Promise<string> {
  return (await $.fs.read(`${$.plugin.root}/${path}`)).trim()
}

function withoutLines(text: string, phrases: ReadonlySet<string>): string {
  return text.split('\n').filter(line => ![...phrases].some(phrase => phrase !== '' && line.includes(phrase))).join('\n')
}

function section($: EngineInterface, name: string, text: string): PromptComposeSection {
  return { id: `${$.plugin.name}:${name}`, scope: 'session', text }
}

function namesIn(value: PluginOptions[string] | undefined): ReadonlySet<string> {
  return new Set(typeof value === 'object' ? value : [])
}
