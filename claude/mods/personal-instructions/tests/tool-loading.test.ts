import { expect, test } from 'claude-code/testing'

test('infrequently used tools stay searchable and preserve their descriptions', async ($, on) => {
  on('tool.describe', ($, e) => ({ description: e.description, isDeferred: e.isDeferred }))
  for (const tool of ['Artifact', 'ScheduleWakeup', 'Workflow', 'ReportFindings', 'SearchPlugins', 'SuggestPluginInstall', 'SuggestSkills', 'ListAgents']) {
    for (const isDeferred of [undefined, true] as const) {
      const result = await $.tool.describe({ tool, description: `${tool} original description`, provider: { plugin: 'engine', tier: 'core' }, ...(isDeferred === undefined ? {} : { isDeferred }) })
      expect(result.description).toBe(`${tool} original description`)
      expect(result.isDeferred).toBe(true)
    }
  }
})

test('core tools and existing deferred tools retain their placement', async ($, on) => {
  on('tool.describe', ($, e) => ({ description: e.description, isDeferred: e.isDeferred ?? false }))
  for (const tool of ['ToolSearch', 'Bash', 'PowerShell', 'Read', 'Edit', 'Write', 'Grep', 'Glob', 'Skill', 'Agent', 'AskUserQuestion', 'WebSearch', 'mcp__example__read']) {
    for (const isDeferred of [undefined, true] as const) {
      const result = await $.tool.describe({ tool, description: tool, provider: { plugin: 'engine', tier: 'core' }, isDeferred })
      expect(result.description).toBe(tool)
      expect(result.isDeferred).toBe(isDeferred ?? false)
    }
  }
})

test('resumed sessions refresh recorded tool descriptions without changing session input', async ($, on) => {
  const invalidated: string[] = []
  on('ui.invalidate', ($, e) => {
    invalidated.push(e.event)
    return { value: undefined }
  })
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  const result = await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(invalidated).toEqual(['tool.describe', 'prompt.section', 'prompt.attachment'])
  expect(result.cwd).toBe('/work')
})

test('Claude MCP tools defer without changing external MCP tools or ToolSearch', async ($, on) => {
  on('tool.describe', ($, e) => ({ description: e.description, isDeferred: e.isDeferred ?? false }))
  for (const server of ['Claude_Browser', 'Claude_Preview', 'claude-in-chrome', 'computer-use', 'terminal', 'visualize', 'workspace', 'ide', 'claude_ai_Claude_Docs', '1a59c906-04da-521d-bda7-7f71b9f9e01c', 'ccd_turn', 'ccd_session', 'ccd_host', 'ccd_settings']) {
    const result = await $.tool.describe({ tool: `mcp__${server}__read`, description: 'Original tool contract.', provider: { plugin: `mcp:${server}`, tier: 'user' } })
    expect(result.isDeferred).toBe(true)
    expect(result.description).toBe('Original tool contract.')
  }
  for (const tool of ['ToolSearch', 'mcp__t3-code__preview_open', 'mcp__cloudflare__execute', 'mcp__ovh_ca_vps__read', 'mcp__custom__read', 'mcp__Claude_Browser_custom__read']) {
    for (const isDeferred of [undefined, true] as const) {
      const result = await $.tool.describe({ tool, description: 'Unrelated tool.', provider: { plugin: 'engine', tier: 'core' }, isDeferred })
      expect(result.isDeferred).toBe(isDeferred ?? false)
      expect(result.description).toBe('Unrelated tool.')
    }
  }
})
