import type { EngineInterface, On, PluginOptions } from 'claude-code'
import type { CommitGateEntry } from '../types'
import { withoutHereDocumentBodies } from './shell-text'

export type CommitGateMode = 'off' | 'observe' | 'enforce'

const MODES: readonly CommitGateMode[] = ['off', 'observe', 'enforce']

const VERIFYING_SKILL = /^(?:verify|run|code-review)(?:-[\w-]+)?$/

const GIT_COMMIT = /(?:^|[\s;&|({])git(?:\s+(?:-[Cc]\s+(?:"[^"]*"|'[^']*'|\S+)|--[\w-]+(?:=\S+)?|-[A-Za-z]))*\s+commit(?=$|[\s;&|)])/m

const REUSED_MESSAGE = /\s(?:--no-edit\b|--fixup[=\s]|--squash[=\s]|--reuse-message[=\s]|-C\s)/

const VERIFIED_TRAILER = /(?:^|-m[ \t]*\$?["'])[ \t]*Verified:[ \t]*\S/m

const MESSAGE_FILE = /\s(?:-F[ \t]*|--file[=\s])("[^"]+"|'[^']+'|[^\s;&|]+)/

const SHELL_ASSIGNMENT = /(?:^|[\s;&|(])([A-Za-z_]\w*)=("[^"]*"|'[^']*'|[^\s;&|)]*)/g

const SHELL_VARIABLE = /\$(?:\{(\w+)\}|(\w+))/g

const LEFT_FOR_THE_SHELL = /[$`]/

const GIT_BASH_DRIVE = /^\/([A-Za-z])\//

const BLOCKS_BEFORE_LETTING_THROUGH = 2

const LOG_KEY = 'commit-gate'

const LOG_LIMIT = 200

const verifyingSkillRan = { plugin: 'concise', key: 'verifyingSkillRan' } as const

const blockedCommits = { plugin: 'concise', key: 'blockedCommits' } as const

const REFUSAL = [
  'concise commit gate: no verify, run or code-review skill ran in this session, and the commit message has no Verified: trailer.',
  "Run the change end to end with the project's verify skill or the run skill, or review the diff with /code-review, then commit again.",
  'If you checked the change another way or not at all, say so in a trailer, such as "Verified: npm test, 48 passed" or "Verified: none (docs only)".',
].join(' ')

export const commitGateMode = (options: PluginOptions): CommitGateMode =>
  MODES.find(mode => mode === options.commit_gate) ?? 'observe'

const unquoted = (path: string) => path.replace(/^(["'])(.*)\1$/, '$2')

const commitArguments = (command: string) => {
  const typed = withoutHereDocumentBodies(command)
  const found = GIT_COMMIT.exec(typed)
  return found === null ? undefined : typed.slice(found.index + found[0].length)
}

const withShellVariables = (path: string, command: string) => {
  const assigned = new Map([...command.matchAll(SHELL_ASSIGNMENT)].map(found => [found[1], unquoted(found[2] ?? '')]))
  return path.replace(SHELL_VARIABLE, (reference, braced?: string, bare?: string) => assigned.get(braced ?? bare) ?? reference)
}

const firstReadable = async ($: EngineInterface, paths: readonly string[]) => {
  for (const path of paths) {
    const text = await $.fs.read(path).catch(() => undefined)
    if (typeof text === 'string') return text
  }
  return ''
}

const messageFileLacksTrailer = async ($: EngineInterface, command: string, args: string) => {
  const named = MESSAGE_FILE.exec(args)?.[1]
  if (named === undefined || unquoted(named) === '-') return true
  const path = withShellVariables(unquoted(named), command)
  if (LEFT_FOR_THE_SHELL.test(path)) return false
  const onWindowsDrive = GIT_BASH_DRIVE.test(path) ? [path.replace(GIT_BASH_DRIVE, '$1:/')] : []
  return !VERIFIED_TRAILER.test(await firstReadable($, [path, ...onWindowsDrive]))
}

const isUnverifiedCommit = async ($: EngineInterface, command: string) => {
  const args = commitArguments(command)
  if (args === undefined || REUSED_MESSAGE.test(args)) return false
  if ((await $.state.get(verifyingSkillRan)).value === true) return false
  if (VERIFIED_TRAILER.test(command)) return false
  return messageFileLacksTrailer($, command, args)
}

const record = async ($: EngineInterface, outcome: CommitGateEntry['outcome'], command: string) => {
  const stored = await $.store.get(LOG_KEY)
  const earlier = Array.isArray(stored) ? stored.slice(-(LOG_LIMIT - 1)) : []
  const entry: CommitGateEntry = {
    at: new Date(await $.clock.now()).toISOString(),
    outcome,
    cwd: await $.session.cwd(),
    command: command.slice(0, 300),
  }
  await $.store.set(LOG_KEY, [...earlier, entry])
}

const enforce = async ($: EngineInterface, command: string) => {
  const blocked = (await $.state.get(blockedCommits)).value ?? 0
  if (blocked >= BLOCKS_BEFORE_LETTING_THROUGH) {
    await $.state.set(blockedCommits, 0)
    await record($, 'let through', command)
    return true
  }
  await $.state.set(blockedCommits, blocked + 1)
  await record($, 'blocked', command)
  return false
}

const judge = async ($: EngineInterface, mode: CommitGateMode, command: string) => {
  if (!(await isUnverifiedCommit($, command))) return undefined
  if (mode === 'observe') {
    await record($, 'would block', command)
    return undefined
  }
  return (await enforce($, command)) ? undefined : { deny: REFUSAL }
}

export const registerCommitGate = (on: On, mode: CommitGateMode) => {
  if (mode === 'off') return

  on('skill.prompt', async ($, e, next) => {
    const expanded = await next(e)
    if (VERIFYING_SKILL.test(e.skill.split(':').at(-1) ?? '')) await $.state.set(verifyingSkillRan, true)
    return expanded
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const refusal = await judge($, mode, e.command)
    return refusal === undefined ? next(e) : refusal
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'PowerShell' }, async ($, e, next) => {
    const refusal = await judge($, mode, e.command)
    return refusal === undefined ? next(e) : refusal
  }).catch(($, e, next) => next(e))
}
