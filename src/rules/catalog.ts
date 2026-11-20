import type { CharKey } from '../domain/schema'

/**
 * Skill names with their governing Characteristic and Basic/Advanced/Grouped
 * classification, as listed in the Core Rulebook master skill list
 * (p. 118–131). Names only — no rule text.
 */
export type CatalogSkill = {
  name: string
  characteristic: CharKey
  type: 'basic' | 'advanced'
  grouped: boolean
}

export const SKILL_CATALOG: CatalogSkill[] = [
  { name: 'Animal Care', characteristic: 'int', type: 'advanced', grouped: false },
  { name: 'Animal Training', characteristic: 'int', type: 'advanced', grouped: true },
  { name: 'Art', characteristic: 'dex', type: 'basic', grouped: true },
  { name: 'Athletics', characteristic: 'ag', type: 'basic', grouped: false },
  { name: 'Bribery', characteristic: 'fel', type: 'basic', grouped: false },
  { name: 'Channelling', characteristic: 'wp', type: 'advanced', grouped: true },
  { name: 'Charm', characteristic: 'fel', type: 'basic', grouped: false },
  { name: 'Charm Animal', characteristic: 'wp', type: 'basic', grouped: false },
  { name: 'Climb', characteristic: 's', type: 'basic', grouped: false },
  { name: 'Consume Alcohol', characteristic: 't', type: 'basic', grouped: false },
  { name: 'Cool', characteristic: 'wp', type: 'basic', grouped: false },
  { name: 'Dodge', characteristic: 'ag', type: 'basic', grouped: false },
  { name: 'Drive', characteristic: 'ag', type: 'basic', grouped: false },
  { name: 'Endurance', characteristic: 't', type: 'basic', grouped: false },
  { name: 'Entertain', characteristic: 'fel', type: 'basic', grouped: true },
  { name: 'Evaluate', characteristic: 'int', type: 'advanced', grouped: false },
  { name: 'Gamble', characteristic: 'int', type: 'basic', grouped: false },
  { name: 'Gossip', characteristic: 'fel', type: 'basic', grouped: false },
  { name: 'Haggle', characteristic: 'fel', type: 'basic', grouped: false },
  { name: 'Heal', characteristic: 'int', type: 'advanced', grouped: false },
  { name: 'Intimidate', characteristic: 's', type: 'basic', grouped: false },
  { name: 'Intuition', characteristic: 'i', type: 'basic', grouped: false },
  { name: 'Language', characteristic: 'int', type: 'advanced', grouped: true },
  { name: 'Leadership', characteristic: 'fel', type: 'basic', grouped: false },
  { name: 'Lore', characteristic: 'int', type: 'advanced', grouped: true },
  { name: 'Melee', characteristic: 'ws', type: 'basic', grouped: true },
  { name: 'Navigation', characteristic: 'i', type: 'basic', grouped: false },
  { name: 'Outdoor Survival', characteristic: 'int', type: 'basic', grouped: false },
  { name: 'Perception', characteristic: 'i', type: 'basic', grouped: false },
  { name: 'Perform', characteristic: 'ag', type: 'advanced', grouped: true },
  { name: 'Pick Lock', characteristic: 'dex', type: 'advanced', grouped: false },
  { name: 'Play', characteristic: 'dex', type: 'advanced', grouped: true },
  { name: 'Pray', characteristic: 'fel', type: 'advanced', grouped: false },
  { name: 'Ranged', characteristic: 'bs', type: 'advanced', grouped: true },
  { name: 'Research', characteristic: 'int', type: 'advanced', grouped: false },
  { name: 'Ride', characteristic: 'ag', type: 'basic', grouped: true },
  { name: 'Row', characteristic: 's', type: 'basic', grouped: false },
  { name: 'Sail', characteristic: 'ag', type: 'advanced', grouped: true },
  { name: 'Secret Signs', characteristic: 'int', type: 'advanced', grouped: true },
  { name: 'Set Trap', characteristic: 'dex', type: 'advanced', grouped: false },
  { name: 'Sleight of Hand', characteristic: 'dex', type: 'advanced', grouped: false },
  { name: 'Stealth', characteristic: 'ag', type: 'basic', grouped: true },
  { name: 'Swim', characteristic: 's', type: 'advanced', grouped: false },
  { name: 'Track', characteristic: 'i', type: 'advanced', grouped: false },
  { name: 'Trade', characteristic: 'dex', type: 'advanced', grouped: true },
]

/**
 * Rows pre-printed in the Basic Skills columns of the official character
 * sheet, in sheet order. Melee is printed as "Melee (Basic)".
 */
export const SHEET_BASIC_SKILLS: { name: string; specialisation: string }[] = [
  'Art',
  'Athletics',
  'Bribery',
  'Charm',
  'Charm Animal',
  'Climb',
  'Cool',
  'Consume Alcohol',
  'Dodge',
  'Drive',
  'Endurance',
  'Entertain',
  'Gamble',
  'Gossip',
  'Haggle',
  'Intimidate',
  'Intuition',
  'Leadership',
  'Melee',
  'Navigation',
  'Outdoor Survival',
  'Perception',
  'Ride',
  'Row',
  'Stealth',
].map((name) => ({ name, specialisation: name === 'Melee' ? 'Basic' : '' }))

export function catalogEntry(name: string): CatalogSkill | undefined {
  const n = name.trim().toLowerCase()
  return SKILL_CATALOG.find((s) => s.name.toLowerCase() === n)
}

/** Condition names from the Core Rulebook (p. 167–169). */
export const CONDITIONS = [
  'Ablaze',
  'Bleeding',
  'Blinded',
  'Broken',
  'Deafened',
  'Entangled',
  'Fatigued',
  'Poisoned',
  'Prone',
  'Stunned',
  'Surprised',
  'Unconscious',
] as const

/** Difficulty Table (p. 153). */
export const DIFFICULTIES: { label: string; modifier: number }[] = [
  { label: 'Very Easy', modifier: 60 },
  { label: 'Easy', modifier: 40 },
  { label: 'Average', modifier: 20 },
  { label: 'Challenging', modifier: 0 },
  { label: 'Difficult', modifier: -10 },
  { label: 'Hard', modifier: -20 },
  { label: 'Very Hard', modifier: -30 },
]

/** Hit Locations table (p. 159). */
export const HIT_LOCATIONS = [
  { key: 'head', label: 'Head', roll: '01–09' },
  { key: 'leftArm', label: 'Left Arm', sub: 'or secondary arm', roll: '10–24' },
  { key: 'rightArm', label: 'Right Arm', sub: 'or primary arm', roll: '25–44' },
  { key: 'body', label: 'Body', roll: '45–79' },
  { key: 'leftLeg', label: 'Left Leg', roll: '80–89' },
  { key: 'rightLeg', label: 'Right Leg', roll: '90–00' },
] as const
