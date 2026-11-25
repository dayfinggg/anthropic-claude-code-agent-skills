import type { PluginOptions, ToolDescribeResult } from 'claude-code'

export const namesIn = (value: PluginOptions[string] | undefined): ReadonlySet<string> =>
  new Set(typeof value === 'object' ? value : [])

export const placed = (
  described: ToolDescribeResult,
  isDeferred: boolean | undefined,
): ToolDescribeResult => (isDeferred === undefined ? described : { ...described, isDeferred })
