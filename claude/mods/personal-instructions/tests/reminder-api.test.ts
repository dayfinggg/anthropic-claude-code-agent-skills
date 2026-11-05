import { expect, test } from 'claude-code/testing'

test('the periodic reminder is appended through the engine without reading the transcript', async ($, on) => {
  const stored = new Map<string, unknown>()
  let transcriptReads = 0
  on('classic.PostToolBatch', () => ({ additionalContext: ['existing'] }))
  on('store.get', ($, e) => ({ value: stored.get(e.key) }))
  on('store.set', ($, e) => { stored.set(e.key, e.value); return { value: undefined } })
  on('fs.read', () => ({ value: 'Communication reminder' }))
  on('session.messages', () => { transcriptReads += 1; return { value: [] } })
  const delivered: number[] = []
  for (let index = 1; index <= 6; index += 1) {
    const event = {
      hook_event_name: 'PostToolBatch' as const,
      session_id: 'api-reminder', transcript_path: '/test/transcript.jsonl', cwd: '/test', prompt_id: 'p',
      tool_calls: [{ tool_name: 'Write', tool_input: {}, tool_use_id: `write-${index}`, tool_response: 'written' }]
    }
    const result = await $.classic.PostToolBatch(event)
    if (result.additionalContext?.includes('Communication reminder')) delivered.push(index)
    expect(result.additionalContext?.[0]).toBe('existing')
    expect(result.preventContinuation).toBe(undefined)
    expect(result.block).toBe(undefined)
    expect(event.tool_calls[0]?.tool_response).toBe('written')
  }
  expect(delivered).toEqual([5])
  expect(transcriptReads).toBe(0)
})
