import { describe, expect, it } from 'vitest'
import { makeSkill, newCharacter } from '../domain/factory'
import { migrateCharacter } from '../domain/migrations'
import type { WeaponLibrary, WeaponRef } from '../domain/schema'
import { exportBackup, parseImport } from '../domain/transfer'
import { weaponFromRef } from './fromRef'
import { weaponQualitiesText } from './qualities'

/** Synthetic table rows (not rulebook data). */
const SWORDISH: WeaponRef = {
  name: 'Test Sword',
  kind: 'melee',
  group: 'Basic',
  twoHanded: false,
  price: '1GC',
  enc: '1',
  availability: 'Common',
  reachRange: 'Average',
  damage: '+SB+4',
  qualities: ['Shield 1', 'Defensive', 'Strange Thing'],
  footnote: false,
}
const GUNISH: WeaponRef = {
  ...SWORDISH,
  name: 'Test Gun',
  kind: 'ranged',
  group: 'Blackpowder',
  twoHanded: true,
  enc: 'Varies',
  reachRange: '50',
  damage: '+9',
  qualities: ['Reload 2'],
  footnote: true,
}

describe('weapons from the rulebook table', () => {
  it('fills stats, ticks known qualities and links the matching attack skill', () => {
    const c = newCharacter()
    const w = weaponFromRef(SWORDISH, c)
    expect(w).toMatchObject({
      name: 'Test Sword',
      kind: 'melee',
      damage: '+SB+4',
      enc: 1,
      rangeReach: 'Average',
      qualities: 'Strange Thing',
    })
    expect(w.qualityTags).toEqual([
      { name: 'Shield', rating: 1 },
      { name: 'Defensive', rating: null },
    ])
    const melee = c.skills.find((s) => s.name === 'Melee' && s.specialisation === 'Basic')!
    expect(w.skillId).toBe(melee.id)
  })

  it('applies the Blackpowder footnote (p. 295) and keeps non-numeric Enc in the notes', () => {
    const c = newCharacter()
    c.skills.push(makeSkill('Ranged', 'Blackpowder'))
    const w = weaponFromRef(GUNISH, c)
    expect(w.qualityTags!.map((t) => t.name)).toEqual(['Reload', 'Blackpowder', 'Damaging'])
    expect(w.qualityTags![0]!.rating).toBe(2)
    expect(w.enc).toBeNull()
    expect(w.notes).toContain('Enc Varies')
    expect(w.twoHanded).toBe(true)
  })

  it('old saves: qualities text becomes ticks, unknown text is kept', () => {
    const r = migrateCharacter({
      id: 'x',
      schemaVersion: 1,
      weapons: [{ id: 'w', name: 'Old', qualities: 'Impale, Reload 1, House rule' }],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const w = r.character.weapons[0]!
    expect(w.qualityTags).toEqual([
      { name: 'Impale', rating: null },
      { name: 'Reload', rating: 1 },
    ])
    expect(w.qualities).toBe('House rule')
    expect(weaponQualitiesText(w)).toBe('Impale, Reload 1, House rule')
    expect(r.migratedFrom).toBe(1)
  })

  it('full backup carries the weapon library', () => {
    const lib: WeaponLibrary = {
      importedAt: '',
      source: 'test',
      weapons: [SWORDISH],
      qualities: [{ name: 'Impale', kind: 'quality', description: 'Synthetic text.' }],
    }
    const r = parseImport(JSON.stringify(exportBackup([newCharacter()], null, lib)))
    expect(r.ok && r.value.weaponLibrary?.weapons[0]?.name).toBe('Test Sword')
  })
})
