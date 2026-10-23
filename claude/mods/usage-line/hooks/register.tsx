import { atom, read, update } from 'claude-code'
import type {
  ElementConstructor,
  EngineInterface,
  Register,
  RenderChildren,
  SessionCost,
  SessionRateLimit,
  TextProps,
  TurnUsage,
} from 'claude-code'

import type { LimitGauge, TokenKind, TokenTally, TokenTotals, UsageSummary } from '../types'
import { CACHE_READ_ICON, CACHE_WRITE_ICON, COST_ICON, iconForLimit, INPUT_ICON, OUTPUT_ICON } from './icons'
import type { Icon } from './icons'
import { priceForModel } from './pricing'

const SEPARATOR = '   '
const HIDDEN_LIMITS = new Set(['spend_limit'])
const ICON_SIZE = 14
const BAR_CELLS = 10
const BAR_FILLED = '▰'
const BAR_EMPTY = '▱'
const TOKENS_PER_MILLION = 1_000_000
const FILL_COLORS = [
  { from: 0.8, color: '#ef4444' },
  { from: 0.7, color: '#f97316' },
  { from: 0.4, color: '#eab308' },
]

const summary = atom({ plugin: 'usage-line', key: 'summary' } as const, null as UsageSummary)
const NO_TALLY: TokenTally = { tokens: 0, usd: 0 }
const NO_TOKENS: TokenTotals = { input: NO_TALLY, output: NO_TALLY, cacheRead: NO_TALLY, cacheWrite: NO_TALLY }
const tokenUsage = atom({ plugin: 'usage-line', key: 'tokenUsage' } as const, NO_TOKENS)

type BandItem = { key: string; icon: Icon; label: string; draw: (Text: ElementConstructor<TextProps>) => RenderChildren }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    $.ui.status(undefined)
    await refreshSummary($)

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const response = yield* next(e)
    const { usage } = response

    if (usage !== null) {
      await update($, tokenUsage, totals => addUsage(totals ?? NO_TOKENS, usage))
    }

    if (e.agentId === undefined) {
      await refreshSummary($)
    }

    return response
  })

  on('session.measure', async ($, e, next) => {
    await update($, summary, () => summarizeUsage(e.rateLimits, e.cost))

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const usage = await read($, summary)

    if (e.props.hasSurvey || usage === null) {
      return next(e)
    }

    const rows = bandRows(usage, await read($, tokenUsage))

    if (e.surface === 'desktop') {
      const { Box, Svg, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="column">
          {rows.map((row, rowIndex) => (
            <Box key={`row-${rowIndex}`} flexDirection="row" alignItems="center" flexWrap="wrap">
              {row.flatMap((item, index) => [
                index === 0 ? null : <Text key={`separator-${item.key}`}>{SEPARATOR}</Text>,
                <Box key={item.key} flexDirection="row" alignItems="center" flexShrink={0}>
                  <Svg source={item.icon.svg} alt={item.label} width={ICON_SIZE} height={ICON_SIZE} />
                  <Text>
                    {' '}
                    <Text dimColor>{item.label}</Text> {item.draw(Text)}
                  </Text>
                </Box>,
              ])}
            </Box>
          ))}
        </Box>
      )
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {rows.map((row, rowIndex) => (
          <Text key={`row-${rowIndex}`}>
            {row.flatMap((item, index) => [
              index === 0 ? '' : SEPARATOR,
              `${item.icon.emoji} `,
              <Text dimColor>{item.label}</Text>,
              ' ',
              item.draw(Text),
            ])}
          </Text>
        ))}
      </Box>
    )
  })
}

function bandRows(usage: NonNullable<UsageSummary>, tokens: TokenTotals): BandItem[][] {
  const limits = usage.limits.map(
    (limit): BandItem => ({
      key: limit.kind,
      icon: iconForLimit(limit.kind),
      label: limit.label,
      draw: Text => drawGauge(Text, limit),
    }),
  )
  const cost: BandItem[] =
    usage.costUsd === null ? [] : [valueItem('cost', COST_ICON, 'Cost', formatUsd(usage.costUsd))]
  const tokenItems = [
    valueItem('input', INPUT_ICON, 'Input', formatTally(tokens.input)),
    valueItem('output', OUTPUT_ICON, 'Output', formatTally(tokens.output)),
    valueItem('cache-read', CACHE_READ_ICON, 'Cache read', formatTally(tokens.cacheRead)),
    valueItem('cache-write', CACHE_WRITE_ICON, 'Cache write', formatTally(tokens.cacheWrite)),
  ]

  return [limits, [...cost, ...tokenItems]].filter(row => row.length > 0)
}

function valueItem(key: string, icon: Icon, label: string, value: string): BandItem {
  return { key, icon, label, draw: () => value }
}

function addUsage(totals: TokenTotals, usage: TurnUsage): TokenTotals {
  const price = priceForModel(usage.model)
  const add = (kind: TokenKind, tokens: number): TokenTally => ({
    tokens: totals[kind].tokens + tokens,
    usd: totals[kind].usd + (price === undefined ? 0 : (tokens * price[kind]) / TOKENS_PER_MILLION),
  })

  return {
    input: add('input', usage.input_tokens),
    output: add('output', usage.output_tokens),
    cacheRead: add('cacheRead', usage.cache_read_input_tokens),
    cacheWrite: add('cacheWrite', usage.cache_creation_input_tokens),
  }
}

function drawGauge(Text: ElementConstructor<TextProps>, limit: LimitGauge) {
  const color = colorForFill(limit.fill)
  const filledCells = Math.min(BAR_CELLS, Math.max(0, Math.round(limit.fill * BAR_CELLS)))

  return [
    <Text color={color}>{BAR_FILLED.repeat(filledCells)}</Text>,
    <Text dimColor>{BAR_EMPTY.repeat(BAR_CELLS - filledCells)}</Text>,
    ' ',
    <Text color={color}>{limit.value}</Text>,
  ]
}

async function refreshSummary($: EngineInterface): Promise<void> {
  const { rateLimits, cost } = await $.session.usage()
  await update($, summary, () => summarizeUsage(rateLimits, cost))
}

function summarizeUsage(rateLimits: SessionRateLimit[], cost: SessionCost | undefined): UsageSummary {
  return {
    limits: rateLimits.filter(limit => !HIDDEN_LIMITS.has(limit.kind)).map(describeLimit),
    costUsd: cost?.usd ?? null,
  }
}

function describeLimit(limit: SessionRateLimit): LimitGauge {
  return {
    kind: limit.kind,
    label: iconForLimit(limit.kind).label,
    value: `${limit.percentUsed}%`,
    fill: limit.percentUsed / 100,
  }
}

function colorForFill(fill: number): string | undefined {
  return FILL_COLORS.find(level => fill > level.from)?.color
}

function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`
}

function formatTally(tally: TokenTally): string {
  return `${formatTokens(tally.tokens)} tok (${formatUsd(tally.usd)})`
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${Number((tokens / 1_000_000).toFixed(1))}M`
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`

  return `${tokens}`
}
