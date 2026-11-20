import { describe, expect, it } from 'vitest'
import { exampleCharacter } from './example'
import { newCharacter } from './factory'
import { migrateCharacter } from './migrations'
import { exportBackup, exportCharacter, parseImport, planImport, resolveImport } from './transfer'

describe('import / export', () => {
  it('round-trips a character without loss', () => {
    const c = exampleCharacter()
    const r = parseImport(JSON.stringify(exportCharacter(c)))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.characters[0]).toEqual(c)
  })
  it('round-trips a full backup', () => {
    const cs = [exampleCharacter(), newCharacter('B')]
    const r = parseImport(JSON.stringify(exportBackup(cs)))
    expect(r.ok && r.value.characters.length).toBe(2)
  })
  it('rejects unrelated JSON and broken files without writing', () => {
    expect(parseImport('{"hello":1}').ok).toBe(false)
    expect(parseImport('not json').ok).toBe(false)
  })
  it('conflicts default to "add as copy" with a new id', () => {
    const c = exampleCharacter()
    const plan = planImport([c], [c])
    expect(plan[0]!.choice).toBe('copy')
    const out = resolveImport(plan)
    expect(out[0]!.id).not.toBe(c.id)
  })
  it('fills defaults for partial data and keeps unusual values', () => {
    const r = migrateCharacter({
      id: 'x',
      identity: { name: 'Odd' },
      characteristics: { ws: { initial: 105 } },
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.character.characteristics.ws.initial).toBe(105)
      expect(r.character.skills).toEqual([])
      expect(r.character.characteristics.bs.initial).toBeNull()
    }
  })
  it('refuses data from a newer app version', () => {
    expect(migrateCharacter({ id: 'x', schemaVersion: 99 }).ok).toBe(false)
  })
  it('new characters start with the Basic Skills printed on the official sheet', () => {
    const c = newCharacter()
    expect(c.skills.length).toBe(25)
    expect(c.skills.find((s) => s.name === 'Melee')?.specialisation).toBe('Basic')
  })
})
