import type { EngineInterface, PromptComposeSection } from 'claude-code'

type Files = ReadonlyMap<string, string>
type Rules = ReadonlyMap<string, string | undefined>
type Library = { shared: Files; models: readonly (readonly [string, Files])[] }

const RULES = 'instructions/rules'
const REMINDERS = 'instructions/reminders'
const NOTICES = 'instructions/notices'
const SHARED = 'shared'
const FAMILIES = '+'
const EXTENSION = '.md'
const DEFERRED_TOOLS = '{{deferred_tools}}'
const SECTIONS = '{{sections}}'
const HEADINGS = '{{headings}}'
const TOOLS = 'instructions/tools'
const TOOL_REMINDERS = 'instructions/tool-reminders'
export const EVERY_TOOL = 'every-tool'
const ATTACHMENTS = 'instructions/attachments'
const NAMES = '{{names}}'
const DESCRIBED = '{{described}}'
const ITEM = '- '
const NAME_END = ': '
const NO_FILES: Files = new Map()

let toolDescriptions: Promise<Files> | undefined
let attachmentTemplates: Promise<Files> | undefined
const toolReminders = new Map<string, Promise<Rules>>()

const serves = (folder: string, model: string): boolean =>
  folder.split(FAMILIES).some(family => model.includes(family))

const filesFor = ({ shared, models }: Library, model: string): Files =>
  new Map([
    ...shared,
    ...models.filter(([folder]) => serves(folder, model)).flatMap(([, files]) => [...files]),
  ])

const render = (text: string | undefined, deferredTools: readonly string[]): string | undefined => {
  if (text === undefined || text === '') return undefined
  if (!text.includes(DEFERRED_TOOLS)) return text

  return deferredTools.length === 0
    ? undefined
    : text.replaceAll(DEFERRED_TOOLS, deferredTools.join('\n'))
}

const rulesFor = (library: Library, model: string, deferredTools: readonly string[]): Rules => {
  const files = filesFor(library, model)

  return new Map([...files.keys()].sort().map(name => [name, render(files.get(name), deferredTools)]))
}

const inOrder =
  (order: readonly string[]) =>
  ([left]: readonly [string, unknown], [right]: readonly [string, unknown]): number =>
    order.indexOf(left) - order.indexOf(right)

const headingsOf = ({ shared, models }: Library, name: string): string[] =>
  [shared, ...models.map(([, files]) => files)].flatMap(files => {
    const [heading] = (files.get(name) ?? '').split('\n', 1)

    return heading === undefined || heading === '' ? [] : [heading]
  })

async function readFolder($: EngineInterface, folder: string): Promise<Files> {
  const names = (await $.fs.list(folder))
    .filter(entry => entry.kind === 'file' && entry.name.endsWith(EXTENSION))
    .map(entry => entry.name)
  const texts = await Promise.all(names.map(name => $.fs.read(`${folder}/${name}`)))

  return new Map(
    names.map((name, index) => [name.slice(0, -EXTENSION.length), (texts[index] ?? '').trim()]),
  )
}

async function readLibrary($: EngineInterface, path: string): Promise<Library> {
  const root = `${$.plugin.root}/${path}`
  const folders = (await $.fs.list(root))
    .filter(entry => entry.kind === 'dir')
    .map(entry => entry.name)
    .sort()
  const files = await Promise.all(folders.map(folder => readFolder($, `${root}/${folder}`)))
  const library = folders.map((folder, index) => [folder, files[index] ?? NO_FILES] as const)

  return {
    shared: library.find(([folder]) => folder === SHARED)?.[1] ?? NO_FILES,
    models: library.filter(([folder]) => folder !== SHARED),
  }
}

