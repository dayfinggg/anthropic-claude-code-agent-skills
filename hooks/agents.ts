import type { EngineInterface } from 'claude-code'

import { loadAgentRules } from './instructions'

export const FORK = ''

const WAIT_MS = 2000
const models = new Map<string, string>()
const waiters = new Map<string, (model: string) => void>()
const instructed = new Set<string>()

export const noteAgent = (agentId: string | undefined, model: string): void => {
  if (agentId === undefined) return

  models.set(agentId, model)
  waiters.get(agentId)?.(model)
  waiters.delete(agentId)
}

async function modelOf($: EngineInterface, agentId: string): Promise<string> {
  const known = models.get(agentId)

  if (known !== undefined) return known

  const noted = new Promise<string>(resolve => {
    waiters.set(agentId, resolve)
  })
  const sessionModel = $.clock.sleep(WAIT_MS).then(() => $.session.model())

  return Promise.race([noted, sessionModel])
}

export async function instructAgent(
  $: EngineInterface,
  agentId: string,
  order: readonly string[],
  excluded: ReadonlySet<string>,
): Promise<void> {
  if (instructed.has(agentId)) return
  instructed.add(agentId)

  const model = await modelOf($, agentId)

  if (model === FORK) return

  const text = await loadAgentRules($, model, order, excluded)

  if (text === undefined) return

  await $.session.append({ message: { type: 'user', content: [{ type: 'text', text }] }, agentId })
}
