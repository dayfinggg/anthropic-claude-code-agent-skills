import type { TokenKind } from '../types'

export type PricePerMillion = Record<TokenKind, number>

const CACHE_WRITE_SHARE = 1.25

function price(input: number, output: number, cacheRead: number): PricePerMillion {
  return { input, output, cacheRead, cacheWrite: input * CACHE_WRITE_SHARE }
}

const MODEL_PRICES: [prefix: string, price: PricePerMillion][] = [
  ['claude-fable-5-1', price(10, 50, 0.25)],
  ['claude-mythos-5-1', price(10, 50, 0.25)],
  ['claude-fable-5', price(10, 50, 1)],
  ['claude-mythos-5', price(10, 50, 1)],
  ['claude-opus-5-5', price(4, 20, 0.2)],
  ['claude-opus-5', price(5, 25, 0.5)],
  ['claude-opus-4', price(5, 25, 0.5)],
  ['claude-sonnet-5', price(2, 10, 0.2)],
  ['claude-sonnet-4', price(3, 15, 0.3)],
  ['claude-haiku-5', price(0.1, 0.5, 0.01)],
  ['claude-haiku-4', price(1, 5, 0.1)],
]

export function priceForModel(model: string): PricePerMillion | undefined {
  return MODEL_PRICES.find(([prefix]) => model.startsWith(prefix))?.[1]
}
