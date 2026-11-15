import type { EngineInterface, InstructionFile, Register } from 'claude-code'

const PROJECT_KINDS: readonly InstructionFile['kind'][] = ['project', 'local', 'memory']

const DEFERRED_TOOLS = ['Artifact', 'Workflow', 'ScheduleWakeup', 'ReportFindings', 'ListAgents']

const readRules = async ($: EngineInterface): Promise<InstructionFile[]> => {
  const folder = `${$.plugin.root}/instructions`
  const names = (await $.fs.list(folder))
    .filter(entry => entry.kind === 'file' && entry.name.endsWith('.md'))
    .map(entry => entry.name)
    .sort()
  return Promise.all(
    names.map(async name => {
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

export const register: Register = on => {
  on('prompt.context', async ($, e, next) => {
    if (e.instructionFiles === undefined) return next(e)
    return next({ ...e, instructionFiles: withRules(e.instructionFiles, await readRules($)) })
  })

  on('tool.describe', { tool: DEFERRED_TOOLS }, async (_, e, next) => ({ ...(await next(e)), isDeferred: true }))
}