export async function applyRules(
  $: EngineInterface,
  model: string,
  deferredTools: readonly string[],
  excluded: ReadonlySet<string>,
  order: readonly string[],
  sections: readonly PromptComposeSection[],
): Promise<PromptComposeSection[]> {
  const rules = rulesFor(await readLibrary($, RULES), model, deferredTools)
  const engineIds = new Set(sections.map(section => section.id))
  const kept = sections
    .filter(section => !excluded.has(section.id))
    .map(section => ({ ...section, text: rules.get(section.id) ?? section.text }))
  const added = [...rules]
    .sort(inOrder(order))
    .flatMap(([name, text]) => {
      const section: PromptComposeSection = {
        id: `${$.plugin.name}:${name}`,
        scope: 'session',
        text: text ?? '',
      }

      return text === undefined || engineIds.has(name) ? [] : [section]
    })

  return [...kept, ...added]
}

export function loadToolDescriptions($: EngineInterface): Promise<Files> {
  toolDescriptions ??= readFolder($, `${$.plugin.root}/${TOOLS}`)

  return toolDescriptions
}

export function loadToolReminders($: EngineInterface, model: string): Promise<Rules> {
  const cached = toolReminders.get(model)

  if (cached !== undefined) return cached

  const loaded = readLibrary($, TOOL_REMINDERS).then(library => rulesFor(library, model, []))
  toolReminders.set(model, loaded)

  return loaded
}

export async function loadReminders($: EngineInterface, model: string): Promise<string[]> {
  const reminders = rulesFor(await readLibrary($, REMINDERS), model, [])

  return [...reminders.values()].flatMap(text => (text === undefined ? [] : [text]))
}

export async function loadSwitchNotice(
  $: EngineInterface,
  model: string,
  deferredTools: readonly string[],
): Promise<string | undefined> {
  const library = await readLibrary($, RULES)
  const names = new Set(library.models.flatMap(([, files]) => [...files.keys()]))

  if (names.size === 0) return undefined

  const rules = [...rulesFor(library, model, deferredTools)].filter(([name]) => names.has(name))
  const current = rules.flatMap(([, text]) => (text === undefined ? [] : [text]))
  const retired = [...names]
    .sort()
    .filter(name => !rules.some(([rule, text]) => rule === name && text !== undefined))
    .flatMap(name => headingsOf(library, name))
  const notices = await readFolder($, `${$.plugin.root}/${NOTICES}`)
  const retiredNote = (notices.get('retired-sections') ?? '').replaceAll(
    HEADINGS,
    [...new Set(retired)].join('\n'),
  )
  const sections = retired.length === 0 ? current : [...current, retiredNote]

  return (notices.get('model-switch') ?? '').replaceAll(SECTIONS, sections.join('\n\n'))
}

export async function loadAgentRules(
  $: EngineInterface,
  model: string,
  order: readonly string[],
  excluded: ReadonlySet<string>,
): Promise<string | undefined> {
  const rules = rulesFor(await readLibrary($, RULES), model, [])
  const sections = [...rules]
    .filter(([name]) => !excluded.has(name))
    .sort(inOrder(order))
    .flatMap(([, text]) => (text === undefined ? [] : [text]))

  if (sections.length === 0) return undefined

  const notices = await readFolder($, `${$.plugin.root}/${NOTICES}`)

  return (notices.get('agent-rules') ?? SECTIONS).replaceAll(SECTIONS, sections.join('\n\n'))
}

export async function rewriteAttachment(
  $: EngineInterface,
  type: string,
  text: string,
  hiddenSkills: ReadonlySet<string>,
): Promise<string> {
  attachmentTemplates ??= readFolder($, `${$.plugin.root}/${ATTACHMENTS}`)

  const template = (await attachmentTemplates).get(type)

  if (template === undefined) return text

  const own = `${ITEM}${$.plugin.name}:`
  const skillOf = (line: string): string => line.slice(own.length).split(NAME_END, 1)[0] ?? ''
  const items = text.split('\n').filter(line => line.startsWith(ITEM))
  const described = items
    .filter(line => line.startsWith(own))
    .filter(line => !hiddenSkills.has(skillOf(line)))
  const names = items
    .filter(line => !line.startsWith(own))
    .map(line => line.slice(ITEM.length).split(NAME_END, 1)[0] ?? '')

  return template
    .replaceAll(DESCRIBED, described.join('\n'))
    .replaceAll(NAMES, names.join('\n'))
}
