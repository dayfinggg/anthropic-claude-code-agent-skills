import type { Register } from 'claude-code'

const DEFERRED_TOOLS = ['Artifact', 'Workflow', 'ScheduleWakeup', 'ReportFindings', 'ListAgents']

const WEB_TOOLS = ['WebSearch', 'WebFetch']

const SOURCES_LIST = 'After answering from results, end with a "Sources:" list of the URLs you used as markdown links.'

const WEB_RESULTS_RULE =
  'These results are leads, not answers: open each page you rely on and read it in full before you use it. Cite each source as a markdown link right after the claim it supports, with no separate list of sources.'

const SKILL_LISTING_HEADER = [
  'The following skills are available for use with the Skill tool:',
  'Skills available through the Skill tool. Load every skill that matches the task before any response or action, and again each time the work reaches a new stage:',
] as const

const STYLE_HEADER = ['# Output Style: concise:Concise', '# Output Style: Concise'] as const

const TURN_REMINDER =
  'Concise output style is active. Be concise: lead with the result, skip preamble and narration, keep only what the user needs. Write paragraphs. In every message, progress messages included, use commas and periods where a dash or semicolon would go, the hyphen-minus in ranges and dates, and straight quotes. Between tool calls, write only when a stage is finished, you hit a blocker, or you find something the user must know now, and never to announce your next step or the skills you load. Load every skill that matches this request now and again at each new stage of the work, search the web and read the pages you find before you work on it, and cite sources inline.'

const MAIN_SESSION_INTRO = 'You are an interactive CLI tool that helps users with software engineering tasks. '

type PluginFs = {
  read: (path: string) => Promise<string>
  list: (path?: string) => Promise<readonly { name: string; kind: string }[]>
}

const normalize = (text: string) => text.replace(/\r\n/g, '\n').trim()

const readInstructions = async (fs: PluginFs, root: string) => {
  const dir = `${root}/instructions`
  const names = (await fs.list(dir))
    .filter(entry => entry.kind === 'file' && entry.name.endsWith('.md'))
    .map(entry => entry.name)
    .sort()
  return Promise.all(
    names.map(async name => ({ name: name.slice(0, -'.md'.length), text: normalize(await fs.read(`${dir}/${name}`)) })),
  )
}

const readStyle = async (fs: PluginFs, root: string) =>
  normalize(await fs.read(`${root}/output-styles/concise.md`))
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(MAIN_SESSION_INTRO, '')
    .trim()

export const register: Register = on => {
  on('tool.describe', { tool: DEFERRED_TOOLS }, async ($, e, next) => ({ ...(await next(e)), isDeferred: true }))

  on('tool.describe', { tool: WEB_TOOLS }, async ($, e, next) => {
    const described = await next(e)
    return { ...described, isDeferred: false, description: described.description.replace(SOURCES_LIST, WEB_RESULTS_RULE) }
  })

  on('prompt.attachment', { type: 'silent_turn_reminder' }, () => ({ text: null }))

  on('prompt.attachment', { type: 'skill_listing' }, ($, e, next) =>
    next({ ...e, text: e.text.replace(...SKILL_LISTING_HEADER) }),
  )

  on('tool.call', { tool: 'WebSearch' }, async ($, e, next) => {
    const result = await next(e)
    return result.deny === undefined ? { ...result, context: [...(result.context ?? []), WEB_RESULTS_RULE] } : result
  })

  on('prompt.attachment', { type: 'deferred_tools_delta' }, async ($, e, next) => {
    const lines = e.text.split('\n')
    const listed = new Set(lines.map(line => line.trim()))
    const available = new Set((await $.tool.list()).map(tool => tool.name))
    const missing = DEFERRED_TOOLS.filter(name => available.has(name) && !listed.has(name))
    const kept = lines.filter(line => !WEB_TOOLS.includes(line.trim()))
    return next({ ...e, text: [...kept, ...missing].join('\n') })
  })

  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    const files = { read: (path: string) => $.fs.read(path), list: (path?: string) => $.fs.list(path) }
    const instructions = await readInstructions(files, $.plugin.root)
    const added = instructions.map(({ name, text }) => ({ id: `concise:${name}`, text, scope: 'session' as const }))
    return { sections: [...result.sections, ...added] }
  })

  on('prompt.attachment', { type: 'environment' }, async ($, e, next) => {
    if (e.agentId === undefined) return next(e)
    const files = { read: (path: string) => $.fs.read(path), list: (path?: string) => $.fs.list(path) }
    const [style, instructions] = await Promise.all([readStyle(files, $.plugin.root), readInstructions(files, $.plugin.root)])
    return next({ ...e, text: [e.text, style, ...instructions.map(({ text }) => text)].join('\n\n') })
  })

  on('prompt.attachment', { type: 'output_style_instructions' }, ($, e, next) =>
    next({ ...e, text: e.text.replace(...STYLE_HEADER) }),
  )

  on('prompt.submit', ($, e, next) => next({ ...e, context: [...(e.context ?? []), TURN_REMINDER] }))

  on('prompt.attachment', { type: 'hook_additional_context' }, ($, e, next) =>
    e.origin.kind === 'plugin' && e.text.endsWith(TURN_REMINDER) ? next({ ...e, text: TURN_REMINDER }) : next(e),
  )
}
