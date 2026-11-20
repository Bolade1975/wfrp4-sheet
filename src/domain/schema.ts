import { z } from 'zod'

/**
 * Character data model (versioned). Every number the player has not entered
 * is `null` ("not entered"), never 0, so the sheet can tell the difference
 * between "zero" and "missing". Calculated values are never stored; only
 * inputs and explicit manual overrides are.
 */
export const CHARACTER_SCHEMA_VERSION = 2

export const CHAR_KEYS = ['ws', 'bs', 's', 't', 'i', 'ag', 'dex', 'int', 'wp', 'fel'] as const
export type CharKey = (typeof CHAR_KEYS)[number]

export const LOCATIONS = ['head', 'leftArm', 'rightArm', 'body', 'leftLeg', 'rightLeg'] as const
export type Location = (typeof LOCATIONS)[number]

const num = z.number().finite().nullable().default(null)
const int0 = z.number().int().default(0)
const str = z.string().default('')
const bool = z.boolean().default(false)
const id = z.string().min(1)

export const SpeciesSchema = z.enum([
  '',
  'human',
  'dwarf',
  'halfling',
  'highElf',
  'woodElf',
  'other',
])
export type Species = z.infer<typeof SpeciesSchema>

export const StatusTierSchema = z.enum(['', 'brass', 'silver', 'gold'])

export const CharacteristicSchema = z.object({
  initial: num,
  advances: int0,
  /** Part of the current career's advance scheme (for reference only). */
  inCareer: bool,
})
export type Characteristic = z.infer<typeof CharacteristicSchema>

const characteristicsShape = Object.fromEntries(
  CHAR_KEYS.map((k) => [k, CharacteristicSchema.prefault({})]),
) as unknown as Record<CharKey, z.ZodPrefault<typeof CharacteristicSchema>>

export const SkillSchema = z.object({
  id,
  name: str,
  specialisation: str,
  characteristic: z.enum(CHAR_KEYS).default('ws'),
  type: z.enum(['basic', 'advanced']).default('basic'),
  grouped: bool,
  advances: int0,
  /** Career skill (marked by the player). */
  inCareer: bool,
  /** Race (species) skill (marked by the player). */
  race: bool,
  favourite: bool,
  notes: str,
})
export type Skill = z.infer<typeof SkillSchema>

export const TalentSchema = z.object({
  id,
  name: str,
  timesTaken: z.number().int().default(1),
  /** As printed in the talent entry, e.g. "Toughness Bonus" or "1". Reference only. */
  max: str,
  tests: str,
  description: str,
  notes: str,
})
export type Talent = z.infer<typeof TalentSchema>

export const TraitSchema = z.object({ id, name: str, description: str, notes: str })
export const PsychologySchema = z.object({ id, name: str, description: str })
export const MutationSchema = z.object({
  id,
  kind: z.enum(['physical', 'mental']).default('physical'),
  name: str,
  effect: str,
})

export const SpellSchema = z.object({
  id,
  kind: z.enum(['spell', 'petty', 'blessing', 'miracle', 'other']).default('spell'),
  name: str,
  lore: str,
  tn: str,
  range: str,
  target: str,
  duration: str,
  effect: str,
  notes: str,
})
export type Spell = z.infer<typeof SpellSchema>

/** Common inventory fields: "current" = carried / available right now (Current Loadout). */
const itemBase = {
  id,
  name: str,
  quantity: z.number().int().nullable().default(1),
  /** Total Enc for this row as entered by the player (not multiplied by quantity). */
  enc: num,
  location: str,
  current: bool,
  notes: str,
}

/** A Weapon Quality or Flaw ticked on a weapon, e.g. Shield with rating 2. */
export const QualityTagSchema = z.object({
  name: z.string(),
  rating: z.number().int().nullable().default(null),
})

