export const TAB_KEYS = [
  'combat',
  'loadout',
  'tests',
  'character',
  'characteristics',
  'skills',
  'talents',
  'magic',
  'inventory',
  'xp',
  'notes',
  'export',
] as const
export type TabKey = (typeof TAB_KEYS)[number]
