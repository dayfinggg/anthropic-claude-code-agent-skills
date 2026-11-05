import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { register } from '../hooks/register.ts'
import { firstReminderAt, readStyleReminderState, recordToolBatch, reminderDue, reminderInterval } from '../hooks/style-reminder.ts'

const root = fileURLToPath(new URL('..', import.meta.url)).replaceAll('\\', '/')
const text = (await readFile(new URL('../rules/style_reminder.md', import.meta.url), 'utf8'))
const makeEngine = (sessionId, stored = new Map()) => {
  const hooks = new Map()
  register((event, ...args) => {
    hooks.set(event, args.at(-1))
    return { catch: () => {} }
  })
  const engine = {
    hooks, stored, plugin: { root },
    fs: { read: path => readFile(path, 'utf8') },
    session: { id: async () => sessionId, messages: async () => { throw new Error('not read') } },
    store: {
      get: async key => stored.has(key) ? structuredClone(stored.get(key)) : undefined,
      set: async (key, value) => stored.set(key, structuredClone(value)),
      delete: async key => stored.delete(key)
    }
  }
  engine.batch = (id, options = {}, result = {}) => hooks.get('classic.PostToolBatch')(engine, {
    session_id: sessionId, transcript_path: '/test/transcript.jsonl', cwd: '/test',
    hook_event_name: 'PostToolBatch', prompt_id: 'prompt-1',
    tool_calls: [{ tool_name: 'Read', tool_input: { file_path: '/test/input' }, tool_use_id: id, tool_response: 'result' }],
    ...options
  }, async () => result)
  engine.end = reason => hooks.get('session.end')(engine, { sessionId, reason }, async () => ({}))
  return engine
}
const first = firstReminderAt
const second = first + reminderInterval
const third = second + reminderInterval
const runBatches = async (engine, from, to, options = {}) => {
  const delivered = []
  for (let index = from; index < to; index += 1) {
    const result = await engine.batch('batch-' + index, options)
    if (result.additionalContext) delivered.push(index)
  }
  return delivered
}

test('a long turn receives the reminder at the first threshold and then at every interval', async () => {
  const engine = makeEngine('thresholds')
  const delivered = await runBatches(engine, 1, third + reminderInterval + 1)
  assert.deepEqual(delivered, [first, second, third, third + reminderInterval])
})

test('the reminder is appended to existing context without mutating the original result', async () => {
  const engine = makeEngine('append')
  await runBatches(engine, 1, first)
  const original = { additionalContext: ['existing context'] }
  assert.deepEqual((await engine.batch('batch-' + first, {}, original)).additionalContext, ['existing context', text])
  assert.deepEqual(original, { additionalContext: ['existing context'] })
})

test('parallel tools count as one batch and duplicate delivery does not advance it', async () => {
  const engine = makeEngine('batch-count')
  const tool_calls = Array.from({ length: 8 }, (_, i) => ({ tool_name: 'Read', tool_input: {}, tool_use_id: 'parallel-' + i, tool_response: 'result' }))
  assert.equal((await engine.batch('', { tool_calls })).additionalContext, undefined)
  assert.equal((await engine.batch('', { tool_calls })).additionalContext, undefined)
  assert.deepEqual(await runBatches(engine, 2, first), [])
  assert.deepEqual((await engine.batch('batch-' + first)).additionalContext, [text])
})

test('new prompts have independent thresholds', async () => {
  const engine = makeEngine('new-prompt')
  assert.deepEqual(await runBatches(engine, 1, second + 1), [first, second])
  assert.deepEqual(await runBatches(engine, 100, 100 + second + 1, { prompt_id: 'prompt-2' }), [100 + first - 1, 100 + second - 1])
})

test('subagents, empty batches and missing prompt IDs are excluded', async () => {
  const engine = makeEngine('excluded')
  for (let index = 0; index < 20; index += 1) {
    for (const options of [{ agent_id: 'worker' }, { tool_calls: [] }, { prompt_id: undefined }]) {
      assert.equal((await engine.batch('batch-' + index, options)).additionalContext, undefined)
    }
  }
  assert.equal(engine.stored.size, 0)
})

