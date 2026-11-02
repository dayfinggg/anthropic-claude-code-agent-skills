import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { register } from '../hooks/register.ts'
import { recordToolStep, readStyleReminderState } from '../hooks/style-reminder.ts'

const root = fileURLToPath(new URL('..', import.meta.url)).replaceAll('\\', '/')
const hooks = []
register((event, ...args) => {
  hooks.push({ event, matcher: args.length === 2 ? args[0] : {}, handle: args.at(-1) })
})
const api = { plugin: { root }, fs: { read: path => readFile(path, 'utf8') } }
const compose = hooks.find(hook => hook.event === 'prompt.compose').handle
const submit = hooks.find(hook => hook.event === 'prompt.submit').handle
const step = hooks.find(hook => hook.event === 'turn.step').handle
const complete = hooks.find(hook => hook.event === 'turn.complete').handle
const end = hooks.find(hook => hook.event === 'session.end').handle
const composeStyle = (api, outputStyle) => compose(api, { outputStyle }, async () => ({ sections: [] }))
const stored = new Map()
api.store = {
  get: async key => {
    const value = stored.get(key)
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
  },
  set: async (key, value) => stored.set(key, JSON.parse(JSON.stringify(value))),
  delete: async key => stored.delete(key)
}

const runToolSteps = async (engine, turnId, count, agentId) => {
  for (let index = 0; index < count; index += 1) {
    const event = { turnId, index, model: 'claude-sonnet-5-5', messageCount: index + 1, ...(agentId ? { agentId } : {}) }
    const stream = async function* () { return { turnId, index, answer: '', toolUses: [{}] } }
    assert.equal((await step(engine, event, stream).next()).done, true)
  }
}

test('tool-step tracking ignores duplicate steps and stays bounded', () => {
  let state = readStyleReminderState(undefined)
  state = recordToolStep(state, 'turn', 0)
  state = recordToolStep(state, 'turn', 0)
  assert.equal(state.indexes.length, 1)
  for (let index = 1; index < 100; index += 1) state = recordToolStep(state, 'turn', index)
  assert.equal(state.indexes.length, 5)
  assert.deepEqual(recordToolStep(state, 'next', 0).indexes, [0])
})

test('failed submission preserves one reminder and keeps existing context', async () => {
  const sessionId = 'failed-submit'
  const key = `personal-instructions.style-reminder.${sessionId}`
  const localApi = { ...api, session: { id: async () => sessionId } }
  await composeStyle(localApi, { name: 'Concise Personal' })
  await api.store.set(key, { turnId: '', indexes: [], pending: true })
  const event = { text: 'Continue', wait: false, origin: { kind: 'sdk' }, context: ['existing'] }
  const failure = new Error('submission failed')
  await assert.rejects(submit(localApi, event, async () => { throw failure }), error => error === failure)
  const result = await submit(localApi, event, async value => value)
  assert.equal(result.text, event.text)
  assert.equal(result.context[0], 'existing')
  assert.equal(result.context.length, 2)
  const repeated = await submit(localApi, event, async value => value)
  assert.deepEqual(repeated.context, ['existing'])
})

test('the mod only changes prompts and tool loading, without blocking calls or filtering output', () => {
  assert.ok(hooks.every(hook => ['prompt.section', 'prompt.attachment', 'prompt.compose', 'prompt.submit', 'turn.step', 'turn.complete', 'tool.describe', 'session.start', 'session.end'].includes(hook.event)))
})

test('a completed long main turn adds one concise-style reminder to the next user prompt', async () => {
  const sessionId = 'long-style-reminder'
  const localApi = { ...api, session: { id: async () => sessionId } }
  const pass = async event => ({ text: event.text, context: event.context, origin: event.origin })
  await composeStyle(localApi, { name: 'Concise Personal' })
  await runToolSteps(localApi, 'short', 4)
  await complete(localApi, { turnId: 'short', reason: 'answer', isAborted: false }, async event => ({ text: event.answer }))
  const event = { text: 'Follow up', wait: false, origin: { kind: 'composer' } }
  assert.equal((await submit(localApi, event, pass)).context, undefined)
  await runToolSteps(localApi, 'long', 5)
  await complete(localApi, { turnId: 'long', reason: 'answer', isAborted: false }, async value => ({ text: value.answer }))
  assert.equal((await localApi.store.get(`personal-instructions.style-reminder.${sessionId}`)).pending, true)
  assert.deepEqual((await submit(localApi, event, pass)).context, [await readFile(new URL('../rules/style_reminder.md', import.meta.url), 'utf8')])
  assert.equal((await localApi.store.get(`personal-instructions.style-reminder.${sessionId}`)).pending, false)
  assert.equal((await submit(localApi, event, pass)).context, undefined)
})

