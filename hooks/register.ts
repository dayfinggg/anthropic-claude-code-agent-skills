import type { EngineInterface, PluginOptions, PromptComposeSection, Register, TurnStepChunk, TurnStepTextChunk } from 'claude-code'

const RULES = 'instructions/rules.md'
const TURN = 'instructions/turn.md'
const RESTYLE = 'instructions/restyle.md'
const BARE = 'bare'
const FENCE = '```'
const TICK = '`'
const ELLIPSIS = '…'

type Style = {
  marks: readonly string[]
  turns: readonly (readonly string[])[]
  possibleTurns: readonly (readonly string[])[]
  swaps: readonly (readonly [string, string])[]
  maxChars: number
}

const TURN_PROBLEM = 'a contrast turn'
const POSSIBLE_TURN_PROBLEM = 'a possible contrast turn'

type Sentence = { text: string; after: string }

export const register: Register = (on, options) => {
  const deferredTools = namesIn(options.deferred_tools)
  const loadedTools = namesIn(options.loaded_tools)
  const excludedToolLines = namesIn(options.excluded_tool_lines)
  const excludedSections = namesIn(options.excluded_sections)
  const excludedReminders = namesIn(options.excluded_reminders)
  const style: Style = {
    marks: [...namesIn(options.restyle_marks)].filter(mark => mark !== ''),
    turns: fragments(options.restyle_turns),
    possibleTurns: fragments(options.restyle_possible_turns),
    swaps: [...namesIn(options.restyle_swaps)].filter(swap => swap.length > 1).map(swap => [swap.slice(0, 1), swap.slice(1)] as const),
    maxChars: typeof options.restyle_max_chars === 'number' ? options.restyle_max_chars : 0,
  }

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)

    if (e.traits.includes(BARE)) return composed

    const kept = composed.sections.filter(section => !excludedSections.has(section.id))

    return { sections: [...kept, section($, 'rules', await readOwn($, RULES))] }
  })

  on('tool.describe', async ($, e, next) => {
    const described = await next(e)
    const description = withoutLines(described.description, excludedToolLines)

    if (deferredTools.has(e.tool)) return { ...described, description, isDeferred: true }
    if (loadedTools.has(e.tool)) return { ...described, description, isDeferred: false }

    return { ...described, description }
  })

  on('prompt.attachment', ($, e, next) => (excludedReminders.has(e.type) ? { text: null } : next(e)))

  on('prompt.submit', async ($, e, next) => {
    if ((e.turnId !== undefined && !e.wait) || e.command !== undefined || e.isMeta === true) return next(e)

    return next({ ...e, context: [...(e.context ?? []), await readOwn($, TURN)] })
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined || style.maxChars <= 0) return yield* next(e)

    let block: TurnStepTextChunk[] = []
    let held: TurnStepChunk[] = []

    for await (const chunk of next(e)) {
      if (chunk.kind === 'text' && (block.length === 0 || chunk.index === block[0]?.index)) {
        block.push(chunk)
        continue
      }
      if (block.length > 0 && chunk.kind === 'engine') {
        held.push(chunk)
        continue
      }
      if (block.length > 0) {
        yield* settled($, e.model, block, style)
        yield* held
        block = []
        held = []
      }
      if (chunk.kind === 'text') {
        block.push(chunk)
        continue
      }
      yield chunk
    }

    if (block.length > 0) {
      yield* settled($, e.model, block, style)
      yield* held
    }
  })
}

async function* settled($: EngineInterface, model: string, block: TurnStepTextChunk[], style: Style): AsyncGenerator<TurnStepChunk> {
  const [first] = block
  const original = block.map(chunk => chunk.text).join('')
  const restyled = first === undefined || original.length > style.maxChars ? original : await restyle($, model, original, style)

  if (first === undefined || restyled === original) {
    yield* block
    return
  }

  yield { ...first, text: restyled }
}

async function restyle($: EngineInterface, model: string, text: string, style: Style): Promise<string> {
  const kept: string[] = []
  const sentences = split(swapped(guard(text, kept), style))
  const flagged = sentences.map((sentence, index) => ({ index, sentence, problems: problems(sentence.text, style) })).filter(item => item.problems.length > 0)

  try {
    let pending = flagged

    for (let attempt = 0; attempt < 2 && pending.length > 0; attempt += 1) {
      const request = pending.map(item => ({ id: String(item.index), sentence: item.sentence.text, problems: item.problems }))
      const reply = await $.model.complete({
        model,
        system: await readOwn($, RESTYLE),
        prompt: JSON.stringify(request),
        effort: 'low',
        maxTokens: 4096,
      })

      if (!reply.isAnswered) break

      const rewritten = parsed(reply.text)
      const unresolved: typeof pending = []

      for (const item of pending) {
        const candidate = rewritten[String(item.index)]

        if (typeof candidate === 'string' && acceptable(item.sentence.text, candidate.trim(), style)) {
          sentences[item.index] = { ...item.sentence, text: candidate.trim() }
        } else if (item.problems.some(problem => problem !== POSSIBLE_TURN_PROBLEM)) {
          unresolved.push(item)
        }
      }
      pending = unresolved
    }
  } catch {
    return text
  }

  const result = restore(sentences.map(sentence => sentence.text + sentence.after).join(''), kept)

  return result ?? text
}

