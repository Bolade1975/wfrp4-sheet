import type { CharKey, Character, Skill, Weapon } from '../domain/schema'
import { REFS, type RuleRef } from './references'

/**
 * Pure calculation engine. Every automatic value is a `Derived` carrying its
 * parts, what is missing, the rule reference and whether a manual override
 * replaces it. Nothing here mutates the character.
 */
export type Part = { label: string; value: number }

export type Derived = {
  id: string
  label: string
  /** Value to use everywhere: the override if set, else the automatic value. */
  value: number | null
  /** Automatic value (null when inputs are missing or the rule cannot apply). */
  auto: number | null
  overridden: boolean
  parts: Part[]
  missing: string[]
  notes: string[]
  ref: RuleRef | null
}

export const CHAR_LABELS: Record<CharKey, string> = {
  ws: 'WS',
  bs: 'BS',
  s: 'S',
  t: 'T',
  i: 'I',
  ag: 'Ag',
  dex: 'Dex',
  int: 'Int',
  wp: 'WP',
  fel: 'Fel',
}

export const CHAR_NAMES: Record<CharKey, string> = {
  ws: 'Weapon Skill',
  bs: 'Ballistic Skill',
  s: 'Strength',
  t: 'Toughness',
  i: 'Initiative',
  ag: 'Agility',
  dex: 'Dexterity',
  int: 'Intelligence',
  wp: 'Willpower',
  fel: 'Fellowship',
}

function make(
  c: Character,
  id: string,
  label: string,
  parts: Part[],
  missing: string[],
  ref: RuleRef | null,
  notes: string[] = [],
  autoOverride?: number | null,
): Derived {
  const auto =
    autoOverride !== undefined
      ? autoOverride
      : missing.length > 0
        ? null
        : parts.reduce((a, p) => a + p.value, 0)
  const ov = c.overrides[id]
  const overridden = typeof ov === 'number'
  return {
    id,
    label,
    value: overridden ? ov : auto,
    auto,
    overridden,
    parts,
    missing,
    notes,
    ref,
  }
}

// ---------- characteristics ----------

export function characteristic(c: Character, k: CharKey): Derived {
  const ch = c.characteristics[k]
  const parts: Part[] = []
  const missing: string[] = []
  if (ch.initial === null) missing.push(`Initial ${CHAR_LABELS[k]}`)
  else parts.push({ label: 'Initial', value: ch.initial })
  parts.push({ label: 'Advances', value: ch.advances })
  return make(c, `char.${k}`, CHAR_NAMES[k], parts, missing, REFS.current)
}

/** Characteristic Bonus: the tens digit of the current Characteristic (p. 34). */
export function bonusOf(value: number | null): number | null {
  if (value === null) return null
  return Math.floor(Math.max(0, value) / 10)
}

export function bonus(c: Character, k: CharKey): number | null {
  return bonusOf(characteristic(c, k).value)
}

// ---------- skills ----------

export function skillLabel(s: Skill): string {
  const n = s.name.trim() || 'Unnamed skill'
  return s.specialisation.trim() ? `${n} (${s.specialisation.trim()})` : n
}

export function skillValue(c: Character, s: Skill): Derived {
  const base = characteristic(c, s.characteristic)
  const parts: Part[] = []
  const missing: string[] = []
  const notes: string[] = []
  if (base.value === null) missing.push(`${CHAR_NAMES[s.characteristic]}`)
  else parts.push({ label: CHAR_NAMES[s.characteristic], value: base.value })
  parts.push({ label: 'Skill Advances', value: s.advances })
  let autoOverride: number | null | undefined
  if (s.type === 'advanced' && s.advances <= 0) {
    notes.push('Advanced Skill with no Advances: it cannot be Tested (p. 118).')
    autoOverride = null
  }
  return make(c, `skill.${s.id}`, skillLabel(s), parts, missing, REFS.skill, notes, autoOverride)
}

/**
 * Column placement as on the official sheet: Basic Skills (including grouped
 * Basic Skills without a specialisation, and Melee (Basic)) vs. the
 * "Grouped & Advanced Skills" column.
 */
export function isSheetBasic(s: Skill): boolean {
  if (s.type !== 'basic') return false
  if (!s.grouped) return true
  const spec = s.specialisation.trim()
  return spec === '' || (s.name.trim() === 'Melee' && spec === 'Basic')
}

export function canTest(s: Skill): boolean {
  return !(s.type === 'advanced' && s.advances <= 0)
}

// ---------- wounds & movement ----------

export function hardyTalent(c: Character) {
  return c.talents.find((t) => t.name.trim().toLowerCase() === 'hardy') ?? null
}

export function maxWounds(c: Character): Derived {
  const sb = bonus(c, 's')
  const tb = bonus(c, 't')
  const wpb = bonus(c, 'wp')
  const parts: Part[] = []
  const missing: string[] = []
  const notes: string[] = []
  const sp = c.identity.species
  if (sp === '' || sp === 'other') missing.push('Species (selects the Wounds formula)')
  const usesSB = sp !== 'halfling'
  if (usesSB) {
    if (sb === null) missing.push('Strength')
    else parts.push({ label: 'SB', value: sb })
  }
  if (tb === null) missing.push('Toughness')
  else parts.push({ label: 'TB × 2', value: tb * 2 })
  if (wpb === null) missing.push('Willpower')
  else parts.push({ label: 'WPB', value: wpb })
  const hardy = hardyTalent(c)
  if (hardy && tb !== null) {
    if (hardy.timesTaken <= 1) parts.push({ label: 'Hardy (TB)', value: tb })
    else {
      missing.push('Hardy taken more than once — enter Wounds as a manual override')
      notes.push('The rulebook entry does not state how repeated Hardy purchases add up.')
    }
  }
  if (sp === 'halfling') notes.push('Halfling formula: (2 × TB) + WPB.')
  return make(c, 'wounds.max', 'Wounds', parts, missing, REFS.wounds, notes)
}

