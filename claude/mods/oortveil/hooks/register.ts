import type { EngineInterface, Register } from 'claude-code'

const DRIFT = [
  'Artifact',
  'ListAgents',
  'ReadNotifications',
  'ReportFindings',
  'ScheduleWakeup',
  'SearchPlugins',
  'SendUserFile',
  'SuggestPluginInstall',
  'SuggestSkills',
  'Workflow',
]

const TOOL_REMINDERS: Record<string, string> = {
  Bash: 'shell',
  PowerShell: 'shell',
  Skill: 'skill',
  mcp__ccd_turn__update_plan: 'plan',
}

const AGENT_RULES_INTRO =
  'These are the standing rules of the person you work for, the same ones the main session follows. They apply to your whole task and to the report you return. The person watches your tool calls, so write command descriptions and other fields the interface shows in the language the brief says the person writes in, or else in the language of their own words quoted there, and never in the language of the brief itself, of tool results or of the files you read.'

type LanguageRules = { readonly reminder: string; readonly rewrite: string }

const MIN_LETTERS = 40
const SHORT_LINE = 200

const read = ($: EngineInterface, path: string) => $.fs.read(path).then(text => text.trim(), () => undefined)

const reminder = ($: EngineInterface, name: string) => read($, `${$.plugin.root}/reminders/${name}.md`)

const configuredLanguage = async ($: EngineInterface) => {
  const value = await $.settings.read({ key: 'language' })
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

const languageRules = async ($: EngineInterface): Promise<LanguageRules | undefined> => {
  const language = await configuredLanguage($)
  return language
    ? {
        reminder: `Write every message the user reads in ${language}: short notes between tool calls, questions, command descriptions, task list items and the final answer.`,
        rewrite: `Your final answer is not in ${language}, the language the user writes in. Write the whole answer again in ${language}, with the same content.`,
      }
    : undefined
}

const userText = async ($: EngineInterface) => {
  const messages = await $.session.messages()
  return [...messages].reverse().find(message => message.role === 'user' && /\p{L}/u.test(message.text) && !message.text.trimStart().startsWith('<'))?.text
}

const prose = (text: string) =>
  text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/(?:[A-Za-z]:)?[\\/][^\s]+/g, '')

const latinShare = (text: string) => {
  const letters = prose(text).match(/\p{L}/gu) ?? []
  const latin = letters.filter(letter => /\p{Script=Latin}/u.test(letter)).length
  return { letters: letters.length, share: letters.length ? latin / letters.length : 0 }
}

const isWrongScript = (user: string, text: string, minLetters: number) => {
  const target = latinShare(user)
  const actual = latinShare(text)
  return target.letters >= 3 && target.share < 0.5 && actual.letters >= minLetters && actual.share > 0.7
}

const promptOverrides = async ($: EngineInterface) => {
  const dir = `${$.plugin.root}/prompt`
  const files = await $.fs.list(dir).catch(error => {
    $.ui.log(`prompt overrides not applied, cannot list ${dir}: ${error}`)
    return []
  })
  return new Map(
    await Promise.all(
      files
        .filter(f => f.kind === 'file' && f.name.endsWith('.md'))
        .map(async f => [f.name.slice(0, -3), (await read($, `${dir}/${f.name}`)) ?? ''] as const),
    ),
  )
}

const outputStyle = async ($: EngineInterface) => {
  const name = await $.settings.read({ key: 'outputStyle' })
  if (typeof name !== 'string') return undefined
  const text = await read($, `${$.plugin.root}/../../output-styles/${name.toLowerCase()}.md`)
  return text?.replace(/^---[\s\S]*?\n---\s*/, '')
}

const SKILL_ENTRY = /\n(?=- \S+(?::\s|\n|$))/
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/

const frontmatterField = (block: string, key: string) => block.match(new RegExp(`^${key}:[ \\t]*(.+)$`, 'm'))?.[1]?.trim()

const pathScopedSkills = async ($: EngineInterface) => {
  const root = `${$.plugin.root}/../../skills`
  const dirs = await $.fs.list(root).catch(() => [])
  const skills = await Promise.all(
    dirs
      .filter(dir => dir.kind === 'dir')
      .map(async dir => {
        const block = (await read($, `${root}/${dir.name}/SKILL.md`))?.match(FRONTMATTER)?.[1] ?? ''
        const description = frontmatterField(block, 'description')
        if (!description || !frontmatterField(block, 'paths')) return undefined
        const name = frontmatterField(block, 'name') ?? dir.name
        return { name, entry: `- ${name}: ${description}` }
      }),
  )
  return skills.filter(skill => skill !== undefined)
}

