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
const rule = name => readFile(new URL(`../rules/${name}.md`, import.meta.url), 'utf8')

test('the language attachment keeps the engine reminder and adds the request-language rule', async () => {
  for (const text of ['Always respond in russian.', 'Always respond in french.']) {
    const event = Object.freeze({ type: 'language', text, origin: Object.freeze({ kind: 'engine' }) })
    const result = await language(api, event, async () => ({ text }))
    assert.ok(result.text.startsWith(text))
    assert.ok(result.text.includes("language of the user's own request"))
    assert.ok(result.text.includes('text before a tool call'))
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

test('a subagent task carries the standing rules unless it is a fork', async () => {
  const spawn = hooks.find(hook => hook.event === 'agent.spawn').handle
  const rules = (await rule('subagent_rules')).trim()
  const seen = []
  const pass = async e => { seen.push(e); return { model: 'x' } }
  await spawn(api, { prompt: 'Посчитай файлы.', fork: false }, pass)
  assert.equal(seen.at(-1).prompt, `Посчитай файлы.\n\n${rules}`)
  await spawn(api, { prompt: 'Посчитай файлы.', fork: true }, pass)
  assert.equal(seen.at(-1).prompt, 'Посчитай файлы.')
})

test('a typed prompt carries the rules note as context and commands and meta prompts do not', async () => {
  const submit = hooks.find(hook => hook.event === 'prompt.submit').handle
  const reminder = (await rule('style_reminder')).trim()
  const midturn = (await rule('midturn_note')).trim()
  const seen = []
  const pass = async e => { seen.push(e); return { text: e.text } }
  await submit(api, { text: 'Почини тесты.', context: ['existing'] }, pass)
  assert.deepEqual(seen.at(-1).context, ['existing', reminder])
  await submit(api, { text: 'И ещё проверь логи.', turnId: 'turn-1' }, pass)
  assert.deepEqual(seen.at(-1).context, [reminder, midturn])
  await submit(api, { text: '/review', command: { name: 'review', args: '' } }, pass)
  assert.equal(seen.at(-1).context, undefined)
  await submit(api, { text: '<task-notification>done</task-notification>', isMeta: true }, pass)
  assert.equal(seen.at(-1).context, undefined)
})

test('built-in and MCP tool descriptions carry no added note', async () => {
  const describe = hooks.find(hook => hook.event === 'tool.describe').handle
  const edit = await describe(api, { tool: 'Edit' }, async () => ({ description: 'Edits a file.\n' }))
  assert.equal(edit.description, 'Edits a file.')
  const mcp = await describe(api, { tool: 'mcp__github__get_issue' }, async () => ({ description: 'Gets an issue.' }))
  assert.equal(mcp.description, 'Gets an issue.')
})

test('no output style attachment is touched and no output style is required', () => {
  assert.ok(!hooks.some(hook => hook.event === 'prompt.attachment' && ['output_style', 'output_style_instructions'].includes(hook.matcher.type)))
  assert.ok(!hooks.some(hook => hook.event === 'prompt.compose' && hook.matcher.outputStyle))
})

test('composition replaces the communication section with the rules file and keeps cache order', async () => {
  const communication = await rule('communication')
  const result = await compose(api, { outputStyle: null }, async () => ({ sections: [
    { id: 'intro', text: 'old intro', scope: 'shared' },
    { id: 'tone', text: 'old tone', scope: 'shared' },
    { id: 'provider_policy', text: 'preserved policy', scope: 'shared' },
    { id: 'communication', text: 'old communication', scope: 'shared' },
    { id: 'session_guidance', text: 'old guidance', scope: 'session' }
  ] }))
  assert.equal(result.sections[0].id, 'provider_policy')
  assert.equal(result.sections[0].text, 'preserved policy')
  assert.ok(!result.sections.some(section => section.id === 'tone'))
  assert.ok(result.sections.slice(1).every(section => section.scope === 'session'))
  assert.equal(result.sections.filter(section => section.id === 'communication').length, 1)
  assert.equal(result.sections.find(section => section.id === 'communication').text, communication)
  assert.equal(result.sections.find(section => section.id === 'session_guidance').text, await rule('session_guidance'))
  assert.equal(result.sections.at(-1).id, 'communication')
})

test('a prompt without a native communication section still receives the rules', async () => {
  const result = await compose(api, { outputStyle: null }, async () => ({ sections: [
    { id: 'intro', text: 'old intro', scope: 'shared' }
  ] }))
  assert.deepEqual(result.sections.map(section => section.id), ['intro', 'communication'])
  assert.equal(result.sections.at(-1).text, await rule('communication'))
  assert.equal(result.sections.at(-1).scope, 'session')
})

test('the communication section is sized for the system prompt and names the known slips', async () => {
  const communication = await rule('communication')
  assert.ok(communication.length < 6000, `communication.md is ${communication.length} characters`)
  for (const phrase of ['one or two short paragraphs', 'one to three sentences', 'U+0022', 'guillemets', 'semicolon', 'dash', 'label and a colon', 'language of the user\'s own request', 'progress updates']) {
    assert.ok(communication.includes(phrase), `missing: ${phrase}`)
  }
})

test('the rule files contain no forbidden punctuation in their own prose', async () => {
  const files = ['intro', 'system', 'doing_tasks', 'actions', 'tools', 'session_guidance', 'context_management', 'language', 'style_reminder', 'subagent_rules', 'midturn_note', 'communication']
  for (const name of files) {
    const text = await rule(name)
    assert.ok(!/[—–]/.test(text), `${name}.md contains a dash`)
    assert.ok(!/[«»“”]/.test(text), `${name}.md contains curly quotes or guillemets`)
    assert.ok(!/\p{Script=Cyrillic}/u.test(text), `${name}.md contains Cyrillic`)
    assert.ok(!/<examples?>|<rationale>|such as "|for example/i.test(text), `${name}.md contains phrase examples`)
  }
})
