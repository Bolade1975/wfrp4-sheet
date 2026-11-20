/**
 * Names of the Weapon Qualities and Flaws in the Core Rulebook (p. 297–299).
 * Names only — the descriptions are read from the player's own rulebook PDF
 * and stored on their device.
 */
export type QualityDef = { name: string; kind: 'quality' | 'flaw'; rated: boolean }

export const WEAPON_QUALITIES: QualityDef[] = [
  { name: 'Accurate', kind: 'quality', rated: false },
  { name: 'Blackpowder', kind: 'quality', rated: false },
  { name: 'Blast', kind: 'quality', rated: true },
  { name: 'Damaging', kind: 'quality', rated: false },
  { name: 'Defensive', kind: 'quality', rated: false },
  { name: 'Distract', kind: 'quality', rated: false },
  { name: 'Entangle', kind: 'quality', rated: false },
  { name: 'Fast', kind: 'quality', rated: false },
  { name: 'Hack', kind: 'quality', rated: false },
  { name: 'Impact', kind: 'quality', rated: false },
  { name: 'Impale', kind: 'quality', rated: false },
  { name: 'Penetrating', kind: 'quality', rated: false },
  { name: 'Pistol', kind: 'quality', rated: false },
  { name: 'Precise', kind: 'quality', rated: false },
  { name: 'Pummel', kind: 'quality', rated: false },
  { name: 'Repeater', kind: 'quality', rated: true },
  { name: 'Shield', kind: 'quality', rated: true },
  { name: 'Trap Blade', kind: 'quality', rated: false },
  { name: 'Unbreakable', kind: 'quality', rated: false },
  { name: 'Wrap', kind: 'quality', rated: false },
  { name: 'Dangerous', kind: 'flaw', rated: false },
  { name: 'Imprecise', kind: 'flaw', rated: false },
  { name: 'Reload', kind: 'flaw', rated: true },
  { name: 'Slow', kind: 'flaw', rated: false },
  { name: 'Tiring', kind: 'flaw', rated: false },
  { name: 'Undamaging', kind: 'flaw', rated: false },
]

const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')

export function qualityDef(name: string): QualityDef | undefined {
  const k = key(name)
  return WEAPON_QUALITIES.find((q) => key(q.name) === k)
}

/** A selected quality on a weapon, e.g. { name: 'Shield', rating: 2 }. */
export type QualityTag = { name: string; rating: number | null }

export function tagText(t: QualityTag): string {
  return t.rating !== null ? `${t.name} ${t.rating}` : t.name
}

/**
 * Splits a "Qualities and Flaws" text into known tags and leftover text,
 * e.g. "Shield 2, Defensive, Something odd" → tags Shield 2 + Defensive,
 * rest "Something odd". Unknown entries are never dropped.
 */
export function parseQualityText(text: string): { tags: QualityTag[]; rest: string } {
  const tags: QualityTag[] = []
  const rest: string[] = []
  for (const raw of text.split(',')) {
    const part = raw.trim()
    if (!part || part === '-' || part === '–') continue
    const m = /^(.*?)\s*\(?(\d+)\)?$/.exec(part)
    const def = qualityDef(part) ?? (m ? qualityDef(m[1]!) : undefined)
    if (!def) {
      rest.push(part)
      continue
    }
    const rating = def.rated && m && qualityDef(m[1]!) === def ? Number(m[2]) : null
    if (!tags.some((t) => t.name === def.name)) tags.push({ name: def.name, rating })
  }
  return { tags, rest: rest.join(', ') }
}

/** All qualities of a weapon as one text: ticked ones first, then the free text. */
export function weaponQualitiesText(w: { qualityTags: QualityTag[]; qualities: string }): string {
  return [...w.qualityTags.map(tagText), w.qualities.trim()].filter(Boolean).join(', ')
}
