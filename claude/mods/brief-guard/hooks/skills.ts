import type { EngineInterface } from 'claude-code'

const REFERENCE_DIRS = ['reference', 'references']
const SKILL_OWN_FILES = /^(skill|license|readme)\b/i

export type SkillReferences = { files: string[]; isRead: boolean; isReminded: boolean }

export const skillBaseOf = (text: string) => /Base directory for this skill: (.+)/.exec(text)?.[1]?.trim()

async function markdownIn($: EngineInterface, dir: string, separator: string, keep: (name: string) => boolean) {
  if (!(await $.fs.exists(dir))) return []
  const entries = await $.fs.list(dir)
  return entries.filter(entry => entry.kind === 'file' && /\.md$/i.test(entry.name) && keep(entry.name)).map(entry => `${dir}${separator}${entry.name}`)
}

export async function referenceFilesOf($: EngineInterface, base: string) {
  const separator = base.includes('\\') ? '\\' : '/'
  const inReferenceDirs = await Promise.all(REFERENCE_DIRS.map(dir => markdownIn($, `${base}${separator}${dir}`, separator, () => true)))
  const besideSkill = await markdownIn($, base, separator, name => !SKILL_OWN_FILES.test(name))
  return [...inReferenceDirs.flat(), ...besideSkill]
}

const samePath = (a: string, b: string) => a.replace(/\\/g, '/').toLowerCase() === b.replace(/\\/g, '/').toLowerCase()

export const markReferenceRead = (skills: Map<string, SkillReferences>, path: string) => {
  for (const skill of skills.values()) if (skill.files.some(file => samePath(file, path))) skill.isRead = true
}

export const takeUnremindedSkills = (skills: Map<string, SkillReferences>) => {
  const unread = [...skills].filter(([, skill]) => !skill.isReminded && !skill.isRead && skill.files.length > 0)
  for (const [, skill] of unread) skill.isReminded = true
  if (unread.length === 0) return undefined
  return { names: unread.map(([name]) => name).join(' and '), files: unread.flatMap(([, skill]) => skill.files) }
}