test('style reminders are limited to the active concise style and main completed turns', async () => {
  const event = { text: 'Follow up', wait: false, origin: { kind: 'composer' } }
  const pass = async input => ({ text: input.text, context: input.context, origin: input.origin })
  const localApi = { ...api, session: { id: async () => 'other-style' } }
  localApi.prompt = { compose: async () => composeStyle(localApi, { name: 'Concise Personal' }) }
  await composeStyle(localApi, { name: 'Concise Personal' })
  await runToolSteps(localApi, 'subagent', 5, 'agent-1')
  await complete(localApi, { turnId: 'subagent', agentId: 'agent-1', reason: 'answer', isAborted: false }, async value => ({ text: value.answer }))
  await runToolSteps(localApi, 'aborted', 5)
  await complete(localApi, { turnId: 'aborted', reason: 'aborted', isAborted: true }, async value => ({ text: value.answer }))
  assert.equal((await submit(localApi, event, pass)).context, undefined)
  await composeStyle(localApi, { name: 'Other' })
  await runToolSteps(localApi, 'other-style', 5)
  await complete(localApi, { turnId: 'other-style', reason: 'answer', isAborted: false }, async value => ({ text: value.answer }))
  assert.equal((await submit(localApi, event, pass)).context, undefined)
})

test('a persisted reminder resumes with the active style after the registration is recreated', async () => {
  const sessionId = 'resumed-reminder'
  const key = `personal-instructions.style-reminder.${sessionId}`
  await api.store.set(key, { turnId: '', indexes: [], pending: true })
  const localApi = { ...api, session: { id: async () => sessionId } }
  localApi.prompt = { compose: async () => composeStyle(localApi, { name: 'Concise Personal' }) }
  const result = await submit(localApi, { text: 'Continue', wait: false, origin: { kind: 'composer' } }, async event => ({ text: event.text, context: event.context, origin: event.origin }))
  assert.deepEqual(result.context, [await readFile(new URL('../rules/style_reminder.md', import.meta.url), 'utf8')])
  assert.equal((await api.store.get(key)).pending, false)
})

test('a pending reminder survives resume and process exit but is cleared with its session', async () => {
  const sessionId = 'reminder-lifecycle'
  const key = `personal-instructions.style-reminder.${sessionId}`
  await api.store.set(key, { turnId: '', indexes: [], pending: true })
  const next = async event => ({ sessionId: event.sessionId })
  await end(api, { reason: 'resume', sessionId }, next)
  assert.equal((await api.store.get(key)).pending, true)
  await end(api, { reason: 'prompt_input_exit', sessionId }, next)
  assert.equal((await api.store.get(key)).pending, true)
  await end(api, { reason: 'clear', sessionId }, next)
  assert.equal(await api.store.get(key), undefined)
})

test('style reminders do not change commands, meta prompts, or prompts typed during a turn', async () => {
  const localApi = { ...api, session: { id: async () => 'non-user-prompt' } }
  localApi.prompt = { compose: async () => composeStyle(localApi, { name: 'Concise Personal' }) }
  await composeStyle(localApi, { name: 'Concise Personal' })
  const pass = async event => ({ text: event.text, context: event.context, origin: event.origin })
  await runToolSteps(localApi, 'long-pending', 5)
  await complete(localApi, { turnId: 'long-pending', reason: 'answer', isAborted: false }, async value => ({ text: value.answer }))
  for (const event of [
    { text: '/review', command: { name: 'review', args: '' }, wait: false, origin: { kind: 'composer' } },
    { text: 'notification', isMeta: true, wait: false, origin: { kind: 'unclassified' } },
    { text: 'queued follow up', turnId: 'active-turn', wait: false, origin: { kind: 'composer' } }
  ]) {
    assert.equal((await submit(localApi, event, pass)).context, undefined)
  }
  const result = await submit(localApi, { text: 'Continue', wait: false, origin: { kind: 'composer' } }, pass)
  assert.deepEqual(result.context, [await readFile(new URL('../rules/style_reminder.md', import.meta.url), 'utf8')])
})

test('the native output-style attachment remains enabled', () => {
  assert.ok(!hooks.some(hook => hook.event === 'prompt.attachment' && ['output_style', 'output_style_instructions'].includes(hook.matcher.type)))
})

test('composition preserves unknown sections, cache order, and native style loading', async () => {
  const result = await compose(api, { outputStyle: { name: 'Concise Personal' } }, async () => ({ sections: [
    { id: 'intro', text: 'old intro', scope: 'shared' },
    { id: 'tone', text: 'old tone', scope: 'shared' },
    { id: 'provider_policy', text: 'preserved policy', scope: 'shared' },
    { id: 'session_guidance', text: 'old guidance', scope: 'session' }
  ] }))
  assert.equal(result.sections[0].id, 'provider_policy')
  assert.equal(result.sections[0].text, 'preserved policy')
  assert.ok(!result.sections.some(section => section.id === 'tone'))
  assert.ok(!result.sections.some(section => /response_style|output_style/.test(section.id)))
  assert.ok(result.sections.slice(1).every(section => section.scope === 'session'))
  assert.equal(result.sections.find(section => section.id === 'session_guidance').text, await readFile(new URL('../rules/session_guidance.md', import.meta.url), 'utf8'))
})