export const WeaponSchema = z.object({
  ...itemBase,
  kind: z.enum(['melee', 'ranged']).default('melee'),
  group: str,
  twoHanded: bool,
  rangeReach: str,
  /** As printed, e.g. "+SB+4" or "+8". */
  damage: str,
  /** Qualities and Flaws ticked from the list. */
  qualityTags: z.array(QualityTagSchema).default([]),
  /** Anything else (supplement qualities, notes on qualities). */
  qualities: str,
  /** Skill used to attack with this weapon (id into skills). */
  skillId: z.string().nullable().default(null),
  ammo: str,
})
export type Weapon = z.infer<typeof WeaponSchema>

export const ArmourSchema = z.object({
  ...itemBase,
  locations: z.array(z.enum(LOCATIONS)).default([]),
  ap: num,
  qualities: str,
  penalty: str,
  /** Actually worn (only worn pieces are listed on the AP map). */
  worn: bool,
})
export type Armour = z.infer<typeof ArmourSchema>

export const TrappingSchema = z.object({
  ...itemBase,
  category: z.enum(['equipment', 'tool', 'container', 'consumable', 'other']).default('equipment'),
})
export type Trapping = z.infer<typeof TrappingSchema>

export const ConditionSchema = z.object({
  id,
  name: str,
  count: z.number().int().default(1),
  notes: str,
})
export const CriticalWoundSchema = z.object({
  id,
  location: str,
  name: str,
  effect: str,
  duration: str,
  healed: bool,
})

export const XpEntrySchema = z.object({
  id,
  kind: z.enum(['earned', 'spent']).default('spent'),
  date: str,
  session: str,
  category: z
    .enum(['characteristic', 'skill', 'talent', 'career', 'spell', 'award', 'other'])
    .default('other'),
  name: str,
  before: str,
  after: str,
  /** XP amount, always entered by the player (positive number). */
  amount: num,
  notes: str,
})
export type XpEntry = z.infer<typeof XpEntrySchema>

export const QuickTestSchema = z.object({
  id,
  label: str,
  source: z
    .discriminatedUnion('kind', [
      z.object({ kind: z.literal('characteristic'), key: z.enum(CHAR_KEYS) }),
      z.object({ kind: z.literal('skill'), skillId: z.string() }),
    ])
    .default({ kind: 'characteristic', key: 'ws' }),
  /** Situational modifier the player typed in (e.g. +20 for an Average test). */
  modifier: z.number().int().nullable().default(null),
  modifierNote: str,
  notes: str,
})
export type QuickTest = z.infer<typeof QuickTestSchema>

export const NoteSchema = z.object({
  id,
  category: z.enum(['note', 'goal', 'relationship', 'history', 'session']).default('note'),
  title: str,
  body: str,
  date: str,
})

/** A weapon row from the player's own rulebook (weapon tables, p. 294–295). */
export const WeaponRefSchema = z.object({
  name: z.string(),
  kind: z.enum(['melee', 'ranged']),
  group: str,
  twoHanded: bool,
  price: str,
  enc: str,
  availability: str,
  reachRange: str,
  damage: str,
  qualities: z.array(z.string()).default([]),
  /** Marked with * in the table (see the table's footnotes). */
  footnote: bool,
})
export type WeaponRef = z.infer<typeof WeaponRefSchema>

/** A Weapon Quality or Flaw description from the player's own rulebook (p. 297–299). */
export const QualityRefSchema = z.object({
  name: z.string(),
  kind: z.enum(['quality', 'flaw']),
  description: str,
})
export type QualityRef = z.infer<typeof QualityRefSchema>

export const WeaponLibrarySchema = z.object({
  importedAt: str,
  source: str,
  weapons: z.array(WeaponRefSchema).default([]),
  qualities: z.array(QualityRefSchema).default([]),
})
export type WeaponLibrary = z.infer<typeof WeaponLibrarySchema>

/** One level of a career, as read from the player's own rulebook PDF. */
export const CareerLevelSchema = z.object({
  title: str,
  statusTier: z.enum(['brass', 'silver', 'gold']).default('brass'),
  statusStanding: z.number().int().default(0),
  skills: z.array(z.string()).default([]),
  talents: z.array(z.string()).default([]),
  trappings: z.array(z.string()).default([]),
})
export type CareerLevel = z.infer<typeof CareerLevelSchema>

