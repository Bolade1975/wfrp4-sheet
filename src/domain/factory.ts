import { SHEET_BASIC_SKILLS, catalogEntry } from '../rules/catalog'
import { CharacterSchema, CHARACTER_SCHEMA_VERSION, type Character, type Skill } from './schema'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function makeSkill(name: string, specialisation = '', patch: Partial<Skill> = {}): Skill {
  const cat = catalogEntry(name)
  return {
    id: newId(),
    name,
    specialisation,
    characteristic: cat?.characteristic ?? 'ws',
    type: cat?.type ?? 'basic',
    grouped: cat?.grouped ?? false,
    advances: 0,
    inCareer: false,
    race: false,
    favourite: false,
    notes: '',
    ...patch,
  }
}

/** The Basic Skills pre-printed on the official sheet, so they can be tested unadvanced. */
export function sheetBasicSkills(): Skill[] {
  return SHEET_BASIC_SKILLS.map((s) => makeSkill(s.name, s.specialisation))
}

/** A blank character: every number is "not entered" (null), not zero. */
export function newCharacter(name = 'New Character'): Character {
  const now = nowIso()
  return CharacterSchema.parse({
    id: newId(),
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    identity: { name },
    skills: sheetBasicSkills(),
  })
}

export function duplicateCharacter(c: Character, name?: string): Character {
  const now = nowIso()
  const copy = structuredClone(c)
  return {
    ...copy,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    identity: { ...copy.identity, name: name ?? `${c.identity.name || 'Character'} (copy)` },
  }
}

export function displayName(c: Character): string {
  return c.identity.name.trim() || 'Unnamed character'
}

const SPECIES_LABEL: Record<Character['identity']['species'], string> = {
  '': '',
  human: 'Human',
  dwarf: 'Dwarf',
  halfling: 'Halfling',
  highElf: 'High Elf',
  woodElf: 'Wood Elf',
  other: '',
}

export function speciesLabel(c: Character): string {
  const sp = c.identity.species
  return sp === 'other' ? c.identity.speciesOther.trim() || 'Other' : SPECIES_LABEL[sp]
}

export function statusLabel(c: Character): string {
  const t = c.identity.statusTier
  if (!t) return ''
  const tier = t[0]!.toUpperCase() + t.slice(1)
  return c.identity.statusStanding === null ? tier : `${tier} ${c.identity.statusStanding}`
}

export function careerLine(c: Character): string {
  const i = c.identity
  const lvl = i.careerLevel !== null ? `Level ${i.careerLevel}` : ''
  return [i.careerPath || i.career, lvl].filter(Boolean).join(' · ')
}
