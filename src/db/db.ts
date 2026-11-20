import Dexie, { type EntityTable } from 'dexie'
import { migrateCharacter } from '../domain/migrations'
import { CareerLibrarySchema, type CareerLibrary, type Character } from '../domain/schema'

/**
 * Local IndexedDB storage (own database name — separate from other apps on
 * the same origin). Rows store the full character JSON plus a few indexed
 * columns. Migration of old records happens on read via migrateCharacter, so
 * stored data is never lost when the model grows.
 */
export type CharacterRow = {
  id: string
  name: string
  updatedAt: string
  data: unknown
}

/** Device-wide data that is not part of one character (e.g. the career library). */
export type MetaRow = { key: string; value: unknown }

export class SheetDb extends Dexie {
  characters!: EntityTable<CharacterRow, 'id'>
  meta!: EntityTable<MetaRow, 'key'>
  constructor(name = 'wfrp4-character-sheet') {
    super(name)
    this.version(1).stores({ characters: 'id, name, updatedAt' })
    this.version(2).stores({ characters: 'id, name, updatedAt', meta: 'key' })
  }
}

export const db = new SheetDb()

export type LoadedCharacter = { character: Character } | { id: string; error: string }

export async function listCharacters(database: SheetDb = db): Promise<LoadedCharacter[]> {
  const rows = await database.characters.orderBy('updatedAt').reverse().toArray()
  return rows.map((row) => {
    const r = migrateCharacter(row.data)
    return r.ok ? { character: r.character } : { id: row.id, error: r.error }
  })
}

export async function getCharacter(id: string, database: SheetDb = db): Promise<Character | null> {
  const row = await database.characters.get(id)
  if (!row) return null
  const r = migrateCharacter(row.data)
  if (!r.ok) throw new Error(r.error)
  return r.character
}

export async function saveCharacter(c: Character, database: SheetDb = db): Promise<void> {
  await database.characters.put({
    id: c.id,
    name: c.identity.name,
    updatedAt: c.updatedAt,
    data: c,
  })
}

export async function saveMany(cs: Character[], database: SheetDb = db): Promise<void> {
  await database.transaction('rw', database.characters, async () => {
    for (const c of cs) await saveCharacter(c, database)
  })
}

export async function deleteCharacter(id: string, database: SheetDb = db): Promise<void> {
  await database.characters.delete(id)
}

/** Ask the browser to keep our data (best effort, ignored where unsupported). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage && 'persist' in navigator.storage)
      return await navigator.storage.persist()
  } catch {
    /* unsupported */
  }
  return false
}

const LIBRARY_KEY = 'careerLibrary'

/** The career library imported from the player's own rulebook PDF (null if none). */
export async function getCareerLibrary(database: SheetDb = db): Promise<CareerLibrary | null> {
  const row = await database.meta.get(LIBRARY_KEY)
  if (!row) return null
  const r = CareerLibrarySchema.safeParse(row.value)
  return r.success ? r.data : null
}

export async function saveCareerLibrary(lib: CareerLibrary, database: SheetDb = db): Promise<void> {
  await database.meta.put({ key: LIBRARY_KEY, value: lib })
}

export async function deleteCareerLibrary(database: SheetDb = db): Promise<void> {
  await database.meta.delete(LIBRARY_KEY)
}
