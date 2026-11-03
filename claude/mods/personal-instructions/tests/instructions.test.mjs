import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { register } from '../hooks/register.ts'

const root = fileURLToPath(new URL('..', import.meta.url)).replaceAll('\\', '/')
const hooks = []
register((event, ...args) => {
  hooks.push({ event, matcher: args.length === 2 ? args[0] : {}, handle: args.at(-1) })
  return { catch: () => {} }
})
const api = { plugin: { root }, fs: { read: path => readFile(path, 'utf8') } }
const compose = hooks.find(hook => hook.event === 'prompt.compose').handle
const language = hooks.find(hook => hook.event === 'prompt.attachment' && hook.matcher.type === 'language').handle

test('the language attachment keeps the engine reminder and adds the request-language rule', async () => {
  for (const text of ['Always respond in russian.', 'Always respond in french.']) {
    const event = Object.freeze({ type: 'language', text, origin: Object.freeze({ kind: 'engine' }) })
    const result = await language(api, event, async () => ({ text }))
    assert.ok(result.text.startsWith(text))
    assert.ok(result.text.includes("language of the user's own request"))
    assert.ok(result.text.includes('Thinking blocks may use any language'))
    assert.equal(event.text, text)
  }
})

test('an unavailable or empty rule file leaves the engine reminder unchanged', async () => {
  const failing = { ...api, fs: { read: async () => { throw new Error('unavailable') } } }
  assert.deepEqual(await language(failing, {}, async () => ({ text: 'fixed language' })), { text: 'fixed language' })
  const empty = { ...api, fs: { read: async () => ' \n' } }
  assert.deepEqual(await language(empty, {}, async () => ({ text: 'fixed language' })), { text: 'fixed language' })
})

test('the mod adds context without blocking calls or filtering output', () => {
  assert.ok(hooks.every(hook => ['prompt.section', 'prompt.attachment', 'prompt.compose', 'prompt.submit', 'classic.PostToolBatch', 'tool.describe', 'agent.spawn', 'session.start', 'session.end'].includes(hook.event)))
})

test('a subagent task carries the standing rules unless it is a fork or another style is active', async () => {
  const spawn = hooks.find(hook => hook.event === 'agent.spawn').handle
  const rules = (await readFile(new URL('../rules/subagent_rules.md', import.meta.url), 'utf8')).trim()
  const engine = {
    ...api,
    session: { id: async () => 'spawn' },
    store: { delete: async () => {} },
    prompt: { compose: async () => compose(engine, { outputStyle: { name: engine.style } }, async () => ({ sections: [] })) },
    style: 'Concise Personal'
  }
  const seen = []
  const pass = async e => { seen.push(e); return { model: 'x' } }
  await spawn(engine, { prompt: 'Посчитай файлы.', fork: false }, pass)
  assert.equal(seen.at(-1).prompt, `Посчитай файлы.\n\n${rules}`)
  await spawn(engine, { prompt: 'Посчитай файлы.', fork: true }, pass)
  assert.equal(seen.at(-1).prompt, 'Посчитай файлы.')
  engine.style = 'Other'
  await engine.prompt.compose()
  await spawn(engine, { prompt: 'Посчитай файлы.', fork: false }, pass)
  assert.equal(seen.at(-1).prompt, 'Посчитай файлы.')
})

test('a typed prompt carries the style note as context and commands and meta prompts do not', async () => {
  const submit = hooks.find(hook => hook.event === 'prompt.submit').handle
  const reminder = (await readFile(new URL('../rules/style_reminder.md', import.meta.url), 'utf8')).trim()
  const engine = {
    ...api,
    session: { id: async () => 'submit' },
    store: { delete: async () => {} },
    prompt: { compose: async () => compose(engine, { outputStyle: { name: engine.style } }, async () => ({ sections: [] })) },
    style: 'Concise Personal'
  }
  const seen = []
  const pass = async e => { seen.push(e); return { text: e.text } }
  await submit(engine, { text: 'Почини тесты.', context: ['existing'] }, pass)
  assert.deepEqual(seen.at(-1).context, ['existing', reminder])
  await submit(engine, { text: '/review', command: { name: 'review', args: '' } }, pass)
  assert.equal(seen.at(-1).context, undefined)
  await submit(engine, { text: '<task-notification>done</task-notification>', isMeta: true }, pass)
  assert.equal(seen.at(-1).context, undefined)
  engine.style = 'Other'
  await engine.prompt.compose()
  await submit(engine, { text: 'Почини тесты.' }, pass)
  assert.equal(seen.at(-1).context, undefined)
})

test('built-in tool descriptions carry the call note only under the concise style', async () => {
  const describe = hooks.find(hook => hook.event === 'tool.describe').handle
  const engine = {
    ...api,
    session: { id: async () => 'describe' },
    store: { delete: async () => {} },
    prompt: { compose: async () => compose(engine, { outputStyle: { name: engine.style } }, async () => ({ sections: [] })) },
    style: 'Concise Personal'
  }
  const edit = await describe(engine, { tool: 'Edit' }, async () => ({ description: 'Edits a file.' }))
  assert.ok(edit.description.startsWith('Edits a file.\n\nSend this call on its own.'))
  const mcp = await describe(engine, { tool: 'mcp__github__get_issue' }, async () => ({ description: 'Gets an issue.' }))
  assert.equal(mcp.description, 'Gets an issue.')
  engine.style = 'Other'
  await engine.prompt.compose()
  const other = await describe(engine, { tool: 'Edit' }, async () => ({ description: 'Edits a file.' }))
  assert.equal(other.description, 'Edits a file.')
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

test('the rule files and the style contain no forbidden punctuation in their own prose', async () => {
  const files = ['intro', 'system', 'doing_tasks', 'actions', 'tools', 'session_guidance', 'context_management', 'language', 'style_reminder', 'subagent_rules']
  for (const name of files) {
    const text = await readFile(new URL(`../rules/${name}.md`, import.meta.url), 'utf8')
    assert.ok(!/[—–]/.test(text), `${name}.md contains a dash`)
  }
})
