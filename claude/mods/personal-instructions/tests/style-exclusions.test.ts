import { expect, test } from 'claude-code/testing'

test('Agent keeps its calling contract without proactive delegation or conflicting examples', async ($, on) => {
  on('tool.describe', ($, e) => ({ description: e.description, isDeferred: e.isDeferred }))
  const description = 'Specify subagent_type.\n\n- If the agent description mentions that it should be used proactively, then you should try your best to use it without the user having to ask for it first.\n- **Foreground vs background**: Pass `run_in_background: false` only when your very next action depends on the agent\'s result.\n- Trust but verify.\n\n## When to fork\n\nFork yourself (pass `subagent_type: "fork"`) when the intermediate tool output is not needed. Fork open-ended questions.\n\nForks are cheap because they share your prompt cache.\n\n**Don\'t race.** Never fabricate results.\n\nExample usage:\nassistant: Ship-readiness audit running.'
  const result = await $.tool.describe({ tool: 'Agent', description, provider: { plugin: 'engine', tier: 'core' } })
  expect(result.description.includes('proactively')).toBe(false)
  expect(result.description.includes('Foreground vs background')).toBe(false)
  expect(result.description.includes('Fork open-ended')).toBe(false)
  expect(result.description.includes('Example usage')).toBe(false)
  expect(result.description.includes('Specify subagent_type.')).toBe(true)
  expect(result.description.includes('Never fabricate results.')).toBe(true)
  const other = await $.tool.describe({ tool: 'Other', description, provider: { plugin: 'engine', tier: 'core' } })
  expect(other.description).toBe(description)
})

test('tone sections are omitted without changing other system sections', async ($, on) => {
  on('prompt.section', ($, e) => ({ text: e.text }))
  for (const name of ['tone', 'communication', 'heron_brook']) {
    expect((await $.prompt.section({ name, text: 'Conflicting style' })).text).toBe(null)
  }
  expect((await $.prompt.section({ name: 'provider_policy', text: 'Preserve access policy.' })).text).toBe('Preserve access policy.')
})

test('desktop composition removes narration and wrap-up while preserving operational constraints', async ($, on) => {
  const sections = [
    { id: 'host', scope: 'session' as const, text: 'Before\n- Right before each session\'s tool call, in the same message, write a bold title line and one sentence on what it will do; it has started only once the tool result says so. Two or more at once: call `mcp__ccd_session__mark_chapter` first with a short batch title.\nNever push those branches.\n# Task list and wrap-up (this app)\nMandatory recap.\n<browsers>\nPreserve browser permissions.\n</browsers>' }
  ]
  on('prompt.compose', () => ({ sections }))
  const result = await $.prompt.compose({ model: 'claude-opus-5-5', promptModel: 'claude-opus-5-5', surfaces: ['desktop'], tools: [], outputStyle: null, traits: ['sdk-preset'] })
  expect(result.sections[0]?.text).toBe('Before\n\nNever push those branches.\n<browsers>\nPreserve browser permissions.\n</browsers>')
})

test('tool descriptions lose the preamble without changing tool placement', async ($, on) => {
  on('tool.describe', ($, e) => ({ description: e.description, isDeferred: e.isDeferred }))
  const result = await $.tool.describe({ tool: 'mcp__ccd_session__hand_off_to_session', provider: { plugin: 'engine', tier: 'core' }, isDeferred: true, description: 'Move the task. Bold title line and one sentence right before the call; after it, stop that task here and answer the new message — no recap.' })
  expect(result.description).toBe('Move the task. after it, stop that task here and answer the new message — no recap.')
  expect(result.isDeferred).toBe(true)
})

test('MCP narration is deleted while output style and other attachments remain intact', async ($, on) => {
  on('prompt.attachment', ($, e) => ({ text: e.text }))
  const text = "Read the guide; they're likely watching it fill — keep them posted in a short line naming what you're on (outline up; now <topic>); findings go in the doc, not chat"
  expect((await $.prompt.attachment({ type: 'mcp_instructions_delta', text, origin: { kind: 'engine' } })).text).toBe('Read the guide; findings go in the doc, not chat')
  expect((await $.prompt.attachment({ type: 'output_style_instructions', text: 'Personal style stays.', origin: { kind: 'engine' } })).text).toBe('Personal style stays.')
})