const withPathScopedSkills = async ($: EngineInterface, text: string) => {
  const [, ...entries] = text.split(SKILL_ENTRY)
  const listed = new Set(entries.map(entry => (entry.slice(2).split(/:\s|\n/)[0] ?? '').trim()))
  const missing = (await pathScopedSkills($)).filter(({ name }) => !listed.has(name)).map(({ entry }) => entry)
  return missing.length ? [text, ...missing].join('\n') : text
}

const passThrough = <E, R>(_: unknown, e: E, next: (e: E) => R) => next(e)

export const register: Register = on => {
  on('prompt.attachment', { type: 'skill_listing' }, async ($, e, next) => next({ ...e, text: await withPathScopedSkills($, e.text) }))

  on('prompt.attachment', async ($, e, next) => {
    const text = await reminder($, e.type)
    return text === undefined ? next(e) : { text: text || null }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta) return next(e)
    const text = await reminder($, 'prompt')
    return text ? next({ ...e, context: [...(e.context ?? []), text] }) : next(e)
  }).catch(passThrough)

  on('classic.PostToolUse', async ($, e, next) => {
    const [result, rules] = await Promise.all([next(e), languageRules($)])
    return rules ? { ...result, additionalContext: [...(result.additionalContext ?? []), rules.reminder] } : result
  }).catch(passThrough)

  on('classic.PostToolUseFailure', async ($, e, next) => {
    const [result, rules] = await Promise.all([next(e), languageRules($)])
    return rules ? { ...result, additionalContext: [...(result.additionalContext ?? []), rules.reminder] } : result
  }).catch(passThrough)

  on('classic.Stop', async ($, e, next) => {
    const answer = e.stop_hook_active ? undefined : e.last_assistant_message
    const [rules, user] = answer ? await Promise.all([languageRules($), userText($)]) : []
    if (answer && rules && user && isWrongScript(user, answer, MIN_LETTERS)) return { block: rules.rewrite }
    return next(e)
  }).catch(passThrough)

  on('classic.MessageDisplay', async ($, e, next) => {
    const isWholeShortLine = e.index === 0 && e.final && !e.delta.trim().includes('\n') && e.delta.trim().length <= SHORT_LINE
    const user = isWholeShortLine ? await userText($) : undefined
    return user && isWrongScript(user, e.delta, 8) ? { displayContent: '' } : next(e)
  }).catch(passThrough)

  on('tool.describe', { tool: ['Bash', 'PowerShell', 'Skill', 'mcp__ccd_turn__update_plan'] }, async ($, e, next) => {
    const described = await next(e)
    const name = TOOL_REMINDERS[e.tool]
    const text = name && (await reminder($, name))
    return text ? { ...described, description: `${described.description}\n\n${text}` } : described
  })

  on('tool.describe', { tool: DRIFT }, async (_, e, next) => ({
    ...(await next(e)),
    isDeferred: true,
  }))

  on('prompt.compose', async ($, e, next) => {
    const { sections } = await next(e)
    const overrides = await promptOverrides($)

    const known = new Set(sections.map(section => section.id))
    for (const [id, text] of overrides) {
      if (!text && !known.has(id)) $.ui.log(`prompt/${id}.md removes nothing, the prompt has no section ${id}`)
    }
    const added = [...overrides]
      .filter(([id, text]) => text && !known.has(id))
      .map(([id, text]) => ({ id: `${$.plugin.name}:${id}`, text, scope: 'session' as const }))

    return {
      sections: [
        ...sections.flatMap(section => {
          const text = overrides.get(section.id)
          if (text === undefined) return [section]
          return text ? [{ ...section, text }] : []
        }),
        ...added,
      ],
    }
  })

  on('agent.spawn', async ($, e, next) => {
    if (e.subagentType === 'fork') return next(e)
    const [style, overrides, language] = await Promise.all([outputStyle($), promptOverrides($), configuredLanguage($)])
    const rules = [language && `The person writes in ${language}. Write every text the person may see in ${language}, including your report, command descriptions and task list items.`, style, ...overrides.values()].filter(Boolean)
    if (!rules.length) return next(e)
    return next({ ...e, prompt: `${e.prompt}\n\n<standing_rules>\n${AGENT_RULES_INTRO}\n\n${rules.join('\n\n')}\n</standing_rules>` })
  })
}
