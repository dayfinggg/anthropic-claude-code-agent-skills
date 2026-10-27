import type { EngineInterface, Register, SessionMessage, TurnStepChunk } from 'claude-code'

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

const read = ($: EngineInterface, path: string) => $.fs.read(path).then(text => text.trim(), () => undefined)

const reminder = ($: EngineInterface, name: string) => read($, `${$.plugin.root}/reminders/${name}.md`)

const configuredLanguage = async ($: EngineInterface) => {
  const value = await $.settings.read({ key: 'language' })
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

const withLanguage = async ($: EngineInterface, name: string) => {
  const language = await configuredLanguage($)
  return language ? (await reminder($, name))?.replaceAll('{language}', language) : undefined
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

const isMostlyLatin = (text: string) => {
  const letters = prose(text).match(/\p{L}/gu) ?? []
  return letters.filter(letter => /\p{Script=Latin}/u.test(letter)).length * 2 > letters.length
}

const isWrongScript = (user: string, text: string) => !isMostlyLatin(user) && isMostlyLatin(text)

const STYLE_SLIP = /[–—;]|^[ \t]*(?:[-*•]|\d+[.)]|#{1,6})[ \t]+\S|^[ \t]*\*\*[^*\n]+\*\*[ \t]*[:.]/m

const hasStyleSlip = (answer: string) =>
  STYLE_SLIP.test(
    prose(answer)
      .split('\n')
      .filter(line => !line.trimStart().startsWith('|'))
      .join('\n'),
  )

const styleSlipNote = async ($: EngineInterface) => {
  const messages = await $.session.messages()
  const answer = [...messages].reverse().find(message => message.role === 'assistant' && message.text.trim())?.text
  return answer && hasStyleSlip(answer) ? reminder($, 'style_slip') : undefined
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

const skillsIn = (messages: readonly SessionMessage[]) =>
  new Set(
    messages.flatMap(message =>
      message.toolUses.flatMap(use => (use.tool === 'Skill' && typeof use.input.skill === 'string' ? [use.input.skill] : [])),
    ),
  )

const skillsBeforeCompaction = new Map<string, ReadonlySet<string>>()

const passThrough = <E, R>(_: unknown, e: E, next: (e: E) => R) => next(e)

export const register: Register = on => {
  on('prompt.attachment', async ($, e, next) => {
    const text = await reminder($, e.type)
    return text === undefined ? next(e) : { text: text || null }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta) return next(e)
    const note = await styleSlipNote($)
    return note ? next({ ...e, context: [...(e.context ?? []), note] }) : next(e)
  }).catch(passThrough)

  on('session.compact', async ($, e, next) => {
    skillsBeforeCompaction.set(e.agentId ?? 'main', skillsIn(e.messages))
    const focus = await reminder($, 'compact_focus')
    return next(focus ? { ...e, instructions: [e.instructions, focus].filter(Boolean).join('\n\n') } : e)
  }).catch(passThrough)

  on('classic.SessionStart', async ($, e, next) => {
    const result = await next(e)
    if (e.source !== 'compact') return result
    const skills = [...(skillsBeforeCompaction.get(e.agent_id ?? 'main') ?? [])]
    const text = await reminder($, 'after_compact')
    if (!text) return result
    const context = text.replace('{skills}', skills.length ? skills.join(', ') : 'none')
    return { ...result, additionalContext: [...(result.additionalContext ?? []), context] }
  }).catch(passThrough)

  on('classic.Stop', async ($, e, next) => {
    const answer = e.stop_hook_active ? undefined : e.last_assistant_message
    const user = answer ? await userText($) : undefined
    const rewrite = answer && user && isWrongScript(user, answer) ? await withLanguage($, 'language_rewrite') : undefined
    return rewrite ? { block: rewrite } : next(e)
  }).catch(passThrough)

  on('turn.step', async function* ($, e, next) {
    const user = await userText($)
    if (!user || isMostlyLatin(user)) return yield* next(e)
    const stream = next(e)
    const held: TurnStepChunk[] = []
    let heldText = ''
    let holding = true
    for (let step = await stream.next(); ; step = await stream.next()) {
      if (step.done) {
        yield* held
        return step.value
      }
      const chunk = step.value
      if (!holding || (!held.length && chunk.kind !== 'text')) {
        yield chunk
        continue
      }
      if (chunk.kind === 'tool') {
        const released = held.splice(0)
        yield* isWrongScript(user, heldText) ? released.filter(c => c.kind !== 'text') : released
        holding = false
        yield chunk
        continue
      }
      held.push(chunk)
      if (chunk.kind === 'text') heldText += chunk.text
      if (chunk.kind === 'stop' || heldText.trim().includes('\n')) {
        yield* held.splice(0)
        holding = false
      }
    }
  })

  on('tool.describe', { tool: Object.keys(TOOL_REMINDERS) }, async ($, e, next) => {
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
    const [intro, overrides] = await Promise.all([withLanguage($, 'agent_rules'), promptOverrides($)])
    const rules = [intro, ...overrides.values()].filter(Boolean)
    if (!rules.length) return next(e)
    return next({ ...e, prompt: `${e.prompt}\n\n<standing_rules>\n${rules.join('\n\n')}\n</standing_rules>` })
  })
}
