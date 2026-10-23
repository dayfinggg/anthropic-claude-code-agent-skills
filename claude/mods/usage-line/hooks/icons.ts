export type Icon = { svg: string; emoji: string }

export type LimitIcon = Icon & { label: string }

function lucide(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-2 1 28 28"><g fill="none" stroke="#808080" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">${body}</g></svg>`
}

const HOURGLASS: Icon = {
  emoji: '⏳',
  svg: lucide(
    '<path d="M5 22h14M5 2h14m-2 20v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  ),
}

const CALENDAR: Icon = {
  emoji: '📅',
  svg: lucide(
    '<path d="M8 2v3m8-3v3"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/>',
  ),
}

export const COST_ICON: Icon = {
  emoji: '💵',
  svg: lucide('<path d="M12 2v20m5-17H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
}

export const INPUT_ICON: Icon = { emoji: '⬇️', svg: lucide('<path d="M12 17V3m-6 8l6 6l6-6m1 10H5"/>') }

export const OUTPUT_ICON: Icon = { emoji: '⬆️', svg: lucide('<path d="m18 9l-6-6l-6 6m6-6v14m-7 4h14"/>') }

export const CACHE_READ_ICON: Icon = {
  emoji: '📖',
  svg: lucide('<path d="M12 2v8m4-4l-4 4l-4-4"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 18h.01M10 18h.01"/>'),
}

export const CACHE_WRITE_ICON: Icon = {
  emoji: '💾',
  svg: lucide('<path d="m16 6l-4-4l-4 4m4-4v8"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 18h.01M10 18h.01"/>'),
}

const LIMIT_ICONS: Record<string, LimitIcon> = {
  five_hour: { ...HOURGLASS, label: '5h limit' },
  seven_day: { ...CALENDAR, label: '7d limit' },
}

export function iconForLimit(kind: string): LimitIcon {
  return LIMIT_ICONS[kind] ?? { ...HOURGLASS, label: kind }
}
