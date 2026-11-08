const CYRILLIC_LANGUAGES = ['russian', 'русский', 'ru', 'ukrainian', 'uk', 'belarusian', 'bulgarian', 'serbian', 'kazakh']

const PROSE_RULES: readonly [string, RegExp][] = [
  ['a dash', /[—–]|\S --? \S|\w--\w/],
  ['a colon', /(?<!\d):(?!\d)/],
  ['a semicolon', /;/],
  ['an exclamation mark', /!/],
  ['an ellipsis', /…|\.\.\./],
  ['curly quotes or guillemets', /[“”„‟‘’‚«»]/],
  ['bold text', /\*\*[^*\n]+\*\*|__[^_\n]+__/],
  ['italic text', /(^|[\s(])[*_](?=\S)[^*_\n]+?(?<=\S)[*_](?=$|[\s).,?])/],
  ['an emoji', /\p{Extended_Pictographic}/u],
]

const proseLines = (message: string) =>
  message
    .replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, '')
    .replace(/`[^`\n]*`/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/<https?:\/\/[^>\s]*>|https?:\/\/\S+/g, '')
    .split('\n')
    .filter(line => !/^\s*\|?(\s*:?-+:?\s*\|)+\s*(:?-+:?)?\s*$/.test(line))
    .map(line => line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ''))

const quote = (line: string, match: RegExp) => {
  const at = line.search(match)
  return line.slice(Math.max(0, at - 30), at + 30).trim()
}

export const styleViolations = (message: string, language: unknown) => {
  const lines = proseLines(message)
  const found = PROSE_RULES.flatMap(([name, rule]) => {
    const line = lines.find(text => rule.test(text))
    return line === undefined ? [] : [`${name}, as in "${quote(line, rule)}"`]
  })
  if (lines.some(line => /^\s{0,3}#{1,6}\s/.test(line))) found.push('a heading')

  const cyrillic = typeof language === 'string' && CYRILLIC_LANGUAGES.includes(language.trim().toLowerCase())
  const prose = lines.join(' ')
  const latin = prose.match(/[A-Za-z]/g)?.length ?? 0
  if (cyrillic && latin > 20 && latin > (prose.match(/[Ѐ-ӿ]/g)?.length ?? 0)) found.push(`text in a language other than ${language}`)
  return found
}
