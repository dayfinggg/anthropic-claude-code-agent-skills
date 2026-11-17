import type { EngineInterface, On, PluginOptions } from 'claude-code'
import type { PrivacyGateEntry } from '../types'
import { withoutHereDocumentBodies } from './shell-text'

export type PrivacyGateMode = 'off' | 'observe' | 'enforce'

const MODES: readonly PrivacyGateMode[] = ['off', 'observe', 'enforce']

const GIT_PUSH = /(?:^|[\s;&|({])git((?:\s+(?:-C\s+(?:"[^"]*"|'[^']*'|\S+)|-c\s+\S+|--[\w-]+(?:=\S+)?))*)\s+push(?=$|[\s;&|)])/m

const GIT_DIRECTORY = /-C\s+("[^"]*"|'[^']*'|\S+)/

const LEADING_CD = /^\s*cd\s+("[^"]*"|'[^']*'|[^\s;&|]+)\s*(?:&&|;)/

const GH_POST = /(?:^|[\s;&|({])gh\s+(?:pr|issue|release)\s+(?:create|edit|comment|review)\b/

const BODY_FILE = /\s(?:-F|--body-file|--notes-file)[=\s]+("[^"]+"|'[^']+'|[^\s;&|]+)/

const LOG_KEY = 'privacy-gate'

const LOG_LIMIT = 200

const refusal = (found: readonly string[]) =>
  [
    `concise privacy gate: this would publish a private path of this computer (${found.join(', ')}).`,
    'Replace it with a neutral stand-in such as C:\\Users\\user\\project or /home/user/project in the commit, file or text, rewrite the unpushed commits that hold it, then try again.',
    'If the user asked for this path to be published, ask them to set the privacy_gate option to off for the step.',
  ].join(' ')

export const privacyGateMode = (options: PluginOptions): PrivacyGateMode =>
  MODES.find(mode => mode === options.privacy_gate) ?? 'enforce'

const unquoted = (text: string) => text.replace(/^(["'])(.*)\1$/, '$2')

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const accountName = async ($: EngineInterface) => {
  const named = (await $.env.get('USERNAME')) ?? (await $.env.get('USER'))
  if (named) return named
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? ''
  return home.split(/[\\/]+/).filter(Boolean).at(-1)
}

const privatePaths =(text: string, account: string) => {
  const homePath = new RegExp(`(?<![A-Za-z0-9])(?:Users|home)(?:\\\\+|/)${escaped(account)}(?![A-Za-z0-9_-])`, 'gi')
  return [...new Set([...text.matchAll(homePath)].map(found => found[0]))]
}

const repositoryOf = async ($: EngineInterface, command: string, gitOptions: string) => {
  const named = GIT_DIRECTORY.exec(gitOptions)?.[1] ?? LEADING_CD.exec(command)?.[1]
  return named === undefined ? $.session.cwd() : unquoted(named)
}

const unpushedText = async ($: EngineInterface, cwd: string) => {
  const log = await $.process
    .run(['git', 'log', '-p', '--format=%B', '--branches', '--tags', '--not', '--remotes'], { cwd, timeoutMs: 20000 })
    .catch(() => undefined)
  return log?.exitCode === 0 ? log.stdout : ''
}

const postedText = async ($: EngineInterface, command: string) => {
  const named = BODY_FILE.exec(command)?.[1]
  if (named === undefined || unquoted(named) === '-') return command
  const body = await $.fs.read(unquoted(named)).catch(() => '')
  return `${command}\n${typeof body === 'string' ? body : ''}`
}

const outgoingText = async ($: EngineInterface, command: string) => {
  const typed = withoutHereDocumentBodies(command)
  const push = GIT_PUSH.exec(typed)
  if (push !== null) return unpushedText($, await repositoryOf($, typed, push[1] ?? ''))
  return GH_POST.test(typed) ? postedText($, command) : undefined
}

const record = async ($: EngineInterface, outcome: PrivacyGateEntry['outcome'], command: string, found: readonly string[]) => {
  const stored = await $.store.get(LOG_KEY)
  const earlier = Array.isArray(stored) ? stored.slice(-(LOG_LIMIT - 1)) : []
  const entry: PrivacyGateEntry = {
    at: new Date(await $.clock.now()).toISOString(),
    outcome,
    cwd: await $.session.cwd(),
    command: command.slice(0, 300),
    found: [...found],
  }
  await $.store.set(LOG_KEY, [...earlier, entry])
}

const judge = async ($: EngineInterface, mode: PrivacyGateMode, command: string) => {
  const text = await outgoingText($, command)
  if (text === undefined) return undefined
  const account = await accountName($)
  if (!account) return undefined
  const found = privatePaths(text, account)
  if (found.length === 0) return undefined
  if (mode === 'observe') {
    await record($, 'would block', command, found)
    return undefined
  }
  await record($, 'blocked', command, found)
  return { deny: refusal(found) }
}

export const registerPrivacyGate = (on: On, mode: PrivacyGateMode) => {
  if (mode === 'off') return

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const refused = await judge($, mode, e.command)
    return refused === undefined ? next(e) : refused
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'PowerShell' }, async ($, e, next) => {
    const refused = await judge($, mode, e.command)
    return refused === undefined ? next(e) : refused
  }).catch(($, e, next) => next(e))
}
