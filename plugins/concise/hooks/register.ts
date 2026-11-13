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
  'Concise output style is active. Be concise: lead with the result, skip preamble and narration, keep only what the user needs. Write paragraphs. In every message, progress messages included, use commas and periods where a dash or semicolon would go, the hyphen-minus in ranges and dates, and straight quotes. Between tool calls, write only when a stage is finished, you hit a blocker, or you find something the user must know now, always in the same message as your next tool call, and never to announce your next step or the skills you load. Load every skill that matches this request now and again at each new stage of the work, search the web and read the pages you find before you work on it, and cite sources inline.'

const LONG_CONTEXT_STEP = 100_000

const LONG_CONTEXT_REMINDER =
  'This conversation is long now, and instructions from its start lose weight as it grows. Before your next message or step, go back over the Output Style section and the rest of your system prompt, and the skills you have loaded. They are still in your context, so recall them there without reading any file, and follow them from here on as closely as at the start of the session.'

const COMPACTED_REMINDER =
  "The conversation was just compacted, so earlier messages are now a summary and loaded skills may be cut short. Before your next step, check the summary for the user's requests and every constraint they gave, load the skills the current stage needs again, and read the reference files that fit the task again."

const COMPACT_INSTRUCTIONS =
  'Keep, stated exactly: everything the user asked for, decided, agreed, ruled out, or set as a preference, constraint or boundary. Keep exactly where the work stands: what is done and verified, what is done but not verified, and what is still open, promised or expected next, with the files, commits, hosts and commands involved.'

const PLUGIN_CONTEXT = [TURN_REMINDER, WEB_RESULTS_RULE, LONG_CONTEXT_REMINDER, COMPACTED_REMINDER]

let nextLongContextReminder = LONG_CONTEXT_STEP

let lastContextTokens = 0

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

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    if (result.deny !== undefined || e.agentId !== undefined) return result
    const tokens = (await $.session.usage()).context.tokens ?? 0
    const nextStep = (Math.floor(tokens / LONG_CONTEXT_STEP) + 1) * LONG_CONTEXT_STEP
    const wasCompacted = tokens > 0 && tokens < lastContextTokens / 2
    lastContextTokens = tokens
    if (wasCompacted) {
      nextLongContextReminder = nextStep
      return { ...result, context: [...(result.context ?? []), COMPACTED_REMINDER] }
    }
    if (tokens < nextLongContextReminder) {
      nextLongContextReminder = Math.min(nextLongContextReminder, nextStep)
      return result
    }
    nextLongContextReminder = nextStep
    return { ...result, context: [...(result.context ?? []), LONG_CONTEXT_REMINDER] }
  })

  on('session.compact', ($, e, next) =>
    e.agentId === undefined
      ? next({ ...e, instructions: [e.instructions, COMPACT_INSTRUCTIONS].filter(text => text !== undefined && text !== '').join('\n\n') })
      : next(e),
  )

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

  on('prompt.attachment', { type: 'hook_additional_context' }, ($, e, next) => {
    const own = e.origin.kind === 'plugin' ? PLUGIN_CONTEXT.find(text => e.text.endsWith(text)) : undefined
    return next(own === undefined ? e : { ...e, text: own })
  })
}
