import type { EngineInterface, On, PluginOptions } from 'claude-code'
import type { WaitGateEntry } from '../types'
import { withoutHereDocumentBodies } from './shell-text'

export type WaitGateMode = 'off' | 'observe' | 'enforce'

const MODES: readonly WaitGateMode[] = ['off', 'observe', 'enforce']

const SLEEP =
  /\bsleep\s+(\d+(?:\.\d+)?)([smh]?)(?![\w.])|Start-Sleep\s+(?:-Seconds\s+|-s\s+)?(\d+(?:\.\d+)?)(?![\w.])|Start-Sleep\s+-Milliseconds\s+(\d+)/gi

const COUNTED_LOOP = /\bfor\s+\w+\s+in\s+([^;\n]+?)\s*(?:;|\n)\s*do\b([\s\S]*?)(?:;|\n)\s*done\b/g

const OPEN_LOOP =
  /\b(?:until|while)\b(?!\s+(?:read|IFS=))[^\n]*?(?:;|\n)\s*do\b[\s\S]*?\bsleep\b|\b(?:while|until)\s*\([^)]*\)\s*\{[^}]*Start-Sleep|\bdo\s*\{[^}]*Start-Sleep/i

const SEQUENCE = /^\$\(\s*seq\s+(?:\d+\s+)?(\d+)\s*\)$|^`seq\s+(?:\d+\s+)?(\d+)`$|^\{\d+\.\.(\d+)\}$/

const PLAIN_WORDS = /^[\w.-]+(?:\s+[\w.-]+)*$/

const SECONDS_IN: Record<string, number> = { '': 1, s: 1, m: 60, h: 3600 }

const LONGEST_FOREGROUND_WAIT_SECONDS = 60

const BLOCKS_BEFORE_LETTING_THROUGH = 2

const LOG_KEY = 'wait-gate'

const LOG_LIMIT = 200

const blockedWaits = { plugin: 'concise', key: 'blockedWaits' } as const

const REFUSAL = [
  'concise wait gate: this command would hold the session while it sleeps or polls for longer than a minute.',
  'Start the job with run_in_background and read its completion notice, watch a condition with the Monitor tool, or look once with a short command and carry on.',
  'A wait that ends within a minute may stay in the foreground.',
].join(' ')

export const waitGateMode = (options: PluginOptions): WaitGateMode => MODES.find(mode => mode === options.wait_gate) ?? 'observe'

const secondsSlept = (text: string) =>
  [...text.matchAll(SLEEP)].reduce(
    (total, [, shell, unit, powershell, milliseconds]) =>
      total + (shell ? Number(shell) * (SECONDS_IN[(unit ?? '').toLowerCase()] ?? 1) : powershell ? Number(powershell) : Number(milliseconds) / 1000),
    0,
  )

const roundsOf = (items: string) => {
  const counted = SEQUENCE.exec(items.trim())?.slice(1).find(count => count !== undefined)
  if (counted !== undefined) return Number(counted)
  return PLAIN_WORDS.test(items.trim()) ? items.trim().split(/\s+/).length : undefined
}

const longestWaitSeconds = (command: string) => {
  let inCountedLoops = 0
  const rest = withoutHereDocumentBodies(command).replace(COUNTED_LOOP, (_, items: string, body: string) => {
    inCountedLoops += (roundsOf(items) ?? 0) * secondsSlept(body)
    return ' '
  })
  return OPEN_LOOP.test(rest) ? Number.POSITIVE_INFINITY : inCountedLoops + secondsSlept(rest)
}

const record = async ($: EngineInterface, outcome: WaitGateEntry['outcome'], command: string) => {
  const stored = await $.store.get(LOG_KEY)
  const earlier = Array.isArray(stored) ? stored.slice(-(LOG_LIMIT - 1)) : []
  const entry: WaitGateEntry = {
    at: new Date(await $.clock.now()).toISOString(),
    outcome,
    cwd: await $.session.cwd(),
    command: command.slice(0, 300),
  }
  await $.store.set(LOG_KEY, [...earlier, entry])
}

const enforce = async ($: EngineInterface, command: string) => {
  const blocked = (await $.state.get(blockedWaits)).value ?? 0
  if (blocked >= BLOCKS_BEFORE_LETTING_THROUGH) {
    await $.state.set(blockedWaits, 0)
    await record($, 'let through', command)
    return true
  }
  await $.state.set(blockedWaits, blocked + 1)
  await record($, 'blocked', command)
  return false
}

const judge = async ($: EngineInterface, mode: WaitGateMode, command: string, inBackground: boolean | undefined) => {
  if (inBackground === true || longestWaitSeconds(command) <= LONGEST_FOREGROUND_WAIT_SECONDS) return undefined
  if (mode === 'observe') {
    await record($, 'would block', command)
    return undefined
  }
  return (await enforce($, command)) ? undefined : { deny: REFUSAL }
}

export const registerWaitGate = (on: On, mode: WaitGateMode) => {
  if (mode === 'off') return

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const refusal = await judge($, mode, e.command, e.run_in_background)
    return refusal === undefined ? next(e) : refusal
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'PowerShell' }, async ($, e, next) => {
    const refusal = await judge($, mode, e.command, e.run_in_background)
    return refusal === undefined ? next(e) : refusal
  }).catch(($, e, next) => next(e))
}
