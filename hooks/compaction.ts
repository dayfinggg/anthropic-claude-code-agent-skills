import type { EngineInterface, SessionMessage, ToolUseSummary } from 'claude-code'

import { loadNotice } from './instructions'

const SKILL_TOOL = 'Skill'
const SUMMARY_LANGUAGE = 'summary-language'
const SKILLS_AFTER_SUMMARY = 'skills-after-summary'
const SKILLS = '{{skills}}'
const ITEM = '- '
const RESTORED_SKILL = '### Skill: '
const SKILL_NAME = /^[\w.:/-]{1,128}$/

let skillsBeforeSummary: readonly string[] = []

const loadedSkill = ({ tool, input, isError }: ToolUseSummary): string[] => {
  const { skill } = input

  return tool === SKILL_TOOL && isError !== true && typeof skill === 'string' && SKILL_NAME.test(skill)
    ? [skill]
    : []
}

const skillsLoadedIn = (messages: readonly SessionMessage[]): string[] => [
  ...new Set(messages.flatMap(message => message.toolUses).flatMap(loadedSkill)),
]

export const noteSkillsBeforeSummary = (messages: readonly SessionMessage[]): void => {
  skillsBeforeSummary = skillsLoadedIn(messages)
}

export const forgetSkillsBeforeSummary = (): void => {
  skillsBeforeSummary = []
}

export const forgetRestoredSkills = (restored: string): void => {
  skillsBeforeSummary = skillsBeforeSummary.filter(
    skill => !restored.includes(`${RESTORED_SKILL}${skill}\n`),
  )
}

export async function summaryInstructions(
  $: EngineInterface,
  asked: string | undefined,
): Promise<string | undefined> {
  const language = await loadNotice($, SUMMARY_LANGUAGE)
  const parts = [asked, language].flatMap(text => (text === undefined ? [] : [text]))

  return parts.length === 0 ? undefined : parts.join('\n\n')
}

export async function withSkillsBeforeSummary($: EngineInterface, listing: string): Promise<string> {
  if (skillsBeforeSummary.length === 0) return listing

  const skills = skillsBeforeSummary.map(skill => `${ITEM}${skill}`).join('\n')
  const notice = await loadNotice($, SKILLS_AFTER_SUMMARY)

  forgetSkillsBeforeSummary()

  return notice === undefined ? listing : `${listing}\n\n${notice.replaceAll(SKILLS, skills)}`
}