export function walk(c: Character): Derived {
  const m = c.movement
  return make(
    c,
    'move.walk',
    'Walk',
    m === null ? [] : [{ label: 'Movement × 2', value: m * 2 }],
    m === null ? ['Movement'] : [],
    REFS.movement,
  )
}

export function run(c: Character): Derived {
  const m = c.movement
  return make(
    c,
    'move.run',
    'Run',
    m === null ? [] : [{ label: 'Movement × 4', value: m * 4 }],
    m === null ? ['Movement'] : [],
    REFS.movement,
  )
}

// ---------- encumbrance ----------

export type EncSummary = {
  weapons: number
  armour: number
  trappings: number
  total: number
  missingEnc: string[]
  max: Derived
  /** 0 = within limit, 1 = up to double, 2 = up to triple, 3 = more. null if max unknown. */
  level: 0 | 1 | 2 | 3 | null
}

function sumEnc(items: { name: string; enc: number | null; current: boolean }[], miss: string[]) {
  let t = 0
  for (const it of items) {
    if (!it.current) continue
    if (it.enc === null) miss.push(it.name || 'Unnamed item')
    else t += it.enc
  }
  return t
}

export function encumbrance(c: Character): EncSummary {
  const sb = bonus(c, 's')
  const tb = bonus(c, 't')
  const missing: string[] = []
  const parts: Part[] = []
  if (sb === null) missing.push('Strength')
  else parts.push({ label: 'SB', value: sb })
  if (tb === null) missing.push('Toughness')
  else parts.push({ label: 'TB', value: tb })
  const max = make(c, 'enc.max', 'Max Enc.', parts, missing, REFS.encumbrance)
  const missingEnc: string[] = []
  const weapons = sumEnc(c.weapons, missingEnc)
  const armour = sumEnc(c.armour, missingEnc)
  const trappings = sumEnc(c.trappings, missingEnc)
  const total = weapons + armour + trappings
  let level: EncSummary['level'] = null
  if (max.value !== null) {
    const m = max.value
    level = total <= m ? 0 : total <= m * 2 ? 1 : total <= m * 3 ? 2 : 3
  }
  return { weapons, armour, trappings, total, missingEnc, max, level }
}

export const ENC_LEVEL_TEXT = [
  'Within limit — no penalties.',
  'Over limit (up to double): −1 Movement (min 3), −10 Agility, +1 Travel Fatigue.',
  'Up to triple: −2 Movement (min 2), −20 Agility (min 10), +2 Travel Fatigue.',
  'More than triple the limit: you are not moving.',
] as const

// ---------- weapons ----------

export type WeaponDamage = {
  value: number | null
  basis: string
  missing: string[]
}

/** Resolves "+SB+4"-style damage to a number when the notation is recognised. */
export function weaponDamage(c: Character, w: Weapon): WeaponDamage {
  const raw = w.damage.replace(/\s+/g, '').replace('−', '-')
  if (!raw) return { value: null, basis: '', missing: ['Damage'] }
  const sbm = /^\+?SB([+-]\d+)?$/i.exec(raw)
  if (sbm) {
    const sb = bonus(c, 's')
    const n = sbm[1] ? Number(sbm[1]) : 0
    if (sb === null) return { value: null, basis: w.damage, missing: ['Strength'] }
    return {
      value: sb + n,
      basis: `SB ${sb}${n ? ` ${n > 0 ? '+' : '−'} ${Math.abs(n)}` : ''}`,
      missing: [],
    }
  }
  const plain = /^\+?(\d+)$/.exec(raw)
  if (plain) return { value: Number(plain[1]), basis: `${w.damage}`, missing: [] }
  return { value: null, basis: w.damage, missing: [] }
}

export function weaponSkill(c: Character, w: Weapon): Skill | null {
  if (!w.skillId) return null
  return c.skills.find((s) => s.id === w.skillId) ?? null
}

export function weaponTest(c: Character, w: Weapon): Derived | null {
  const s = weaponSkill(c, w)
  return s ? skillValue(c, s) : null
}

// ---------- corruption ----------

export function corruptionLimits(c: Character) {
  const physical = c.mutations.filter((m) => m.kind === 'physical').length
  const mental = c.mutations.filter((m) => m.kind === 'mental').length
  return { physical, mental, tb: bonus(c, 't'), wpb: bonus(c, 'wp') }
}

// ---------- quick tests ----------

export function quickTestBase(
  c: Character,
  q: Character['quickTests'][number],
): {
  label: string
  kind: 'Characteristic' | 'Skill'
  d: Derived | null
} {
  if (q.source.kind === 'characteristic')
    return {
      label: CHAR_NAMES[q.source.key],
      kind: 'Characteristic',
      d: characteristic(c, q.source.key),
    }
  const id = q.source.skillId
  const s = c.skills.find((x) => x.id === id)
  return {
    label: s ? skillLabel(s) : 'Missing skill',
    kind: 'Skill',
    d: s ? skillValue(c, s) : null,
  }
}

export function testTarget(base: number | null, modifier: number | null): number | null {
  if (base === null) return null
  return base + (modifier ?? 0)
}

// ---------- overrides ----------

export function activeOverrides(c: Character): { id: string; value: number }[] {
  return Object.entries(c.overrides).map(([id, value]) => ({ id, value }))
}
