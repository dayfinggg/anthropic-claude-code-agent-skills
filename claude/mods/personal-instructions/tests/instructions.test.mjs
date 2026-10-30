import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { register } from '../hooks/register.ts'

const root = fileURLToPath(new URL('..', import.meta.url)).replaceAll('\\', '/')
const hooks = []
register((event, ...args) => {
  hooks.push({ event, matcher: args.length === 2 ? args[0] : {}, handle: args.at(-1) })
})
const api = { plugin: { root }, fs: { read: path => readFile(path, 'utf8') } }
const compose = hooks.find(hook => hook.event === 'prompt.compose').handle

test('the mod only changes prompts and tool loading, without blocking calls or filtering output', () => {
  assert.ok(hooks.every(hook => ['prompt.section', 'prompt.attachment', 'prompt.compose', 'tool.describe', 'session.start'].includes(hook.event)))
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