const schemeShape = Object.fromEntries(
  CHAR_KEYS.map((k) => [k, z.number().int().min(0).max(4).default(0)]),
) as unknown as Record<CharKey, z.ZodDefault<z.ZodNumber>>

/** Level (1–4) at which each Characteristic enters the advance scheme; 0 = not in scheme / not set. */
export const SchemeSchema = z.object(schemeShape).prefault({})

export const CareerDataSchema = z.object({
  name: z.string(),
  class: str,
  page: z.number().int().default(0),
  levels: z.array(CareerLevelSchema).default([]),
  scheme: SchemeSchema,
})
export type CareerData = z.infer<typeof CareerDataSchema>

export const CareerLibrarySchema = z.object({
  importedAt: str,
  source: str,
  careers: z.array(CareerDataSchema).default([]),
})
export type CareerLibrary = z.infer<typeof CareerLibrarySchema>

export const CharacterSchema = z.object({
  id,
  schemaVersion: z.number().int().default(CHARACTER_SCHEMA_VERSION),
  createdAt: str,
  updatedAt: str,
  isExample: bool,
  identity: z
    .object({
      name: str,
      species: SpeciesSchema.default(''),
      speciesOther: str,
      class: str,
      career: str,
      careerLevel: z.number().int().nullable().default(null),
      careerPath: str,
      statusTier: StatusTierSchema.default(''),
      statusStanding: z.number().int().nullable().default(null),
      age: str,
      height: str,
      hair: str,
      eyes: str,
      motivation: str,
    })
    .prefault({}),
  characteristics: z.object(characteristicsShape).prefault({}),
  fate: num,
  fortune: num,
  resilience: num,
  resolve: num,
  movement: num,
  wounds: z.object({ current: num }).prefault({}),
  advantage: int0,
  corruption: num,
  sin: num,
  ambitions: z.object({ short: str, long: str }).prefault({}),
  party: z.object({ name: str, short: str, long: str, members: str }).prefault({}),
  skills: z.array(SkillSchema).default([]),
  talents: z.array(TalentSchema).default([]),
  traits: z.array(TraitSchema).default([]),
  psychology: z.array(PsychologySchema).default([]),
  mutations: z.array(MutationSchema).default([]),
  spells: z.array(SpellSchema).default([]),
  weapons: z.array(WeaponSchema).default([]),
  armour: z.array(ArmourSchema).default([]),
  trappings: z.array(TrappingSchema).default([]),
  wealth: z
    .object({
      gc: num,
      ss: num,
      d: num,
      /** Four short free-text lines in the Wealth box (debts, savings, notes …). */
      notes: z
        .array(z.string())
        .default([])
        .transform((a) => [0, 1, 2, 3].map((i) => a[i] ?? '')),
    })
    .prefault({}),
  /** Manual total AP per hit location (the rulebook gives no general stacking formula). */
  apTotals: z
    .object(Object.fromEntries(LOCATIONS.map((l) => [l, num])) as Record<Location, typeof num>)
    .prefault({}),
  /** Value written in the sheet's Shield box (manual). */
  shield: num,
  conditions: z.array(ConditionSchema).default([]),
  criticalWounds: z.array(CriticalWoundSchema).default([]),
  xp: z
    .object({
      /** XP total/spent before the log was started (e.g. from a paper sheet). */
      openingTotal: num,
      openingSpent: num,
      log: z.array(XpEntrySchema).default([]),
    })
    .prefault({}),
  quickTests: z.array(QuickTestSchema).default([]),
  notes: z.array(NoteSchema).default([]),
  /**
   * Current career and level ("Path"). A copy of the career's data is kept on
   * the character so the sheet works on devices without the career library.
   */
  career: z
    .object({
      name: str,
      class: str,
      level: z.number().int().min(1).max(4).nullable().default(null),
      levels: z.array(CareerLevelSchema).default([]),
      scheme: SchemeSchema,
    })
    .prefault({}),
  /** Manual overrides of calculated values, keyed by derived-value id. */
  overrides: z.record(z.string(), z.number()).default({}),
})
export type Character = z.infer<typeof CharacterSchema>
