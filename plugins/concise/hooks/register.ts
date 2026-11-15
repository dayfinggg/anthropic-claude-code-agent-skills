import type { EngineInterface, InstructionFile, Register } from 'claude-code'

const PROJECT_KINDS: readonly InstructionFile['kind'][] = ['project', 'local', 'memory']

const DEFERRED_TOOLS = ['Artifact', 'Workflow', 'ScheduleWakeup', 'ReportFindings', 'ListAgents']

const WEB_TOOLS = ['WebSearch', 'WebFetch']

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

const isWrittenFor = (model: string) => (fileName: string) =>
  fileName
    .slice(0, -'.md'.length)
    .split('+')
    .some(name => model.includes(name))

const readModelNotes = async ($: EngineInterface, model: string) => {
  const folder = `${$.plugin.root}/models`
  const name = (await markdownFiles($, folder)).find(isWrittenFor(model))
  return name === undefined ? undefined : $.fs.read(`${folder}/${name}`)
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

  on('tool.describe', async (_, e, next) => {
    const described = await next(e)
    if (DEFERRED_TOOLS.includes(e.tool)) return { ...described, isDeferred: true }
    if (WEB_TOOLS.includes(e.tool)) return { ...described, isDeferred: false }
    return described
  })

  on('prompt.attachment', { type: 'deferred_tools_delta' }, async (_, e, next) => {
    const sent = await next(e)
    if (sent.text === null) return sent
    return { text: sent.text.split('\n').filter(line => !WEB_TOOLS.includes(line)).join('\n') }
  })

  on('prompt.attachment', { type: 'silent_turn_reminder' }, () => ({ text: null }))
}
