import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { register } from '../hooks/register.ts'
import { readStyleReminderState, recordToolBatch } from '../hooks/style-reminder.ts'

const root = fileURLToPath(new URL('..', import.meta.url)).replaceAll('\\', '/')
const text = await readFile(new URL('../rules/style_reminder.md', import.meta.url), 'utf8')
const makeEngine = (sessionId, stored = new Map()) => {
  const hooks = new Map()
  register((event, ...args) => hooks.set(event, args.at(-1)))
  const engine = {
    style: 'Concise Personal', hooks, stored, plugin: { root },
    fs: { read: path => readFile(path, 'utf8') },
    session: { id: async () => sessionId },
    store: {
      get: async key => stored.has(key) ? structuredClone(stored.get(key)) : undefined,
      set: async (key, value) => stored.set(key, structuredClone(value)),
      delete: async key => stored.delete(key)
    },
    prompt: { compose: async () => hooks.get('prompt.compose')(engine, { outputStyle: { name: engine.style } }, async () => ({ sections: [] })) }
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
const prime = async engine => {
  for (let index = 0; index < 4; index += 1) assert.equal((await engine.batch('batch-' + index)).additionalContext, undefined)
}

test('the first long turn receives context before completion, once only', async () => {
  const engine = makeEngine('same-turn')
  await prime(engine)
  const original = { additionalContext: ['existing context'] }
  assert.deepEqual((await engine.batch('batch-4', {}, original)).additionalContext, ['existing context', text])
  assert.deepEqual(original, { additionalContext: ['existing context'] })
  for (let index = 5; index < 12; index += 1) assert.strictEqual(await engine.batch('batch-' + index, {}, original), original)
  assert.equal(engine.hooks.has('prompt.submit'), false)
})

test('parallel tools count as one batch and duplicate delivery does not advance it', async () => {
  const engine = makeEngine('batch-count')
  const tool_calls = Array.from({ length: 8 }, (_, i) => ({ tool_name: 'Read', tool_input: {}, tool_use_id: 'parallel-' + i, tool_response: 'result' }))
  assert.equal((await engine.batch('', { tool_calls })).additionalContext, undefined)
  assert.equal((await engine.batch('', { tool_calls })).additionalContext, undefined)
  for (let index = 1; index < 4; index += 1) assert.equal((await engine.batch('batch-' + index)).additionalContext, undefined)
  assert.deepEqual((await engine.batch('batch-4')).additionalContext, [text])
})

test('new prompts have independent thresholds', async () => {
  const engine = makeEngine('new-prompt')
  await prime(engine)
  assert.deepEqual((await engine.batch('batch-4')).additionalContext, [text])
  for (let index = 0; index < 4; index += 1) assert.equal((await engine.batch('next-' + index, { prompt_id: 'prompt-2' })).additionalContext, undefined)
  assert.deepEqual((await engine.batch('next-4', { prompt_id: 'prompt-2' })).additionalContext, [text])
})

test('subagents, empty batches, missing prompt IDs and other styles are excluded', async () => {
  const engine = makeEngine('excluded')
  for (let index = 0; index < 7; index += 1) {
    for (const options of [{ agent_id: 'worker' }, { tool_calls: [] }, { prompt_id: undefined }]) {
      assert.equal((await engine.batch('batch-' + index, options)).additionalContext, undefined)
    }
  }
  assert.equal(engine.stored.size, 0)
  engine.style = 'Other'
  for (let index = 0; index < 7; index += 1) assert.equal((await engine.batch('other-' + index)).additionalContext, undefined)
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
  const first = makeEngine('resume-batch')
  await prime(first)
  await first.end('resume')
  const resumed = makeEngine('resume-batch', first.stored)
  assert.deepEqual((await resumed.batch('batch-4')).additionalContext, [text])
  await resumed.end('prompt_input_exit')
  const again = makeEngine('resume-batch', first.stored)
  assert.equal((await again.batch('batch-5')).additionalContext, undefined)
  await again.end('clear')
  assert.equal(first.stored.size, 0)
})

test('changing styles clears tracking, including immediately before injection', async () => {
  const engine = makeEngine('changed-style')
  await prime(engine)
  engine.style = 'Other'
  assert.equal((await engine.batch('batch-4')).additionalContext, undefined)
  assert.equal(engine.stored.size, 0)
  engine.style = 'Concise Personal'
  await engine.prompt.compose()
  await prime(engine)
  assert.deepEqual((await engine.batch('batch-4')).additionalContext, [text])
})

test('missing reminder files and storage failures do not block work', async () => {
  const engine = makeEngine('fail-open')
  await prime(engine)
  const read = engine.fs.read
  engine.fs.read = async () => { throw new Error('unavailable') }
  const result = { additionalContext: ['existing'] }
  assert.strictEqual(await engine.batch('batch-4', {}, result), result)
  engine.fs.read = read
  assert.deepEqual((await engine.batch('batch-5')).additionalContext, [text])
  engine.store.get = async () => { throw new Error('unavailable') }
  assert.strictEqual(await engine.batch('batch-6', {}, result), result)
})

test('concurrent duplicate batches cannot inject twice', async () => {
  const engine = makeEngine('concurrent-batch')
  await prime(engine)
  let enter
  let release
  const entered = new Promise(resolve => { enter = resolve })
  const gate = new Promise(resolve => { release = resolve })
  engine.fs.read = async () => { enter(); await gate; return text }
  const first = engine.batch('batch-4')
  await entered
  assert.equal((await engine.batch('batch-4')).additionalContext, undefined)
  release()
  assert.deepEqual((await first).additionalContext, [text])
})

test('legacy state is not misread and stored batch IDs stay bounded', () => {
  let state = readStyleReminderState({ turnId: 'old', indexes: [0, 1, 2, 3, 4], pending: true })
  assert.deepEqual(state, { promptId: '', batchIds: [], sent: false })
  for (let index = 0; index < 100; index += 1) state = recordToolBatch(state, 'prompt', 'batch-' + index)
  assert.equal(state.batchIds.length, 5)
  assert.deepEqual(recordToolBatch(state, 'new', 'first'), { promptId: 'new', batchIds: ['first'], sent: false })
})