test('downstream stop decisions and original event data are preserved', async () => {
  const engine = makeEngine('stop')
  const options = Object.freeze({ prompt_id: 'prompt', tool_calls: Object.freeze([Object.freeze({ tool_name: 'Read', tool_input: Object.freeze({ path: 'x' }), tool_use_id: 't1', tool_response: 'unchanged' })]) })
  for (const result of [{ block: 'policy', additionalContext: ['policy context'] }, { block: '' }, { preventContinuation: true, stopReason: 'stop' }]) {
    assert.strictEqual(await engine.batch('batch', options, result), result)
  }
  assert.equal(engine.stored.size, 0)
  assert.equal(options.tool_calls[0].tool_response, 'unchanged')
})

test('resume preserves progress and does not replay a delivered reminder', async () => {
  const one = makeEngine('resume-batch')
  await runBatches(one, 1, first)
  await one.end('resume')
  const resumed = makeEngine('resume-batch', one.stored)
  assert.deepEqual((await resumed.batch('batch-' + first)).additionalContext, [text])
  await resumed.end('prompt_input_exit')
  const again = makeEngine('resume-batch', one.stored)
  assert.equal((await again.batch('batch-' + first)).additionalContext, undefined)
  assert.equal((await again.batch('batch-' + (first + 1))).additionalContext, undefined)
  await again.end('clear')
  assert.equal(one.stored.size, 0)
})

test('missing reminder files and storage failures do not block work', async () => {
  const engine = makeEngine('fail-open')
  await runBatches(engine, 1, first)
  const read = engine.fs.read
  engine.fs.read = async () => { throw new Error('unavailable') }
  const result = { additionalContext: ['existing'] }
  assert.strictEqual(await engine.batch('batch-' + first, {}, result), result)
  engine.fs.read = read
  assert.deepEqual((await engine.batch('batch-' + (first + 1))).additionalContext, [text])
  assert.deepEqual((await engine.batch('batch-' + (first + 2))).additionalContext, undefined)
  engine.store.get = async () => { throw new Error('unavailable') }
  assert.strictEqual(await engine.batch('batch-x', {}, result), result)
})

test('concurrent duplicate batches cannot inject twice', async () => {
  const engine = makeEngine('concurrent-batch')
  await runBatches(engine, 1, first)
  let enter
  let release
  const entered = new Promise(resolve => { enter = resolve })
  const gate = new Promise(resolve => { release = resolve })
  engine.fs.read = async () => { enter(); await gate; return text }
  const inFlight = engine.batch('batch-' + first)
  await entered
  assert.equal((await engine.batch('batch-' + first)).additionalContext, undefined)
  release()
  assert.deepEqual((await inFlight).additionalContext, [text])
})

test('the session transcript is never read while counting batches', async () => {
  const engine = makeEngine('no-transcript-read')
  assert.deepEqual(await runBatches(engine, 1, second + 1), [first, second])
})

test('legacy state is not misread and the count stays a plain number', () => {
  let state = readStyleReminderState({ promptId: 'old', batchIds: ['a', 'b', 'c', 'd', 'e'], sent: true })
  assert.deepEqual(state, { promptId: 'old', count: 0, lastBatchId: '', sentAt: [] })
  state = readStyleReminderState({ turnId: 'old', indexes: [0, 1, 2, 3, 4], pending: true })
  assert.deepEqual(state, { promptId: '', count: 0, lastBatchId: '', sentAt: [] })
  assert.deepEqual(readStyleReminderState({ promptId: 'p', count: 7, lastBatchId: 'b', sentAt: [5], noteAt: [3] }), { promptId: 'p', count: 7, lastBatchId: 'b', sentAt: [5] })
  for (let index = 0; index < 105; index += 1) state = recordToolBatch(state, 'prompt', 'batch-' + index)
  assert.equal(state.count, 105)
  assert.equal(reminderDue(state), 105)
  assert.deepEqual(recordToolBatch(state, 'new', 'first'), { promptId: 'new', count: 1, lastBatchId: 'first', sentAt: [] })
})
