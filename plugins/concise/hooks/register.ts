import type { EngineInterface, Register } from 'claude-code'
import {
  CODING_SECTION,
  DEFERRED_TOOLS,
  HEREDOC_DENIAL,
  HEREDOC_WRITE,
  REMOVED_SECTIONS,
  SECTION_REWRITES,
  SHELL_OVER_TOOLS,
  SOURCE_LIST_RULES,
  TOOL_RULES,
} from './config'

const writesFileWithHeredoc = (command: string) =>
  (command.split('\n')[0] ?? '').split(/&&|\|\||;/).some(segment => HEREDOC_WRITE.test(segment))

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const readInstruction = async ($: EngineInterface, name: string) =>
  (await $.fs.read(`${$.plugin.root}/instructions/${name}`)).trim()

export const register: Register = on => {
  on('prompt.attachment', { type: 'auto_mode' }, ($, e, next) => {
    if (!SHELL_OVER_TOOLS.test(e.text)) return next(e)
    const kept = e.text.split(/\n\s*\n/).filter(paragraph => !SHELL_OVER_TOOLS.test(paragraph))
    return kept.every(paragraph => paragraph.trim().endsWith(':')) ? { text: null } : next({ ...e, text: kept.join('\n\n') })
  })

  on('tool.describe', { tool: DEFERRED_TOOLS }, async ($, e, next) => ({ ...(await next(e)), isDeferred: true }))

  on('tool.describe', { tool: Object.keys(TOOL_RULES) }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), readInstruction($, TOOL_RULES[e.tool] ?? '')])
    return { ...result, description: `${removeSourceListRules(result.description)}\n\n${rule}` }
  })

  on('tool.call', { tool: 'Bash' }, ($, e, next) =>
    writesFileWithHeredoc(e.command) ? { deny: `${$.plugin.name}: ${HEREDOC_DENIAL}` } : next(e),
  ).catch(($, e, next) => (next.called ? next(e) : { deny: `${$.plugin.name}: the heredoc guard failed.` }))

  on('session.append', { door: 'tool-result' }, ($, e, next) => {
    if (e.origin.kind !== 'tool' || e.origin.tool !== 'WebSearch') return next(e)
    const content = e.message.content.map(block =>
      block.type === 'tool_result' && typeof block.content === 'string'
        ? { ...block, content: removeSourceListRules(block.content) }
        : block,
    )
    return next({ ...e, message: { ...e.message, content } })
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
