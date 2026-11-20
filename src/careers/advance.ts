import { makeSkill } from '../domain/factory'
import {
  CHAR_KEYS,
  type CareerData,
  type CareerLevel,
  type CharKey,
  type Character,
  type Skill,
} from '../domain/schema'

/**
 * What the current career level makes available for XP, per the Core
 * Rulebook p. 47–48:
 * - Characteristics: those in the advance scheme at the current level or lower.
 * - Skills: all skills of the current level and lower levels.
 * - Talents: only those of the current level.
 * Completing a level (p. 48) needs 5/10/15/20 advances (level 1–4) in all
 * available Characteristics and in eight available Skills, plus at least one
 * Talent of the current level. XP costs are never calculated here.
 */
export type CareerOption = {
  entry: string
  name: string
  spec: string
  /** Entry allows any specialisation, e.g. "Lore (Any)". */
  anySpec: boolean
  fromLevel: number
  matches: Skill[]
}

export type TalentOption = { entry: string; owned: number }

export type CareerAdvance = {
  level: number
  levelData: CareerLevel
  characteristics: { key: CharKey; fromLevel: number; advances: number }[]
  schemeIncomplete: boolean
  skills: CareerOption[]
  talents: TalentOption[]
  trappings: { level: number; items: string[] }[]
  completion: {
    needed: number
    characteristicsDone: number
    characteristicsTotal: number
    skillsDone: number
    talentOwned: boolean
  }
}

export function splitEntry(entry: string): { name: string; spec: string } {
  const m = /^(.*?)\s*\((.*)\)\s*$/.exec(entry.trim())
  return m ? { name: m[1]!.trim(), spec: m[2]!.trim() } : { name: entry.trim(), spec: '' }
}

const low = (s: string) => s.trim().toLowerCase()

export function matchSkills(c: Character, entry: string): { anySpec: boolean; matches: Skill[] } {
  const { name, spec } = splitEntry(entry)
  const anySpec = /\bany\b/i.test(spec)
  const matches = c.skills.filter((s) => {
    if (low(s.name) !== low(name)) return false
    if (anySpec) return true
    return low(s.specialisation) === low(spec)
  })
  return { anySpec, matches }
}

function talentOwned(c: Character, entry: string): number {
  const { name, spec } = splitEntry(entry)
  const anySpec = /\bany\b/i.test(spec)
  const target = anySpec ? low(name) : low(entry)
  return c.talents
    .filter((t) => {
      const n = low(t.name)
      return anySpec ? n === target || n.startsWith(`${target} (`) : n === target
    })
    .reduce((sum, t) => sum + Math.max(1, t.timesTaken), 0)
}

export function careerAdvance(c: Character): CareerAdvance | null {
  const { level, levels, scheme } = c.career
  if (level === null || levels.length < level) return null
  const needed = level * 5
  const characteristics = CHAR_KEYS.filter((k) => scheme[k] > 0 && scheme[k] <= level).map((k) => ({
    key: k,
    fromLevel: scheme[k],
    advances: c.characteristics[k].advances,
  }))
  const setCount = CHAR_KEYS.filter((k) => scheme[k] > 0).length
  const seen = new Set<string>()
  const skills: CareerOption[] = []
  levels.slice(0, level).forEach((lv, i) => {
    for (const entry of lv.skills) {
      if (seen.has(low(entry))) continue
      seen.add(low(entry))
      const { name, spec } = splitEntry(entry)
      const m = matchSkills(c, entry)
      skills.push({ entry, name, spec, anySpec: m.anySpec, fromLevel: i + 1, matches: m.matches })
    }
  })
  const levelData = levels[level - 1]!
  const talents = levelData.talents.map((entry) => ({ entry, owned: talentOwned(c, entry) }))
  const skillAdv = skills.flatMap((s) => s.matches.map((m) => m.advances))
  return {
    level,
    levelData,
    characteristics,
    // A complete scheme has 3 + 1 + 1 + 1 Characteristics (p. 47).
    schemeIncomplete: setCount < 6,
    skills,
    talents,
    trappings: levels.slice(0, level).map((l, i) => ({ level: i + 1, items: l.trappings })),
    completion: {
      needed,
      characteristicsDone: characteristics.filter((x) => x.advances >= needed).length,
      characteristicsTotal: characteristics.length,
      skillsDone: skillAdv.filter((a) => a >= needed).length,
      talentOwned: talents.some((t) => t.owned > 0),
    },
  }
}

/** New skill row for a career entry ("Lore (Any)" becomes Lore with an empty specialisation). */
export function skillFromEntry(entry: string): Skill {
  const { name, spec } = splitEntry(entry)
  return makeSkill(name, /\bany\b/i.test(spec) ? '' : spec, { inCareer: true })
}

/** Applies a career and level to the character: career copy, identity fields, career marks. */
export function applyCareer(
  x: Character,
  career: CareerData | { name: string; class: string },
  level: number | null,
) {
  const full = 'levels' in career ? career : null
  const sameCareer = x.career.name === career.name
  x.career = {
    name: career.name,
    class: career.class,
    level,
    levels: full ? structuredClone(full.levels) : sameCareer ? x.career.levels : [],
    scheme: full ? { ...full.scheme } : sameCareer ? x.career.scheme : x.career.scheme,
  }
  if (!full && !sameCareer)
    x.career.scheme = Object.fromEntries(CHAR_KEYS.map((k) => [k, 0])) as Record<CharKey, number>
  x.identity.career = career.name
  x.identity.class = career.class
  x.identity.careerLevel = level
  const lv = level !== null ? x.career.levels[level - 1] : undefined
  if (lv) {
    x.identity.careerPath = lv.title
    x.identity.statusTier = lv.statusTier
    x.identity.statusStanding = lv.statusStanding
  }
  syncCareerMarks(x)
}

/** Marks Characteristics in the scheme (up to the current level) as career Characteristics. */
export function syncCareerMarks(x: Character) {
  const level = x.career.level ?? 0
  for (const k of CHAR_KEYS) {
    const from = x.career.scheme[k]
    x.characteristics[k].inCareer = from > 0 && from <= level
  }
}

const TIER = { brass: 'Brass', silver: 'Silver', gold: 'Gold' } as const

export function statusText(l: CareerLevel): string {
  return `${TIER[l.statusTier]} ${l.statusStanding}`
}
