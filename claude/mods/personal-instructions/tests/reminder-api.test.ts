import { expect, test } from 'claude-code/testing'

test('a batch reminder reads normalized API blocks without rewriting the batch', async ($, on) => {
  on('classic.PostToolBatch', () => ({ additionalContext: ['existing'] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('fs.read', () => ({ value: 'Communication reminder' }))
  on('session.messages', ($, e) => {
    expect(e.as).toBe('api')
    return { value: [
      { role: 'assistant', content: [
        { type: 'text', text: 'Working note' },
        { type: 'tool_use', id: 'write', name: 'Write', input: {} },
        { type: 'tool_use', id: 'run', name: 'Bash', input: {} }
      ] },
      { role: 'user', content: [
        { type: 'tool_result', tool_use_id: 'write', content: 'written' },
        { type: 'tool_result', tool_use_id: 'run', content: 'checked' }
      ] }
    ] }
  })
  const event = {
    hook_event_name: 'PostToolBatch' as const,
    session_id: 'api-reminder', transcript_path: '/test/transcript.jsonl', cwd: '/test', prompt_id: 'p',
    tool_calls: [
      { tool_name: 'Write', tool_input: {}, tool_use_id: 'write', tool_response: 'written' },
      { tool_name: 'Bash', tool_input: {}, tool_use_id: 'run', tool_response: 'checked' }
    ]
  }
  const result = await $.classic.PostToolBatch(event)
  expect(result.additionalContext).toEqual(['existing', 'Communication reminder'])
  expect(result.preventContinuation).toBe(undefined)
  expect(result.block).toBe(undefined)
  expect(event.tool_calls[0]?.tool_response).toBe('written')
  expect(event.tool_calls[1]?.tool_response).toBe('checked')
})
