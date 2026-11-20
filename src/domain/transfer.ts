import { newId, nowIso } from './factory'
import { migrateCharacter } from './migrations'
import {
  CareerLibrarySchema,
  WeaponLibrarySchema,
  type CareerLibrary,
  type Character,
  type WeaponLibrary,
} from './schema'

/** JSON export/import formats (for the player's own backups — never sent anywhere). */
export const CHARACTER_FORMAT = 'wfrp4-sheet/character'
export const BACKUP_FORMAT = 'wfrp4-sheet/backup'
export const TRANSFER_VERSION = 1

export type CharacterFile = {
  format: typeof CHARACTER_FORMAT
  formatVersion: number
  exportedAt: string
  character: Character
}
export type BackupFile = {
  format: typeof BACKUP_FORMAT
  formatVersion: number
  exportedAt: string
  characters: Character[]
  /** Career library imported from the player's own rulebook (optional). */
  careerLibrary?: CareerLibrary
  /** Weapons and quality descriptions imported from the player's own rulebook (optional). */
  weaponLibrary?: WeaponLibrary
}

export function exportCharacter(c: Character): CharacterFile {
  return {
    format: CHARACTER_FORMAT,
    formatVersion: TRANSFER_VERSION,
    exportedAt: nowIso(),
    character: c,
  }
}

export function exportBackup(
  cs: Character[],
  careerLibrary?: CareerLibrary | null,
  weaponLibrary?: WeaponLibrary | null,
): BackupFile {
  return {
    format: BACKUP_FORMAT,
    formatVersion: TRANSFER_VERSION,
    exportedAt: nowIso(),
    characters: cs,
    ...(careerLibrary ? { careerLibrary } : {}),
    ...(weaponLibrary ? { weaponLibrary } : {}),
  }
}

export type ParsedImport = {
  kind: 'character' | 'backup'
  characters: Character[]
  /** Per-entry problems; entries listed here were NOT included. */
  errors: string[]
  /** Career library carried by a full backup, if any (validated). */
  careerLibrary: CareerLibrary | null
  /** Weapon library carried by a full backup, if any (validated). */
  weaponLibrary: WeaponLibrary | null
}

/** Parses and fully validates an import file. Nothing is written here. */
export function parseImport(
  text: string,
): { ok: true; value: ParsedImport } | { ok: false; error: string } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }
  if (typeof data !== 'object' || data === null) return { ok: false, error: 'Unrecognised file.' }
  const d = data as Record<string, unknown>
  const fv = typeof d.formatVersion === 'number' ? d.formatVersion : 0
  if (fv > TRANSFER_VERSION) return { ok: false, error: 'File was made by a newer app version.' }
  if (d.format === CHARACTER_FORMAT) {
    const r = migrateCharacter(d.character)
    if (!r.ok) return { ok: false, error: r.error }
    return {
      ok: true,
      value: {
        kind: 'character',
        characters: [r.character],
        errors: [],
        careerLibrary: null,
        weaponLibrary: null,
      },
    }
  }
  if (d.format === BACKUP_FORMAT) {
    if (!Array.isArray(d.characters)) return { ok: false, error: 'Backup has no character list.' }
    const characters: Character[] = []
    const errors: string[] = []
    d.characters.forEach((raw: unknown, i: number) => {
      const r = migrateCharacter(raw)
      if (r.ok) characters.push(r.character)
      else errors.push(`Entry ${i + 1}: ${r.error}`)
    })
    let careerLibrary: CareerLibrary | null = null
    if (d.careerLibrary !== undefined) {
      const lib = CareerLibrarySchema.safeParse(d.careerLibrary)
      if (lib.success) careerLibrary = lib.data
      else errors.push('Career library in the backup is invalid and was skipped.')
    }
    let weaponLibrary: WeaponLibrary | null = null
    if (d.weaponLibrary !== undefined) {
      const lib = WeaponLibrarySchema.safeParse(d.weaponLibrary)
      if (lib.success) weaponLibrary = lib.data
      else errors.push('Weapon library in the backup is invalid and was skipped.')
    }
    if (characters.length === 0 && !careerLibrary && !weaponLibrary)
      return { ok: false, error: errors[0] ?? 'Backup is empty.' }
    return { ok: true, value: { kind: 'backup', characters, errors, careerLibrary, weaponLibrary } }
  }
  return { ok: false, error: 'This is not a WFRP4 Sheet export or backup file.' }
}

export type ImportChoice = 'copy' | 'replace' | 'skip'

export type ImportPlanItem = {
  incoming: Character
  existing: Character | null
  choice: ImportChoice
}

/** Default plan: new ids are added; conflicts default to "copy" so nothing is overwritten by accident. */
export function planImport(incoming: Character[], existing: Character[]): ImportPlanItem[] {
  return incoming.map((c) => {
    const ex = existing.find((e) => e.id === c.id) ?? null
    return { incoming: c, existing: ex, choice: ex ? 'copy' : 'replace' }
  })
}

/** Turns a plan into the records to write. "copy" gets a fresh id and a marked name. */
export function resolveImport(plan: ImportPlanItem[]): Character[] {
  const out: Character[] = []
  for (const item of plan) {
    if (item.choice === 'skip') continue
    if (item.choice === 'copy' && item.existing) {
      out.push({
        ...item.incoming,
        id: newId(),
        identity: {
          ...item.incoming.identity,
          name: `${item.incoming.identity.name || 'Character'} (imported)`,
        },
        updatedAt: nowIso(),
      })
    } else out.push(item.incoming)
  }
  return out
}

export function safeFilename(name: string): string {
  return (
    (name || 'character')
      .replace(/[^\w\- ]+/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'character'
  )
}
