import type { PluginOptions, ToolDescribeResult } from 'claude-code'

type Binding = readonly [skill: string, model: string]

const BINDING = '='

export const namesIn = (value: PluginOptions[string] | undefined): ReadonlySet<string> =>
  new Set(typeof value === 'object' ? value : [])

export const bindingsIn = (value: PluginOptions[string] | undefined): readonly Binding[] =>
  [...namesIn(value)].flatMap(entry => {
    const [skill = '', model = ''] = entry.split(BINDING)

    return skill === '' || model === '' ? [] : [[skill, model] as const]
  })

export const placed = (
  described: ToolDescribeResult,
  isDeferred: boolean | undefined,
): ToolDescribeResult => (isDeferred === undefined ? described : { ...described, isDeferred })
