import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const SESSION = { cwd: '/', surface: null, isInteractive: false } as const
const WRITE_CALL = { tool: 'Write', file_path: '/fixture.txt', content: 'content' } as const
const WRITE_RESULT = { type: 'create' as const, filePath: '/fixture.txt', content: 'content', structuredPatch: [], originalFile: null }
const TASK_CALL = { tool: 'TaskUpdate', taskId: 'phase', status: 'completed' } as const
const TASK_RESULT = { success: true, taskId: 'phase', updatedFields: ['status'], statusChange: { from: 'in_progress', to: 'completed' } }
const WORKFLOW_OPTIONS = {
  file: 'instructions/continue.md',
  planTools: ['TaskUpdate', 'TodoWrite'],
  minCallsBetween: 3,
  longCallMs: 60000,
  longCallLimit: 2,
}
const OPTIONS = {
  discoveryTool: 'Discovery',
  deferredTools: ['Optional', 'Discovery'],
  deferredPrefixes: ['external__'],
}
const SKILL_OPTIONS = {
  skillReminder: { file: 'instructions/skill.md', editTools: ['Write', 'Edit'], filePattern: '\\.(?:ts|py)$' },
}
const SKILL_CALL = { tool: 'Skill', skill: 'coding' } as const
const CODE_WRITE = { tool: 'Write', file_path: '/src/app.ts', content: 'export {}' } as const
const CLEANUP_OPTIONS = {
  temporaryFileCheck: { file: 'instructions/cleanup.md', pathPatterns: ['^/tmp/'] },
}
const STOP = { stop_hook_active: false } as const
const NUDGE = '[Your previous response had no visible output. Please continue and produce a user-visible response.]'
const NARRATION_OPTIONS = {
  narrationReminder: { file: 'instructions/narration.md', closingTools: ['WrapUp'], limit: 2 },
}
const READ_CALL = { tool: 'Read', file_path: '/docs/architecture.md' } as const
const STEP = { turnId: 'main', index: 0, model: 'example', messageCount: 1 } as const

async function runStep(stream: AsyncGenerator<unknown, unknown>) {
  for (let item = await stream.next(); !item.done; item = await stream.next()) continue
}

function stepResult(answer: string, tools: readonly string[]) {
  return { turnId: 'main', index: 0, answer, toolUses: tools.map(name => ({ name, input: {} })), stopReason: 'tool_use' as const, usage: null }
}

const NUDGE_OPTIONS = {
  emptyTurnNudge: { pattern: '^\\[Your previous response had no visible output\\.', file: 'instructions/waiting.md' },
}
const AGENT = { id: 'a1', description: 'Rewrite docs', type: 'general-purpose', status: 'running' as const }

function nudgeRow(text: string = NUDGE, door: 'note' | 'delivery' = 'note') {
  return {
    door,
    origin: { kind: 'unclassified' as const },
    uuid: `row-${text.length}-${door}`,
    message: { type: 'user' as const, role: 'user' as const, isMeta: true as const, content: [{ type: 'text' as const, text }] },
  }
}

const REMOVAL_OPTIONS = {
  removedPromptSections: ['presentation'],
  removedInstructionPatterns: [
    '<presentation>[\\s\\S]*?</presentation>\\n?',
    '\\nRender a trailing bibliography\\.',
  ],
}

function stubConfiguration(on: On, configuration: Record<string, unknown> = {}, files: Record<string, string> = {}) {
  const contents: Record<string, string> = { 'config.json': JSON.stringify({
    discoveryTool: '',
    promptSectionFiles: {},
    upfrontTools: [],
    removedAttachmentPatterns: {},
    deferredTools: [],
    deferredPrefixes: [],
    removedPromptSections: [],
    removedInstructionPatterns: [],
    ...configuration,
  }), ...files }
  on('fs.read', ($, event) => {
    const text = contents[event.path.replace(/\\/g, '/').split('/').at(-1)!]
    if (text === undefined) throw new Error(`Unexpected fixture path ${event.path}`)
    return { value: text }
  })
}

function stubStartup(on: On, tools = [{ name: 'Discovery', description: 'Discover tools.', mcp: false }], configuration: Record<string, unknown> = OPTIONS) {
  stubConfiguration(on, configuration)
  on('tool.list', () => ({ value: tools }))
  on('ui.invalidate', () => ({ value: undefined }))
  on('session.start', ($, event) => ({ cwd: event.cwd }))
}

test('defers a configured tool without changing its description', async ($, on) => {
  stubStartup(on)
  on('tool.describe', () => ({ description: 'Original instructions.' }))
  await $.session.start(SESSION)
  const result = await $.tool.describe({
    tool: 'Optional',
    description: 'Original instructions.',
    provider: { plugin: 'engine', tier: 'core' },
  })
  expect(result).toEqual({ description: 'Original instructions.', isDeferred: true })
})

test('keeps the configured discovery tool upfront', async ($, on) => {
  stubStartup(on)
  on('tool.describe', () => ({ description: 'Discover tools.' }))
  await $.session.start(SESSION)
  const result = await $.tool.describe({
    tool: 'Discovery',
    description: 'Discover tools.',
    provider: { plugin: 'engine', tier: 'core' },
  })
  expect(result).toEqual({ description: 'Discover tools.' })
})

test('preserves unconfigured tools', async ($, on) => {
  stubStartup(on)
  on('tool.describe', () => ({ description: 'Unchanged operation.' }))
  await $.session.start(SESSION)
  const result = await $.tool.describe({
    tool: 'Unconfigured',
    description: 'Unchanged operation.',
    provider: { plugin: 'engine', tier: 'core' },
  })
  expect(result).toEqual({ description: 'Unchanged operation.' })
})

