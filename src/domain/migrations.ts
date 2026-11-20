import { parseQualityText } from '../weapons/qualities'
import { CharacterSchema, CHARACTER_SCHEMA_VERSION, type Character } from './schema'

/**
 * Versioned migrations. Each step takes a raw object at version N and returns
 * it at version N+1. After the last step the object is parsed with zod, which
 * fills defaults for any field added since. Steps must never drop user data.
 * (v1 is the first released model; no steps yet.)
 */
type Raw = Record<string, unknown>

const STEPS: Record<number, (raw: Raw) => Raw> = {
  // v1 → v2: weapon "Qualities and Flaws" text becomes ticked quality tags.
  // Known names (with ratings) move to qualityTags; anything unrecognised
  // stays in the free-text field, so nothing is lost.
  1: (raw) => {
    const weapons = Array.isArray(raw.weapons) ? (raw.weapons as unknown[]) : []
    return {
      ...raw,
      weapons: weapons.map((w) => {
        if (!isObj(w) || typeof w.qualities !== 'string' || Array.isArray(w.qualityTags)) return w
        const { tags, rest } = parseQualityText(w.qualities)
        return { ...w, qualityTags: tags, qualities: rest }
      }),
      schemaVersion: 2,
    }
  },
}

function isObj(v: unknown): v is Raw {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export type MigrationResult =
  { ok: true; character: Character; migratedFrom: number | null } | { ok: false; error: string }

export function migrateCharacter(input: unknown): MigrationResult {
  if (!isObj(input)) return { ok: false, error: 'Not a character object.' }
  let raw: Raw = { ...input }
  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : CHARACTER_SCHEMA_VERSION
  const start = version
  if (version > CHARACTER_SCHEMA_VERSION)
    return {
      ok: false,
      error: `Character was saved by a newer app version (data model v${version}; this app supports v${CHARACTER_SCHEMA_VERSION}). Update the app first.`,
    }
  while (version < CHARACTER_SCHEMA_VERSION) {
    const step = STEPS[version]
    if (!step) return { ok: false, error: `No migration from data model v${version}.` }
    raw = step(raw)
    version += 1
  }
  const parsed = CharacterSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ')
    return { ok: false, error: `Invalid character data — ${first}` }
  }
  return {
    ok: true,
    character: { ...parsed.data, schemaVersion: CHARACTER_SCHEMA_VERSION },
    migratedFrom: start === CHARACTER_SCHEMA_VERSION ? null : start,
  }
}
