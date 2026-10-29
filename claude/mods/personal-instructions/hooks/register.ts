import type { PromptComposeSection, Register } from 'claude-code'

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
const patchedTools = new Set(['Agent', 'Bash', 'PowerShell', 'Grep', 'WebFetch', 'WebSearch', 'DesignSync'])

export function patchDescription(description: string, specification: string): string {
  let text = description.replace(/\r\n/g, '\n')
  const patches = specification.replace(/\r\n/g, '\n')
  if (patches.startsWith('remove-example-blocks: true\n')) {
    text = text.replace(/<example>[\s\S]*?<\/example>\s*/g, '')
  }
  for (const match of patches.matchAll(/<find>\n([\s\S]*?)\n<\/find>\n<replace>\n([\s\S]*?)\n<\/replace>/g)) {
    const [ , find, replacement ] = match
    if (find && replacement !== undefined) text = text.split(find).join(replacement)
  }
  return text
}

export const register: Register = on => {
  on('prompt.section', { name: 'communication' }, () => ({ text: null }))
  on('prompt.section', { name: 'heron_brook' }, () => ({ text: null }))
  on('prompt.attachment', { type: 'language' }, () => ({ text: null }))
  on('prompt.attachment', { type: 'output_style_instructions' }, () => ({ text: null }))
  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    const sections: PromptComposeSection[] = []
    for (const section of result.sections) {
      if (removedSections.has(section.id)) continue
      const file = sectionFiles[section.id]
      sections.push(file
        ? { ...section, text: await $.fs.read(`${$.plugin.root}/rules/${file}.md`), scope: 'session' }
        : section)
    }
    const style = await $.fs.read(`${$.plugin.root}/../../output-styles/concise-personal.md`)
    const styleText = style.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim()
    return { ...result, sections: [
      ...sections.filter(s => s.scope === 'shared'),
      ...sections.filter(s => s.scope === 'session'),
      { id: 'response_style', text: styleText, scope: 'session' }
    ] }
  })
  on('tool.describe', async ($, e, next) => {
    const result = await next(e)
    if (!patchedTools.has(e.tool) || e.provider.plugin !== 'engine') return result
    const specification = await $.fs.read(`${$.plugin.root}/tool-patches/${e.tool}.md`)
    return { ...result, description: patchDescription(result.description, specification) }
  })
}