test('preserves existing deferral', async ($, on) => {
  stubStartup(on)
  on('tool.describe', () => ({ description: 'Already deferred.', isDeferred: true }))
  await $.session.start(SESSION)
  const result = await $.tool.describe({
    tool: 'Unconfigured',
    description: 'Already deferred.',
    isDeferred: true,
    provider: { plugin: 'engine', tier: 'core' },
  })
  expect(result).toEqual({ description: 'Already deferred.', isDeferred: true })
})

test('preserves placement when discovery is unavailable', async ($, on) => {
  stubStartup(on, [])
  on('tool.describe', () => ({ description: 'Original placement.' }))
  await $.session.start(SESSION)
  const result = await $.tool.describe({
    tool: 'Optional',
    description: 'Original placement.',
    provider: { plugin: 'engine', tier: 'core' },
  })
  expect(result).toEqual({ description: 'Original placement.' })
})

test('defers a configured prefix without depending on a server name', async ($, on) => {
  stubStartup(on)
  on('tool.describe', () => ({ description: 'External operation.' }))
  await $.session.start(SESSION)
  const result = await $.tool.describe({
    tool: 'external__operation',
    description: 'External operation.',
    provider: { plugin: 'external', tier: 'user' },
  })
  expect(result).toEqual({ description: 'External operation.', isDeferred: true })
})

test('leaves placement unchanged without configuration', async ($, on) => {
  stubStartup(on, undefined, {})
  on('tool.describe', () => ({ description: 'Default placement.' }))
  await $.session.start(SESSION)
  const result = await $.tool.describe({
    tool: 'Optional',
    description: 'Default placement.',
    provider: { plugin: 'engine', tier: 'core' },
  })
  expect(result).toEqual({ description: 'Default placement.' })
})

test('defers a configured shell when the session runs from a Windows path', async ($, on) => {
  stubStartup(on, undefined, { ...OPTIONS, windowsDeferredTools: ['PosixShell'] })
  on('tool.describe', () => ({ description: 'POSIX shell.' }))
  await $.session.start({ ...SESSION, cwd: 'C:\\work' })
  const result = await $.tool.describe({
    tool: 'PosixShell',
    description: 'POSIX shell.',
    provider: { plugin: 'engine', tier: 'core' },
  })
  expect(result).toEqual({ description: 'POSIX shell.', isDeferred: true })
})

test('keeps a Windows-only deferral away from POSIX working directories', async ($, on) => {
  stubStartup(on, undefined, { ...OPTIONS, windowsDeferredTools: ['PosixShell'] })
  on('tool.describe', () => ({ description: 'POSIX shell.' }))
  await $.session.start({ ...SESSION, cwd: '/srv/app' })
  const result = await $.tool.describe({
    tool: 'PosixShell',
    description: 'POSIX shell.',
    provider: { plugin: 'engine', tier: 'core' },
  })
  expect(result).toEqual({ description: 'POSIX shell.' })
})

test('reminds once per turn when code changes before any skill loads', async ($, on) => {
  stubConfiguration(on, SKILL_OPTIONS, { 'skill.md': 'Load the governing skill.' })
  on('tool.call', () => ({ result: WRITE_RESULT }))
  on('turn.start', ($, event) => ({ turnId: event.turnId }))
  on('session.messages', () => ({ value: [] }))

  expect((await $.tool.call({ ...CODE_WRITE, file_path: '/notes.md' })).context).toBeUndefined()
  expect((await $.tool.call(CODE_WRITE)).context).toEqual(['Load the governing skill.'])
  expect((await $.tool.call(CODE_WRITE)).context).toBeUndefined()
  await $.turn.start({ text: 'Next task.', turnId: 'next' })
  expect((await $.tool.call(CODE_WRITE)).context).toEqual(['Load the governing skill.'])
})

test('stays quiet after a skill loads and tracks each agent separately', async ($, on) => {
  stubConfiguration(on, SKILL_OPTIONS, { 'skill.md': 'Load the governing skill.' })
  on('tool.call', () => ({ result: WRITE_RESULT }))
  on('turn.start', ($, event) => ({ turnId: event.turnId }))

  await $.tool.call(SKILL_CALL)
  expect((await $.tool.call(CODE_WRITE)).context).toBeUndefined()
  await $.turn.start({ text: 'Next task.', turnId: 'next' })
  expect((await $.tool.call(CODE_WRITE)).context).toBeUndefined()
  expect((await $.tool.call({ ...CODE_WRITE, agentId: 'child' })).context).toEqual(['Load the governing skill.'])
})

test('does not count a failed skill call as a loaded skill', async ($, on) => {
  stubConfiguration(on, SKILL_OPTIONS, { 'skill.md': 'Load the governing skill.' })
  on('tool.call', ($, event) => event.tool === 'Skill'
    ? { result: 'Unknown skill.', text: 'Unknown skill.', isError: true }
    : { result: WRITE_RESULT })
  on('session.messages', () => ({ value: [] }))

  await $.tool.call(SKILL_CALL)
  expect((await $.tool.call(CODE_WRITE)).context).toEqual(['Load the governing skill.'])
})

test('trusts a skill call already in the transcript after the mod reloads', async ($, on) => {
  stubConfiguration(on, SKILL_OPTIONS, { 'skill.md': 'Load the governing skill.' })
  on('tool.call', () => ({ result: WRITE_RESULT }))
  on('session.messages', () => ({ value: [
    { role: 'assistant' as const, text: '', toolUses: [{ tool_use_id: 't1', tool: 'Skill', input: { skill: 'coding' } }] },
  ] }))

  expect((await $.tool.call(CODE_WRITE)).context).toBeUndefined()
})

