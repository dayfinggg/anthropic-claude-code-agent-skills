export const sentenceLimit = 20
export const paragraphLimit = 4

const stripLiteral = (text: string): string => text
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`[^`\n]*`/g, ' ')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/<[^>\n]+>/g, ' ')
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/[A-Za-z]:[\\/][^\s)|,]+/g, ' ')
  .replace(/(?<![\w.])~?\/[\w.@-]+(?:\/[\w.@-]+)+/g, ' ')
  .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
  .replace(/\b[\w.-]+:\d+(?::\d+)?\b/g, ' ')

const excerpt = (text: string, index: number): string => text.slice(Math.max(0, index - 30), index + 25).replace(/\s+/g, ' ').trim()

const listMarker = /^\s*(?:[-*+]|\d+[.)])\s+/

const paragraphsOf = (prose: string): string[] => {
  const blocks = prose.split(/\n\s*\n/)
  const paragraphs: string[] = []
  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
    if (lines.length === 0) continue
    if (lines.some(line => listMarker.test(line))) {
      for (const line of lines) paragraphs.push(line.replace(listMarker, ''))
    } else {
      paragraphs.push(lines.join(' '))
    }
  }
  return paragraphs
}

const sentencesOf = (paragraph: string): string[] => {
  const text = paragraph.replace(/(\d)\.(\d)/g, '$1,$2')
  const parts = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? []
  return parts.map(part => part.trim()).filter(part => /[\p{L}\p{N}]/u.test(part))
}

const wordsOf = (sentence: string): number => sentence.split(/\s+/).filter(token => /[\p{L}\p{N}]/u.test(token)).length

export const checkAnswer = (answer: string): string[] => {
  const prose = stripLiteral(answer)
  if (!prose.trim()) return []
  const problems: string[] = []
  const dash = /[—–]/.exec(prose)
  if (dash) problems.push(`An em or en dash in prose near "${excerpt(prose, dash.index)}". Write it as a sentence with a verb or a comma.`)
  const colon = /:/.exec(prose)
  if (colon) problems.push(`A colon in prose near "${excerpt(prose, colon.index)}". Introduce a list, a code block, a path, or an explanation with a full sentence that ends in a period.`)
  const semicolon = /;/.exec(prose)
  if (semicolon) problems.push(`A semicolon in prose near "${excerpt(prose, semicolon.index)}". Split it into two sentences.`)
  const quotes = /[«»“”„‘’]/.exec(prose)
  if (quotes) problems.push(`Curly quotes or guillemets near "${excerpt(prose, quotes.index)}". Use the straight double quote.`)
  const heading = /^\s*#{1,6}\s/m.exec(prose)
  if (heading) problems.push(`A heading at "${excerpt(prose, heading.index)}". Write plain paragraphs.`)
  const bold = /\*\*[^*\n]+\*\*/.exec(prose)
  if (bold) problems.push(`Bold text at "${excerpt(prose, bold.index)}". Write plain paragraphs.`)
  for (const paragraph of paragraphsOf(prose)) {
    const sentences = sentencesOf(paragraph)
    if (sentences.length > paragraphLimit) problems.push(`A paragraph of ${sentences.length} sentences starting "${excerpt(paragraph, 0)}". Keep a paragraph to ${paragraphLimit} sentences.`)
    for (const sentence of sentences) {
      const words = wordsOf(sentence)
      if (words > sentenceLimit) problems.push(`A sentence of ${words} words starting "${excerpt(sentence, 0)}". Keep a sentence to ${sentenceLimit} words and one idea.`)
    }
  }
  return problems
}

export const stopMessage = (problems: string[]): string =>
  `The personal-instructions mod found rule violations in the final answer. ${problems.join(' ')} Send the corrected answer only, in the same language, without mentioning this check.`
