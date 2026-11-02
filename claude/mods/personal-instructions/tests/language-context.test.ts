import { expect, test } from 'claude-code/testing'

test('the engine renders a request-language instruction without a fixed output language', async ($, on) => {
  on('prompt.attachment', ($, e) => ({ text: e.text }))
  const expected = "User-facing text follows the user's request. Thinking blocks may use any language."
  const paths: string[] = []
  on('fs.read', ($, e) => {
    paths.push(e.path)
    return { value: expected }
  })
  for (const text of ['Always respond in russian.', 'Always respond in french.']) {
    const result = await $.prompt.attachment({ type: 'language', text, origin: { kind: 'engine' } })
    expect(result.text).toBe(expected)
    expect(result.text?.includes(text)).toBe(false)
  }
  expect(paths.length).toBe(2)
  expect(paths.every(path => path.replaceAll('\\', '/').endsWith('/rules/language.md'))).toBe(true)
})
