export const TAB_KEYS = [
  'combat',
  'loadout',
  'tests',
  'character',
  'careers',
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
