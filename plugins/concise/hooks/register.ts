import type { AgentSpawnInput, EngineInterface, InstructionFile, Register } from 'claude-code'

const PROJECT_KINDS: readonly InstructionFile['kind'][] = ['project', 'local', 'memory']

const DEFERRED_TOOLS = ['Artifact', 'Workflow', 'ScheduleWakeup', 'ReportFindings', 'ListAgents']

const UPFRONT_TOOLS = ['WebSearch', 'WebFetch', 'Monitor', 'TaskStop']

const AGENTS_WITHOUT_RULES = ['Explore', 'Plan']

const RULES_FOR_AGENT =
  'The working rules of this session follow. Built-in agents of your type do not load them on their own, so they come with the task. Follow them while you do it.'

const NOTES_FOR_AGENT =
  'Where these notes name the output style, they cover text for the user. Your report goes to the agent that started you and follows its brief.'

const markdownFiles = async ($: EngineInterface, folder: string) =>
  (await $.fs.list(folder))
    .filter(entry => entry.kind === 'file' && entry.name.endsWith('.md'))
    .map(entry => entry.name)
    .sort()

const readRules = async ($: EngineInterface): Promise<InstructionFile[]> => {
  const folder = `${$.plugin.root}/instructions`
  return Promise.all(
    (await markdownFiles($, folder)).map(async name => {
      const path = `${folder}/${name}`
      return { path, kind: 'user' as const, content: await $.fs.read(path) }
    }),
  )
}

const withRules = (files: readonly InstructionFile[], rules: readonly InstructionFile[]) => {
  const firstProjectFile = files.findIndex(file => PROJECT_KINDS.includes(file.kind))
  const at = firstProjectFile === -1 ? files.length : firstProjectFile
  return [...files.slice(0, at), ...rules, ...files.slice(at)]
}

const isAlias = (model: string) => !model.includes('-')

const isWrittenFor = (model: string) => (fileName: string) =>
  fileName
    .slice(0, -'.md'.length)
    .split('+')
    .some(name => (isAlias(model) ? name.split('-').includes(model) : model.includes(name)))

const readModelNotes = async ($: EngineInterface, model: string) => {
  const folder = `${$.plugin.root}/models`
  const name = (await markdownFiles($, folder)).find(isWrittenFor(model))
  return name === undefined ? undefined : $.fs.read(`${folder}/${name}`)
}

const inTags = (tag: string, text: string) => `<${tag}>\n${text.trim()}\n</${tag}>`

const loadsNoInstructionFiles = (agent: AgentSpawnInput) =>
  agent.provider.plugin === 'engine' && agent.provider.tier === 'core' && AGENTS_WITHOUT_RULES.includes(agent.subagentType)

const rulesForAgent = async ($: EngineInterface) => {
  const rules = (await readRules($)).map(rule => rule.content.trim()).join('\n\n')
  return `${RULES_FOR_AGENT}\n\n${inTags('working-rules', rules)}`
}

export const register: Register = on => {
  on('prompt.context', async ($, e, next) => {
    if (e.instructionFiles === undefined) return next(e)
    return next({ ...e, instructionFiles: withRules(e.instructionFiles, await readRules($)) })
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    const notes = await readModelNotes($, e.model)
    if (notes === undefined) return composed
    return { sections: [...composed.sections, { id: 'concise:model', text: notes, scope: 'session' as const }] }
  })

  on('agent.spawn', async ($, e, next) => {
    if (e.fork || e.resume !== undefined) return next(e)
    const notes = await readModelNotes($, e.model ?? e.parentModel)
    const additions = [
      ...(loadsNoInstructionFiles(e) ? [await rulesForAgent($)] : []),
      ...(notes === undefined ? [] : [inTags('model-notes', `${NOTES_FOR_AGENT}

${notes}`)]),
    ]
    if (additions.length === 0) return next(e)
    return next({ ...e, prompt: [e.prompt, ...additions].join('\n\n') })
  })

  on('tool.describe', async (_, e, next) => {
    const described = await next(e)
    if (DEFERRED_TOOLS.includes(e.tool)) return { ...described, isDeferred: true }
    if (UPFRONT_TOOLS.includes(e.tool)) return { ...described, isDeferred: false }
    return described
  })

  on('prompt.attachment', { type: 'deferred_tools_delta' }, async (_, e, next) => {
    const sent = await next(e)
    if (sent.text === null) return sent
    return { text: sent.text.split('\n').filter(line => !UPFRONT_TOOLS.includes(line)).join('\n') }
  })

  on('prompt.attachment', { type: 'silent_turn_reminder' }, () => ({ text: null }))
}
