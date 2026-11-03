import { expect, test } from 'claude-code/testing'

test('the engine keeps its own language reminder and adds the request-language rule after it', async ($, on) => {
  on('prompt.attachment', ($, e) => ({ text: e.text }))
  const rule = "User-facing text follows the user's request. Thinking blocks may use any language."
  const paths: string[] = []
  on('fs.read', ($, e) => {
    paths.push(e.path)
    return { value: rule }
  })
  for (const text of ['Always respond in russian.', 'Always respond in french.']) {
    const result = await $.prompt.attachment({ type: 'language', text, origin: { kind: 'engine' } })
    expect(result.text).toBe(`${text}\n\n${rule}`)
  }
  expect(paths.length).toBe(2)
  expect(paths.every(path => path.replaceAll('\\', '/').endsWith('/rules/language.md'))).toBe(true)
})

test('an unreadable rule file leaves the engine reminder as it was', async ($, on) => {
  on('prompt.attachment', ($, e) => ({ text: e.text }))
  on('fs.read', () => ({ deny: 'unavailable' }))
  const result = await $.prompt.attachment({ type: 'language', text: 'Always respond in russian.', origin: { kind: 'engine' } })
  expect(result.text).toBe('Always respond in russian.')
})
