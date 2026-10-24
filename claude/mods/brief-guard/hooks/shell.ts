const FILE_READERS = ['cat', 'head', 'tail', 'less', 'more', 'Get-Content', 'gc', 'type']
const FILE_WRITERS = ['Set-Content', 'Add-Content', 'Out-File', 'tee']
const ECHO_WRITERS = ['printf', 'echo']
const PIPED_WRITERS = ['tee', 'Out-File', 'Set-Content', 'Add-Content']
const FILE_REDIRECT = /(^|[^\d&])>>?\s*(?!\/dev\/null|&)\S/
const SCRIPT_RUNNERS = /^(python3?|node|perl|ruby|php)$/
const INLINE_SCRIPT_FLAG = /^-[a-zA-Z]*[ceE]$/
const LOG_FILES = /\.(jsonl|log)\b/i
const REMOTE_PROGRAMS = /\b(ssh|scp|docker|kubectl)\b/
const HEREDOC = /<<-?\s*'?(\w+)'?[\s\S]*?\n\1\b/g
const QUOTED = /'[^']*'|"[^"]*"/g
const LEADING_CD_OR_GROUP = /^\s*(cd\s+\S+|\(|\{)\s*/

const hasOperand = (words: string[]) => words.slice(1).some(word => !word.startsWith('-') && !/^\d+$/.test(word))

const programOf = (stage: string): string | undefined => {
  const words = stage.trim().split(/\s+/).filter(word => !/^\w+=/.test(word))
  const [name = ''] = words
  if (FILE_READERS.includes(name) && hasOperand(words) && !LOG_FILES.test(stage)) return name
  if (FILE_WRITERS.includes(name)) return name
  if (ECHO_WRITERS.includes(name) && FILE_REDIRECT.test(stage)) return `${name} >`
  if (name === 'sed' && words.some(word => /^-[a-zA-Z]*[ni]/.test(word))) return 'sed'
  if (name === 'awk' && words.length > 2) return 'awk'
  if (SCRIPT_RUNNERS.test(name) && words.slice(1).some(word => word === '-' || INLINE_SCRIPT_FLAG.test(word) || word.startsWith('<<'))) return `inline ${name}`
  return undefined
}

const programOfPart = (part: string) => {
  const [first = '', ...piped] = part.split('|')
  return programOf(first.replace(LEADING_CD_OR_GROUP, '')) ?? piped.map(programOf).find(program => program !== undefined && PIPED_WRITERS.includes(program))
}

export const localFileProgram = (command: string): string | undefined => {
  const body = command.replace(HEREDOC, '<<heredoc').replace(QUOTED, ' quoted ')
  return body
    .split(/&&|\|\||;|\n/)
    .filter(part => !REMOTE_PROGRAMS.test(part))
    .map(programOfPart)
    .find(program => program !== undefined)
}