test('blocks the first stop while temporary files written this turn remain', async ($, on) => {
  stubConfiguration(on, CLEANUP_OPTIONS, { 'cleanup.md': 'Remove these temporary files.' })
  const existing = new Set(['/tmp/probe.py', '/tmp/kept.txt', '/work/report.md'])
  on('fs.exists', ($, event) => ({ value: existing.has(event.path.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')) }))
  on('tool.call', ($, event) => {
    const filePath = event.tool === 'Write' ? event.file_path : ''
    return { result: { ...WRITE_RESULT, filePath, type: filePath === '/tmp/kept.txt' ? 'update' as const : 'create' as const } }
  })
  on('classic.Stop', () => ({}))

  await $.tool.call({ ...WRITE_CALL, file_path: '/tmp/probe.py' })
  await $.tool.call({ ...WRITE_CALL, file_path: '/tmp/kept.txt' })
  await $.tool.call({ ...WRITE_CALL, file_path: '/work/report.md' })

  expect(await $.classic.Stop(STOP)).toEqual({ block: 'Remove these temporary files.\n/tmp/probe.py' })
  expect(await $.classic.Stop({ stop_hook_active: true })).toEqual({})
  existing.delete('/tmp/probe.py')
  expect(await $.classic.Stop(STOP)).toEqual({})
})

test('lets the turn stop while background work still uses temporary files', async ($, on) => {
  stubConfiguration(on, CLEANUP_OPTIONS, { 'cleanup.md': 'Remove these temporary files.' })
  on('fs.exists', () => ({ value: true }))
  on('tool.call', () => ({ result: WRITE_RESULT }))
  on('classic.Stop', () => ({}))

  await $.tool.call({ ...WRITE_CALL, file_path: '/tmp/server.py' })
  const running = [{ id: 'b1', type: 'shell', status: 'running', description: 'Preview server' }]

  expect(await $.classic.Stop({ ...STOP, background_tasks: running })).toEqual({})
})

test('forgets temporary files from an earlier turn', async ($, on) => {
  stubConfiguration(on, CLEANUP_OPTIONS, { 'cleanup.md': 'Remove these temporary files.' })
  on('fs.exists', () => ({ value: true }))
  on('tool.call', () => ({ result: WRITE_RESULT }))
  on('classic.Stop', () => ({}))
  on('turn.start', ($, event) => ({ turnId: event.turnId }))

  await $.tool.call({ ...WRITE_CALL, file_path: '/tmp/data.json' })
  await $.turn.start({ text: 'Use the data in the next step.', turnId: 'next' })

  expect(await $.classic.Stop(STOP)).toEqual({})
})

test('reminds once after a main-loop step that put text before a tool call', async ($, on) => {
  stubConfiguration(on, NARRATION_OPTIONS, { 'narration.md': 'Send tool calls without text.' })
  let step = stepResult('Now my own part.', ['Read', 'Read'])
  on('turn.step', async function* () { return step })
  on('tool.call', () => ({ result: 'File content.' }))

  await runStep($.turn.step(STEP))
  expect((await $.tool.call(READ_CALL)).context).toEqual(['Send tool calls without text.'])
  expect((await $.tool.call(READ_CALL)).context).toBeUndefined()
  step = stepResult('', ['Read'])
  await runStep($.turn.step(STEP))
  expect((await $.tool.call(READ_CALL)).context).toBeUndefined()
})

test('stays quiet for a final answer and for text before a closing tool', async ($, on) => {
  stubConfiguration(on, NARRATION_OPTIONS, { 'narration.md': 'Send tool calls without text.' })
  let step = stepResult('The parser accepts comments now.', ['WrapUp'])
  on('turn.step', async function* () { return step })
  on('tool.call', () => ({ result: 'Done.' }))

  await runStep($.turn.step(STEP))
  expect((await $.tool.call(READ_CALL)).context).toBeUndefined()
  step = stepResult('The parser accepts comments now.', [])
  await runStep($.turn.step(STEP))
  expect((await $.tool.call(READ_CALL)).context).toBeUndefined()
})

test('ignores text in a subagent loop and caps reminders per turn', async ($, on) => {
  stubConfiguration(on, NARRATION_OPTIONS, { 'narration.md': 'Send tool calls without text.' })
  on('turn.step', async function* () { return stepResult('Checking the file.', ['Read']) })
  on('tool.call', () => ({ result: 'File content.' }))
  on('turn.start', ($, event) => ({ turnId: event.turnId }))

  await runStep($.turn.step({ ...STEP, agentId: 'child' }))
  expect((await $.tool.call({ ...READ_CALL, agentId: 'child' })).context).toBeUndefined()
  const contexts = []
  for (let index = 0; index < 3; index += 1) {
    await runStep($.turn.step(STEP))
    contexts.push((await $.tool.call(READ_CALL)).context)
  }
  expect(contexts).toEqual([['Send tool calls without text.'], ['Send tool calls without text.'], undefined])
  await $.turn.start({ text: 'Next task.', turnId: 'next' })
  await runStep($.turn.step(STEP))
  expect((await $.tool.call(READ_CALL)).context).toEqual(['Send tool calls without text.'])
})

test('adds a Windows-only description reminder only on a Windows host', async ($, on) => {
  stubConfiguration(on, { ...OPTIONS, windowsToolDescriptionReminders: { PosixShell: 'instructions/bash.md' } },
    { 'bash.md': 'Use PowerShell for local commands.' })
  on('tool.list', () => ({ value: [{ name: 'Discovery', description: 'Discover tools.', mcp: false }] }))
  on('ui.invalidate', () => ({ value: undefined }))
  on('session.start', ($, event) => ({ cwd: event.cwd }))
  on('tool.describe', () => ({ description: 'POSIX shell.' }))
  const describe = () => $.tool.describe({ tool: 'PosixShell', description: 'POSIX shell.', provider: { plugin: 'engine', tier: 'core' } })

  await $.session.start({ ...SESSION, cwd: '/srv/app' })
  expect((await describe()).description).toBe('POSIX shell.')
  await $.session.start({ ...SESSION, cwd: 'D:\\work' })
  expect((await describe()).description).toBe('POSIX shell.\n\nUse PowerShell for local commands.')
})

test('appends the agent rules to a new subagent brief but not to forks or resumed agents', async ($, on) => {
  stubConfiguration(on, { agentRules: 'instructions/agent-rules.md' }, { 'agent-rules.md': 'Load matching skills first.' })
  const prompts: string[] = []
  on('agent.spawn', ($, event) => {
    prompts.push(event.prompt)
    return { model: 'example', agentId: `a${prompts.length}` }
  })
  const spawn = {
    tool_use_id: 't1', prompt: 'Rewrite docs/web.md in English.', description: 'Rewrite web doc', subagentType: 'general-purpose',
    provider: { plugin: 'engine', tier: 'core' as const }, parentModel: 'example', background: true, fork: false,
  }

  await $.agent.spawn(spawn)
  await $.agent.spawn({ ...spawn, fork: true })
  await $.agent.spawn({ ...spawn, prompt: 'Continue.', resume: { agentId: 'a1' } })

  expect(prompts).toEqual(['Rewrite docs/web.md in English.\n\nLoad matching skills first.', 'Rewrite docs/web.md in English.', 'Continue.'])
})

test('turns the empty-turn nudge into a wait instruction while a main-loop agent runs', async ($, on) => {
  stubConfiguration(on, NUDGE_OPTIONS, { 'waiting.md': 'Keep waiting without text.' })
  on('agent.list', () => ({ value: [AGENT] }))

  const stored = await $.session.append(nudgeRow())

  expect(stored.message?.content).toEqual([{ type: 'text', text: 'Keep waiting without text.' }])
})

test('passes the nudge through when only finished or nested agents exist', async ($, on) => {
  stubConfiguration(on, NUDGE_OPTIONS, { 'waiting.md': 'Keep waiting without text.' })
  on('agent.list', () => ({ value: [{ ...AGENT, status: 'completed' as const }, { ...AGENT, id: 'a2', parentId: 'a1' }] }))

  const stored = await $.session.append(nudgeRow())

  expect(stored.message?.content).toEqual([{ type: 'text', text: NUDGE }])
})

test('treats a background command as running until its completion notice arrives', async ($, on) => {
  stubConfiguration(on, NUDGE_OPTIONS, { 'waiting.md': 'Keep waiting without text.' })
  on('agent.list', () => ({ value: [] }))
  on('tool.call', () => ({ result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'b7' } }))

  await $.tool.call({ tool: 'Bash', command: 'npm test', run_in_background: true })
  expect((await $.session.append(nudgeRow())).message?.content).toEqual([{ type: 'text', text: 'Keep waiting without text.' }])
  await $.session.append(nudgeRow('<task-notification>\n<task-id>b7</task-id>\n<status>completed</status>\n</task-notification>', 'delivery'))

  expect((await $.session.append(nudgeRow())).message?.content).toEqual([{ type: 'text', text: NUDGE }])
})

test('leaves other hidden rows and subagent rows unchanged', async ($, on) => {
  stubConfiguration(on, NUDGE_OPTIONS, { 'waiting.md': 'Keep waiting without text.' })
  on('agent.list', () => ({ value: [AGENT] }))

  const other = await $.session.append(nudgeRow('Also check the logs.'))
  const nested = await $.session.append({ ...nudgeRow(), agentId: 'a1' })

  expect(other.message?.content).toEqual([{ type: 'text', text: 'Also check the logs.' }])
  expect(nested.message?.content).toEqual([{ type: 'text', text: NUDGE }])
})

test('preserves prompt sections', async ($, on) => {
  on('prompt.section', ($, event) => ({ text: event.text }))
  const result = await $.prompt.section({ name: 'policy', text: 'Original policy.' })
  expect(result).toEqual({ text: 'Original policy.' })
})

test('removes configured instructions from composed sections without changing tool guidance', async ($, on) => {
  stubConfiguration(on, REMOVAL_OPTIONS)
  on('prompt.compose', () => ({ sections: [
    { id: 'host', text: '<presentation>Announce every action.</presentation>\nRequired tool contract.', scope: 'shared' },
    { id: 'task', text: 'Current task.', scope: 'session' },
  ] }))

  const result = await $.prompt.compose({
    model: 'example',
    promptModel: 'example',
    surfaces: [],
    tools: [],
    outputStyle: null,
    traits: [],
  })

  expect(result).toEqual({ sections: [
    { id: 'host', text: 'Required tool contract.', scope: 'shared' },
    { id: 'task', text: 'Current task.', scope: 'session' },
  ] })
})

test('removes configured tool prose while preserving existing deferral', async ($, on) => {
  stubConfiguration(on, REMOVAL_OPTIONS)
  on('tool.describe', () => ({ description: 'Find exact sources.\nRender a trailing bibliography.', isDeferred: true }))

  const result = await $.tool.describe({
    tool: 'Lookup',
    description: 'Find exact sources.\nRender a trailing bibliography.',
    isDeferred: true,
    provider: { plugin: 'external', tier: 'user' },
  })

  expect(result).toEqual({ description: 'Find exact sources.', isDeferred: true })
})

test('omits configured system sections before they are wrapped or joined', async ($, on) => {
  stubConfiguration(on, REMOVAL_OPTIONS)
  on('prompt.compose', () => ({ sections: [
    { id: 'presentation', text: 'Announce every action.', scope: 'shared' },
    { id: 'policy', text: 'Required safety and tool guidance.', scope: 'shared' },
  ] }))

  const result = await $.prompt.compose({
    model: 'example',
    promptModel: 'example',
    surfaces: [],
    tools: [],
    outputStyle: null,
    traits: [],
  })

  expect(result).toEqual({ sections: [
    { id: 'policy', text: 'Required safety and tool guidance.', scope: 'shared' },
  ] })
})

test('preserves permission decisions', async ($, on) => {
  on('tool.check', () => ({ decision: 'deny', reason: 'Original policy.' }))
  const result = await $.tool.check({ tool: 'Optional', input: {} })
  expect(result.decision).toBe('deny')
})

test('loads plugin configuration once without depending on the test host directory', async ($, on) => {
  let reads = 0
  on('fs.read', ($, event) => {
    expect(/[\\/]config\.json$/.test(event.path)).toBe(true)
    reads += 1
    return { value: JSON.stringify({
      discoveryTool: 'FileDiscovery',
      promptSectionFiles: {},
      upfrontTools: [],
      removedAttachmentPatterns: {},
      deferredTools: ['FileOptional'],
      deferredPrefixes: [],
      removedPromptSections: [],
      removedInstructionPatterns: [],
    }) }
  })
  on('tool.list', () => ({ value: [{ name: 'FileDiscovery', description: 'Discover tools.', mcp: false }] }))
  on('ui.invalidate', () => ({ value: undefined }))
  on('session.start', ($, event) => ({ cwd: event.cwd }))
  on('tool.describe', () => ({ description: 'Original instructions.' }))

  await $.session.start(SESSION)
  const result = await $.tool.describe({
    tool: 'FileOptional',
    description: 'Original instructions.',
    provider: { plugin: 'engine', tier: 'core' },
  })

  expect(result).toEqual({ description: 'Original instructions.', isDeferred: true })
  expect(reads).toBe(1)
})

test('replaces only the configured coding section', async ($, on) => {
  stubConfiguration(on, {
    promptSectionFiles: { engineering: 'instructions/custom.md' },
  }, { 'custom.md': 'Custom coding instructions.' })
  on('prompt.compose', () => ({ sections: [
    { id: 'intro', text: 'Original introduction.', scope: 'shared' },
    { id: 'engineering', text: 'Factory coding instructions.', scope: 'shared' },
    { id: 'safety', text: 'Original safety and permissions.', scope: 'shared' },
    { id: 'task', text: 'Current task.', scope: 'session' },
  ] }))

  const result = await $.prompt.compose({
    model: 'example',
    promptModel: 'example',
    surfaces: [],
    tools: [],
    outputStyle: null,
    traits: [],
  })

  expect(result).toEqual({ sections: [
    { id: 'intro', text: 'Original introduction.', scope: 'shared' },
    { id: 'engineering', text: 'Custom coding instructions.', scope: 'shared' },
    { id: 'safety', text: 'Original safety and permissions.', scope: 'shared' },
    { id: 'task', text: 'Current task.', scope: 'session' },
  ] })
})

test('includes custom coding instructions once when the short prompt omits the default section', async ($, on) => {
  stubConfiguration(on, {
    promptSectionFiles: { engineering: 'instructions/custom.md' },
  }, { 'custom.md': 'Custom coding instructions.' })
  on('prompt.compose', () => ({ sections: [
    { id: 'short', text: 'Original short prompt and safeguards.', scope: 'shared' },
    { id: 'task', text: 'Current task.', scope: 'session' },
  ] }))
  const input = {
    model: 'example',
    promptModel: 'example',
    surfaces: [],
    tools: [],
    outputStyle: null,
    traits: [],
  }

  const first = await $.prompt.compose(input)
  const second = await $.prompt.compose(input)

  const expected = { sections: [
    { id: 'short', text: 'Original short prompt and safeguards.', scope: 'shared' },
    { id: 'task', text: 'Current task.', scope: 'session' },
    { id: 'nova:engineering', text: 'Custom coding instructions.', scope: 'session' },
  ] }
  expect(first).toEqual(expected)
  expect(second).toEqual(expected)
})

test('loads configured instruction files for multiple full-prompt sections', async ($, on) => {
  stubConfiguration(on, { promptSectionFiles: {
    engineering: 'instructions/custom.md',
    operations: 'instructions/operations.md',
  } }, {
    'custom.md': 'Custom coding instructions.',
    'operations.md': 'Custom tool instructions.',
  })
  on('prompt.compose', () => ({ sections: [
    { id: 'engineering', text: 'Factory coding instructions.', scope: 'shared' },
    { id: 'operations', text: 'Factory tool instructions.', scope: 'shared' },
    { id: 'safety', text: 'Original permissions.', scope: 'session' },
  ] }))

  const result = await $.prompt.compose({
    model: 'example', promptModel: 'example', surfaces: [], tools: [], outputStyle: null, traits: [],
  })

  expect(result).toEqual({ sections: [
    { id: 'engineering', text: 'Custom coding instructions.', scope: 'shared' },
    { id: 'operations', text: 'Custom tool instructions.', scope: 'shared' },
    { id: 'safety', text: 'Original permissions.', scope: 'session' },
  ] })
})

test('keeps a configured native shell upfront even when its default is deferred', async ($, on) => {
  stubConfiguration(on, { upfrontTools: ['NativeShell'] })
  on('tool.describe', () => ({ description: 'Native command interpreter.', isDeferred: true }))

  const result = await $.tool.describe({
    tool: 'NativeShell', description: 'Native command interpreter.', isDeferred: true,
    provider: { plugin: 'engine', tier: 'core' },
  })

  expect(result).toEqual({ description: 'Native command interpreter.', isDeferred: false })
})

test('removes only configured mode guidance while preserving permission instructions', async ($, on) => {
  stubConfiguration(on, { removedAttachmentPatterns: { auto_mode: ['Use a script instead of file tools\\.\\n?'] } })
  on('prompt.attachment', ($, event) => ({ text: event.text }))

  const result = await $.prompt.attachment({
    type: 'auto_mode',
    text: 'Mode permissions stay.\nUse a script instead of file tools.\nConfirm destructive actions.',
    origin: { kind: 'engine' },
  })

  expect(result).toEqual({ text: 'Mode permissions stay.\nConfirm destructive actions.' })
})

test('does not filter the same words from unrelated attachments', async ($, on) => {
  stubConfiguration(on, { removedAttachmentPatterns: { auto_mode: ['Use a script instead of file tools\\.'] } })
  on('prompt.attachment', ($, event) => ({ text: event.text }))

  const result = await $.prompt.attachment({
    type: 'file', text: 'Use a script instead of file tools.', origin: { kind: 'engine' },
  })

  expect(result).toEqual({ text: 'Use a script instead of file tools.' })
})

test('preserves an attachment already omitted by another handler', async ($, on) => {
  stubConfiguration(on, { removedAttachmentPatterns: { auto_mode: ['obsolete'] } })
  on('prompt.attachment', () => ({ text: null }))

  const result = await $.prompt.attachment({
    type: 'auto_mode', text: 'obsolete', origin: { kind: 'engine' },
  })

  expect(result).toEqual({ text: null })
})

test('replaces a matching reminder with its configured file', async ($, on) => {
  stubConfiguration(on, {
    attachmentReminders: { style: { pattern: '^Active style', file: 'instructions/brief.md' } },
  }, { 'brief.md': 'Give the result without a tutorial.' })
  on('prompt.attachment', ($, event) => ({ text: event.text }))

  const result = await $.prompt.attachment({
    type: 'style', text: 'Active style reminder.', origin: { kind: 'engine' },
  })

  expect(result).toEqual({ text: 'Give the result without a tutorial.' })
})

test('preserves reminders for another active style', async ($, on) => {
  stubConfiguration(on, {
    attachmentReminders: { style: { pattern: '^Active style', file: 'instructions/brief.md' } },
  }, { 'brief.md': 'Give the result.' })
  on('prompt.attachment', ($, event) => ({ text: event.text }))

  const result = await $.prompt.attachment({
    type: 'style', text: 'Another style reminder.', origin: { kind: 'engine' },
  })

  expect(result).toEqual({ text: 'Another style reminder.' })
})

test('does not restore a suppressed reminder', async ($, on) => {
  stubConfiguration(on, {
    attachmentReminders: { style: { pattern: '.*', file: 'instructions/brief.md' } },
  }, { 'brief.md': 'Give the result.' })
  on('prompt.attachment', () => ({ text: null }))

  const result = await $.prompt.attachment({
    type: 'style', text: 'Active style reminder.', origin: { kind: 'engine' },
  })

  expect(result).toEqual({ text: null })
})

test('adds a bounded reminder without changing tool output or prior context', async ($, on) => {
  stubConfiguration(on, {
    toolReminders: { Write: 'instructions/edit.md' }, toolReminderLimit: 1,
  }, { 'edit.md': 'Review the changed content silently.' })
  const output = { result: WRITE_RESULT, text: 'Saved.', ref: 4, context: ['Prior context.'] }
  on('tool.call', () => output)

  const first = await $.tool.call(WRITE_CALL)
  const second = await $.tool.call(WRITE_CALL)

  expect(first).toEqual({ ...output, context: ['Prior context.', 'Review the changed content silently.'] })
  expect(second).toEqual(output)
  expect(output.context).toEqual(['Prior context.'])
})

test('resets reminder limits for new turns and keeps agent counters separate', async ($, on) => {
  stubConfiguration(on, {
    toolReminders: { Write: 'instructions/edit.md' }, toolReminderLimit: 1,
  }, { 'edit.md': 'Review the change.' })
  on('tool.call', () => ({ result: WRITE_RESULT }))
  on('turn.start', ($, event) => ({ turnId: event.turnId }))

  await $.turn.start({ text: 'First task.', turnId: 'first' })
  expect((await $.tool.call(WRITE_CALL)).context).toEqual(['Review the change.'])
  expect((await $.tool.call(WRITE_CALL)).context).toBeUndefined()
  expect((await $.tool.call({ ...WRITE_CALL, agentId: 'child' })).context).toEqual(['Review the change.'])
  await $.turn.start({ text: 'Next task.', turnId: 'next' })
  expect((await $.tool.call(WRITE_CALL)).context).toEqual(['Review the change.'])
  expect((await $.tool.call({ ...WRITE_CALL, agentId: 'child' })).context).toBeUndefined()
})

test('preserves denied tool calls', async ($, on) => {
  stubConfiguration(on, {
    toolReminders: { Write: 'instructions/edit.md' }, toolReminderLimit: 1,
    workflowReminders: WORKFLOW_OPTIONS,
  }, { 'edit.md': 'Review the change.' })
  on('clock.now', () => ({ value: 0 }))
  on('tool.call', () => ({ deny: 'Permission denied.' }))

  expect(await $.tool.call(WRITE_CALL)).toEqual({ deny: 'Permission denied.' })
})

test('leaves failed tool calls unchanged', async ($, on) => {
  stubConfiguration(on, {
    toolReminders: { Write: 'instructions/edit.md' }, toolReminderLimit: 1,
  }, { 'edit.md': 'Review the change.' })
  on('tool.call', () => ({ result: 'Failed.', text: 'Failed.', isError: true }))

  expect(await $.tool.call(WRITE_CALL)).toEqual({ result: 'Failed.', text: 'Failed.', isError: true })
})

test('leaves a read-only result unchanged', async ($, on) => {
  stubConfiguration(on, {
    toolReminders: { Write: 'instructions/edit.md' }, toolReminderLimit: 1,
  }, { 'edit.md': 'Review the change.' })
  on('tool.call', () => ({ result: WRITE_RESULT, isReadOnly: true }))

  expect(await $.tool.call(WRITE_CALL)).toEqual({ result: WRITE_RESULT })
})

test('puts configured guidance beside a plan tool without changing its placement', async ($, on) => {
  stubConfiguration(on, {
    toolDescriptionReminders: { TaskUpdate: 'instructions/continue.md' },
  }, { 'continue.md': 'Update the plan without narration.' })
  on('tool.describe', () => ({ description: 'Original tool contract.', isDeferred: true }))

  const result = await $.tool.describe({
    tool: 'TaskUpdate', description: 'Original tool contract.', isDeferred: true,
    provider: { plugin: 'engine', tier: 'core' },
  })

  expect(result).toEqual({ description: 'Original tool contract.\n\nUpdate the plan without narration.', isDeferred: true })
})

test('restores context guidance once per rebuild without replacing other context', async ($, on) => {
  stubConfiguration(on, {
    contextReminders: { continuation: 'instructions/continue.md' },
  }, { 'continue.md': 'Resume the authorized task silently.' })
  on('prompt.context', ($, event) => ({ blocks: event.blocks }))
  const original = { blocks: [{ name: 'claudeMd', text: 'Original project instructions.' }] }
  const expected = { blocks: [
    ...original.blocks,
    { name: 'nova:continuation', text: 'Resume the authorized task silently.' },
  ] }

  expect(await $.prompt.context(original)).toEqual(expected)
  expect(await $.prompt.context(expected)).toEqual(expected)
  expect(await $.prompt.context(original)).toEqual(expected)
})

test('reminds on a real plan status transition', async ($, on) => {
  stubConfiguration(on, { workflowReminders: WORKFLOW_OPTIONS }, { 'continue.md': 'Continue silently.' })
  on('clock.now', () => ({ value: 0 }))
  const original = { result: TASK_RESULT, context: ['Existing context.'] }
  on('tool.call', () => original)

  expect(await $.tool.call(TASK_CALL)).toEqual({
    ...original, context: ['Existing context.', 'Continue silently.'],
  })
})

test('ignores task metadata changes and domain-level failures', async ($, on) => {
  stubConfiguration(on, { workflowReminders: WORKFLOW_OPTIONS }, { 'continue.md': 'Continue silently.' })
  on('clock.now', () => ({ value: 0 }))
  on('tool.call', ($, event) => ({ result: event.tool === 'TaskUpdate' && event.taskId === 'failed'
    ? { ...TASK_RESULT, success: false }
    : { success: true, taskId: 'phase', updatedFields: ['subject'] } }))

  expect((await $.tool.call({ ...TASK_CALL, taskId: 'failed' })).context).toBeUndefined()
  expect((await $.tool.call({ tool: 'TaskUpdate', taskId: 'phase', subject: 'Renamed' })).context).toBeUndefined()
})

test('coalesces adjacent transitions but still reminds after one hundred tool calls', async ($, on) => {
  stubConfiguration(on, { workflowReminders: WORKFLOW_OPTIONS }, { 'continue.md': 'Continue silently.' })
  on('clock.now', () => ({ value: 0 }))
  on('tool.call', ($, event) => ({ result: event.tool === 'TaskUpdate' ? TASK_RESULT : WRITE_RESULT }))

  expect((await $.tool.call(TASK_CALL)).context).toEqual(['Continue silently.'])
  expect((await $.tool.call(TASK_CALL)).context).toBeUndefined()
  const replies = []
  for (let index = 0; index < 100; index += 1) replies.push(await $.tool.call(WRITE_CALL))
  expect(replies.filter(reply => reply.context !== undefined)).toEqual([])
  expect((await $.tool.call(TASK_CALL)).context).toEqual(['Continue silently.'])
})

test('recognizes TodoWrite transitions but ignores reordering and spinner text', async ($, on) => {
  stubConfiguration(on, { workflowReminders: WORKFLOW_OPTIONS }, { 'continue.md': 'Continue silently.' })
  on('clock.now', () => ({ value: 0 }))
  const oldTodos = [
    { content: 'Inspect', status: 'in_progress' as const, activeForm: 'Inspecting' },
    { content: 'Verify', status: 'pending' as const, activeForm: 'Verifying' },
  ]
  on('tool.call', ($, event) => ({ result: { oldTodos, newTodos: event.tool === 'TodoWrite' ? event.todos : oldTodos } }))

  expect((await $.tool.call({ tool: 'TodoWrite', todos: [oldTodos[1]!, oldTodos[0]!] })).context).toBeUndefined()
  expect((await $.tool.call({ tool: 'TodoWrite', todos: [{ ...oldTodos[0]!, activeForm: 'Checking' }, oldTodos[1]!] })).context).toBeUndefined()
  expect((await $.tool.call({ tool: 'TodoWrite', todos: [{ ...oldTodos[0]!, status: 'completed' }, oldTodos[1]!] })).context).toEqual(['Continue silently.'])
})

test('reminds when an input-driven plan tool advances a step but not when it only lists steps', async ($, on) => {
  stubConfiguration(on, {
    workflowReminders: { ...WORKFLOW_OPTIONS, planTools: ['PlanList'] },
  }, { 'continue.md': 'Continue silently.' })
  on('clock.now', () => ({ value: 0 }))
  on('tool.call', () => ({ result: 'Plan updated.' }))
  const callUntypedTool = (input: Record<string, unknown>) => $.tool.call(input as Parameters<typeof $.tool.call>[0])

  expect((await callUntypedTool({ tool: 'PlanList', items: [{ content: 'Inspect', status: 'in_progress' }] })).context).toBeUndefined()
  expect((await callUntypedTool({ tool: 'PlanList', advance: true })).context).toEqual(['Continue silently.'])
})

test('adds a reminder only after a long call finishes and limits repeated long calls', async ($, on) => {
  stubConfiguration(on, {
    workflowReminders: { ...WORKFLOW_OPTIONS, minCallsBetween: 0 },
  }, { 'continue.md': 'Continue silently.' })
  let now = 0
  on('clock.now', () => ({ value: now }))
  on('tool.call', () => {
    now += 60000
    return { result: WRITE_RESULT, isReadOnly: true }
  })

  expect((await $.tool.call(WRITE_CALL)).context).toEqual(['Continue silently.'])
  expect((await $.tool.call(WRITE_CALL)).context).toEqual(['Continue silently.'])
  expect((await $.tool.call(WRITE_CALL)).context).toBeUndefined()
})

test('keeps a long tool failure intact while reminding about silent recovery', async ($, on) => {
  stubConfiguration(on, { workflowReminders: WORKFLOW_OPTIONS }, { 'continue.md': 'Continue silently.' })
  let now = 0
  on('clock.now', () => ({ value: now }))
  on('tool.call', () => {
    now = 60000
    return { result: 'Failed.', isError: true, text: 'Failed.' }
  })

  expect(await $.tool.call(WRITE_CALL)).toEqual({
    result: 'Failed.', isError: true, text: 'Failed.', context: ['Continue silently.'],
  })
})

test('keeps boundary reminders isolated between main and agent turns', async ($, on) => {
  stubConfiguration(on, { workflowReminders: WORKFLOW_OPTIONS }, { 'continue.md': 'Continue silently.' })
  on('clock.now', () => ({ value: 0 }))
  on('tool.call', () => ({ result: TASK_RESULT }))
  on('turn.start', ($, event) => ({ turnId: event.turnId }))

  expect((await $.tool.call(TASK_CALL)).context).toEqual(['Continue silently.'])
  expect((await $.tool.call({ ...TASK_CALL, agentId: 'child' })).context).toEqual(['Continue silently.'])
  expect((await $.tool.call(TASK_CALL)).context).toBeUndefined()
  await $.turn.start({ text: 'New task.', turnId: 'next' })
  expect((await $.tool.call(TASK_CALL)).context).toEqual(['Continue silently.'])
  expect((await $.tool.call({ ...TASK_CALL, agentId: 'child' })).context).toBeUndefined()
})

test('renews the reminder after a long call even when the plan just changed', async ($, on) => {
  stubConfiguration(on, { workflowReminders: WORKFLOW_OPTIONS }, { 'continue.md': 'Continue silently.' })
  let now = 0
  on('clock.now', () => ({ value: now }))
  on('tool.call', ($, event) => {
    if (event.tool === 'TaskUpdate') return { result: TASK_RESULT }
    now += 60000
    return { result: WRITE_RESULT }
  })

  expect((await $.tool.call(TASK_CALL)).context).toEqual(['Continue silently.'])
  expect((await $.tool.call(WRITE_CALL)).context).toEqual(['Continue silently.'])
  expect((await $.tool.call(TASK_CALL)).context).toBeUndefined()
})

test('does not carry a late tool reminder into a newer turn', async ($, on) => {
  stubConfiguration(on, {
    toolReminders: { Write: 'instructions/edit.md' }, toolReminderLimit: 1,
  }, { 'edit.md': 'Review the change.' })
  let release!: () => void
  let entered!: () => void
  const running = new Promise<void>(resolve => { entered = resolve })
  on('tool.call', () => {
    entered()
    return new Promise<{ result: typeof WRITE_RESULT }>(resolve => {
      release = () => resolve({ result: WRITE_RESULT })
    })
  })
  on('turn.start', ($, event) => ({ turnId: event.turnId }))

  const pending = $.tool.call(WRITE_CALL)
  await running
  await $.turn.start({ text: 'New task.', turnId: 'next' })
  release()
  expect(await pending).toEqual({ result: WRITE_RESULT })
})

test('removes configured presentation text from its context block only', async ($, on) => {
  stubConfiguration(on, { removedContextPatterns: { attachedProject: ['Offer relocation\\. '] } })
  on('prompt.context', ($, event) => ({ blocks: event.blocks }))

  const result = await $.prompt.context({ blocks: [
    { name: 'attachedProject', text: 'Files expire. Offer relocation. Ask before moving.' },
    { name: 'claudeMd', text: 'Offer relocation. Preserve this user instruction.' },
  ] })

  expect(result.blocks).toEqual([
    { name: 'attachedProject', text: 'Files expire. Ask before moving.' },
    { name: 'claudeMd', text: 'Offer relocation. Preserve this user instruction.' },
  ])
})


