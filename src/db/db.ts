import Dexie, { type EntityTable } from 'dexie'
import { migrateCharacter } from '../domain/migrations'
import type { Character } from '../domain/schema'

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

export class SheetDb extends Dexie {
  characters!: EntityTable<CharacterRow, 'id'>
  constructor(name = 'wfrp4-character-sheet') {
    super(name)
    this.version(1).stores({ characters: 'id, name, updatedAt' })
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
