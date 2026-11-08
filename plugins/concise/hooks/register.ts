import type { EngineInterface, Register } from 'claude-code'
import {
  CODING_SECTION,
  DEFERRED_TOOLS,
  HEREDOC_DENIAL,
  HEREDOC_WRITE,
  REMOVED_SECTIONS,
  REPLY_CHECKS,
  REPLY_REMINDER,
  SECTION_REWRITES,
  SHELL_OVER_TOOLS,
  SOURCE_LIST_RULES,
  SUBAGENT_PREFACE,
  TOOL_REMINDER,
  TOOL_REMINDER_EVERY,
  TOOL_RULES,
} from './config'

const writesFileWithHeredoc = (command: string) =>
  (command.split('\n')[0] ?? '').split(/&&|\|\||;/).some(segment => HEREDOC_WRITE.test(segment))

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const replyProblems = (reply: string) => {
  const prose = reply
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, 'link')
    .replace(/https?:\/\/\S+/g, 'link')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('|'))
    .join('\n')
  return REPLY_CHECKS.filter(([, pattern]) => pattern.test(prose)).map(([name]) => name)
}

const readInstruction = async ($: EngineInterface, name: string) =>
  (await $.fs.read(`${$.plugin.root}/instructions/${name}`)).trim()

const readStyle = async ($: EngineInterface) =>
  (await $.fs.read(`${$.plugin.root}/output-styles/concise.md`)).replace(/^---[\s\S]*?\n---\s*/, '').trim()

const subagentTask = async ($: EngineInterface, task: string) => {
  const [style, ...rules] = await Promise.all([
    readStyle($),
    ...['coding.md', 'tools.md', 'skill.md'].map(name => readInstruction($, name)),
  ])
  return `<main_session_instructions>\n${SUBAGENT_PREFACE}\n\n${style}\n\n${rules.join('\n\n')}\n</main_session_instructions>\n\n<task>\n${task}\n</task>`
}

export const register: Register = on => {
  on('prompt.submit', ($, e, next) => next({ ...e, context: [...(e.context ?? []), REPLY_REMINDER] }))

  on('classic.Stop', ($, e, next) => {
    if (e.stop_hook_active || !e.last_assistant_message) return next(e)
    const problems = replyProblems(e.last_assistant_message)
    if (problems.length === 0) return next(e)
    return {
      block: `Your last reply has ${problems.join(', ')}, which the output style rules out. Send it again with the same content, rewritten to the style. If the user asked for this format, send it unchanged.`,
    }
  }).catch(($, e, next) => next(e))

  on('prompt.attachment', { type: 'auto_mode' }, ($, e, next) => {
    if (!SHELL_OVER_TOOLS.test(e.text)) return next(e)
    const kept = e.text.split(/\n\s*\n/).filter(paragraph => !SHELL_OVER_TOOLS.test(paragraph))
    return kept.every(paragraph => paragraph.trim().endsWith(':')) ? { text: null } : next({ ...e, text: kept.join('\n\n') })
  })

  on('agent.spawn', async ($, e, next) =>
    e.subagentType === 'fork' ? next(e) : next({ ...e, prompt: await subagentTask($, e.prompt) }),
  ).catch(($, e, next) => next(e))

  on('tool.describe', { tool: DEFERRED_TOOLS }, async ($, e, next) => ({ ...(await next(e)), isDeferred: true }))

  on('tool.describe', { tool: Object.keys(TOOL_RULES) }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), readInstruction($, TOOL_RULES[e.tool] ?? '')])
    return { ...result, description: `${removeSourceListRules(result.description)}\n\n${rule}` }
  })

  on('tool.call', { tool: 'Bash' }, ($, e, next) =>
    writesFileWithHeredoc(e.command) ? { deny: `${$.plugin.name}: ${HEREDOC_DENIAL}` } : next(e),
  ).catch(($, e, next) => (next.called ? next(e) : { deny: `${$.plugin.name}: the heredoc guard failed.` }))

  let toolResults = 0
  on('session.append', { door: 'tool-result' }, ($, e, next) => {
    const isSearch = e.origin.kind === 'tool' && e.origin.tool === 'WebSearch'
    const content = e.message.content.map(block =>
      isSearch && block.type === 'tool_result' && typeof block.content === 'string'
        ? { ...block, content: removeSourceListRules(block.content) }
        : block,
    )
    toolResults += 1
    const reminder =
      toolResults % TOOL_REMINDER_EVERY === 0
        ? [{ type: 'text' as const, text: `<system-reminder>\n${TOOL_REMINDER}\n</system-reminder>` }]
        : []
    return next({ ...e, message: { ...e.message, content: [...content, ...reminder] } })
  })

  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    if (e.traits.includes('bare')) return result

    const section = async (name: string, file: string) => ({
      id: `${$.plugin.name}:${name}`,
      text: await readInstruction($, file),
      scope: 'session' as const,
    })
    const added = [
      await section('communication', 'communication.md'),
      ...(e.tools.includes('Read') && e.tools.includes('Edit') ? [await section('tools', 'tools.md')] : []),
      ...(e.traits.includes('skills') ? [await section('skills', 'skill.md')] : []),
    ]
    if (!e.outputStyle?.isKeepingCodingInstructions) return { sections: [...result.sections, ...added] }

    const coding = await readInstruction($, 'coding.md')
    const sections = result.sections
      .filter(section => !REMOVED_SECTIONS.some(id => section.id.startsWith(id)))
      .map(section => {
        if (section.id === CODING_SECTION) return { ...section, text: coding }
        const rewrite = SECTION_REWRITES[section.id]
        return rewrite ? { ...section, text: section.text.replace(...rewrite) } : section
      })
    const hasCoding = sections.some(section => section.id === CODING_SECTION)
    const codingSection = hasCoding ? [] : [{ id: `${$.plugin.name}:coding`, text: coding, scope: 'session' as const }]
    return { sections: [...sections, ...codingSection, ...added] }
  })
}
