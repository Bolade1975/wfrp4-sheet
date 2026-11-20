import {
  LOCATIONS,
  type Character,
  type Location,
  type Spell,
  type XpEntry,
} from '../domain/schema'
import { HIT_LOCATIONS } from '../rules/catalog'

export const SPELL_KIND: Record<Spell['kind'], string> = {
  spell: 'Spell',
  petty: 'Petty Magic',
  blessing: 'Blessing',
  miracle: 'Miracle',
  other: 'Other',
}

export const NOTE_CATEGORY: Record<Character['notes'][number]['category'], string> = {
  note: 'Note',
  goal: 'Goal',
  relationship: 'Relationship',
  history: 'History',
  session: 'Session log',
}

export const XP_CATEGORY: Record<XpEntry['category'], string> = {
  characteristic: 'Characteristic',
  skill: 'Skill',
  talent: 'Talent',
  career: 'Career change',
  spell: 'Spell / Prayer',
  award: 'XP award',
  other: 'Other',
}

export const LOCATION_LABEL: Record<Location, string> = Object.fromEntries(
  HIT_LOCATIONS.map((h) => [h.key, h.label]),
) as Record<Location, string>

export function locationsText(ls: Location[]): string {
  if (ls.length === LOCATIONS.length) return 'All'
  return LOCATIONS.filter((l) => ls.includes(l))
    .map((l) => LOCATION_LABEL[l])
    .join(', ')
}