function problems(sentence: string, style: Style): string[] {
  const padded = `${sentence} `
  const marks = style.marks.filter(mark => padded.includes(mark)).map(mark => `the mark "${mark.trim()}"`)
  const lower = ` ${sentence.toLowerCase()} `

  if (style.turns.some(parts => inOrder(lower, parts))) return [...marks, TURN_PROBLEM]
  if (style.possibleTurns.some(parts => inOrder(lower, parts))) return [...marks, POSSIBLE_TURN_PROBLEM]

  return marks
}

function acceptable(before: string, after: string, style: Style): boolean {
  if (after === before || after === '' || after.includes('\n') !== before.includes('\n')) return false
  if (after.length > before.length * 2 + 40 || after.length < before.length * 0.4) return false
  if (placeholders(after).join() !== placeholders(before).join()) return false

  const was = problems(before, style).filter(problem => problem !== POSSIBLE_TURN_PROBLEM).length
  const now = problems(after, style).filter(problem => problem !== POSSIBLE_TURN_PROBLEM).length

  return now < was || (was === 0 && now === 0)
}

function fragments(value: PluginOptions[string] | undefined): (readonly string[])[] {
  return [...namesIn(value)].map(turn => turn.split(ELLIPSIS)).filter(parts => parts.every(part => part !== ''))
}

function placeholders(text: string): string[] {
  const found: string[] = []
  let from = text.indexOf('⟦')

  while (from !== -1) {
    const end = text.indexOf('⟧', from)

    if (end === -1) break
    found.push(text.slice(from, end + 1))
    from = text.indexOf('⟦', end)
  }

  return found.sort()
}

function parsed(reply: string): Record<string, unknown> {
  const start = reply.indexOf('{')
  const end = reply.lastIndexOf('}')

  if (start === -1 || end <= start) return {}

  try {
    const value: unknown = JSON.parse(reply.slice(start, end + 1))

    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function inOrder(text: string, parts: readonly string[]): boolean {
  let from = 0

  for (const part of parts) {
    const found = text.indexOf(part, from)

    if (found === -1) return false

    from = found + part.length
  }

  return true
}

function split(text: string): Sentence[] {
  const sentences: Sentence[] = []
  let current = ''
  let index = 0

  while (index < text.length) {
    const character = text[index]
    const following = text[index + 1] ?? ''

    current += character
    index += 1

    if (character === '\n' || ((character === '.' || character === '!' || character === '?') && (following === '' || following === ' ' || following === '\n'))) {
      let after = character === '\n' ? '\n' : ''

      if (after !== '') current = current.slice(0, -1)
      while (index < text.length && (text[index] === ' ' || text[index] === '\n')) {
        after += text[index]
        index += 1
      }
      sentences.push({ text: current, after })
      current = ''
    }
  }

  return current === '' ? sentences : [...sentences, { text: current, after: '' }]
}

function swapped(text: string, style: Style): string {
  return style.swaps.reduce((result, [from, to]) => result.split(from).join(to), text)
}

function guard(text: string, kept: string[]): string {
  const hold = (piece: string) => `⟦${kept.push(piece) - 1}⟧`
  const fences = text.split(FENCE)

  return fences
    .map((piece, index) => (index % 2 === 0 ? guardInline(piece, hold) : hold(`${FENCE}${piece}${index < fences.length - 1 ? FENCE : ''}`)))
    .join('')
}

function guardInline(text: string, hold: (piece: string) => string): string {
  const ticks = text.split(TICK)

  return ticks
    .map((piece, index) => (index % 2 === 0 ? guardWords(piece, hold) : hold(`${TICK}${piece}${index < ticks.length - 1 ? TICK : ''}`)))
    .join('')
}

function guardWords(text: string, hold: (piece: string) => string): string {
  let result = ''
  let word = ''

  const flush = () => {
    result += word.includes('/') || word.includes('\\') || word.includes('](') ? hold(word) : word
    word = ''
  }

  for (const character of text) {
    if (character === ' ' || character === '\n' || character === '\t') {
      flush()
      result += character
    } else {
      word += character
    }
  }
  flush()

  return result
}

function restore(text: string, kept: readonly string[]): string | undefined {
  let restored = text

  for (const [index, piece] of kept.entries()) {
    const placeholder = `⟦${index}⟧`

    if (restored.split(placeholder).length !== 2) return undefined

    restored = restored.replace(placeholder, () => piece)
  }

  return restored.includes('⟦') ? undefined : restored
}

async function readOwn($: EngineInterface, path: string): Promise<string> {
  return (await $.fs.read(`${$.plugin.root}/${path}`)).trim()
}

function withoutLines(text: string, phrases: ReadonlySet<string>): string {
  return text.split('\n').filter(line => ![...phrases].some(phrase => phrase !== '' && line.includes(phrase))).join('\n')
}

function section($: EngineInterface, name: string, text: string): PromptComposeSection {
  return { id: `${$.plugin.name}:${name}`, scope: 'session', text }
}

function namesIn(value: PluginOptions[string] | undefined): ReadonlySet<string> {
  return new Set(typeof value === 'object' ? value : [])
}
