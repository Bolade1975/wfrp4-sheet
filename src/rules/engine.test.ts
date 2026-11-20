import { describe, expect, it } from 'vitest'
import { makeSkill, newCharacter, newId } from '../domain/factory'
import type { Character } from '../domain/schema'
import {
  bonusOf,
  characteristic,
  encumbrance,
  maxWounds,
  run,
  skillValue,
  walk,
  weaponDamage,
} from './engine'

function withChars(vals: Partial<Record<keyof Character['characteristics'], number>>): Character {
  const c = newCharacter('Test')
  for (const [k, v] of Object.entries(vals))
    c.characteristics[k as keyof Character['characteristics']].initial = v
  return c
}

describe('characteristics (p. 34–35, 47)', () => {
  it('Current = Initial + Advances (Agility 27 + 4 = 31, p. 47)', () => {
    const c = withChars({ ag: 27 })
    c.characteristics.ag.advances = 4
    expect(characteristic(c, 'ag').value).toBe(31)
  })
  it('bonus is the tens digit (S 39 → 3, WP 51 → 5, p. 34)', () => {
    expect(bonusOf(39)).toBe(3)
    expect(bonusOf(51)).toBe(5)
    expect(bonusOf(null)).toBeNull()
  })
  it('missing Initial gives no value instead of 0', () => {
    const c = newCharacter()
    expect(characteristic(c, 'ws').value).toBeNull()
    expect(characteristic(c, 'ws').missing.length).toBe(1)
  })
  it('manual override replaces the calculated value and is flagged', () => {
    const c = withChars({ ws: 30 })
    c.overrides['char.ws'] = 45
    const d = characteristic(c, 'ws')
    expect(d.value).toBe(45)
    expect(d.auto).toBe(30)
    expect(d.overridden).toBe(true)
  })
})

describe('skills (p. 47, 117–118)', () => {
  it('Skill = Characteristic + Advances (Fel 41 + 5 Charm = 46, p. 117)', () => {
    const c = withChars({ fel: 41 })
    const s = makeSkill('Charm', '', { advances: 5 })
    expect(skillValue(c, s).value).toBe(46)
  })
  it('Basic skill with no Advances uses the Characteristic (p. 117)', () => {
    const c = withChars({ ag: 33 })
    expect(skillValue(c, makeSkill('Athletics')).value).toBe(33)
  })
  it('Advanced skill with no Advances cannot be Tested (p. 118)', () => {
    const c = withChars({ int: 36 })
    const d = skillValue(c, makeSkill('Heal'))
    expect(d.value).toBeNull()
    expect(d.notes.join(' ')).toMatch(/cannot be Tested/)
  })
  it('catalog sets characteristic and type', () => {
    const s = makeSkill('Ranged', 'Bow')
    expect(s.characteristic).toBe('bs')
    expect(s.type).toBe('advanced')
    expect(s.grouped).toBe(true)
  })
})

describe('wounds (p. 33–34, 138)', () => {
  it('Human: SB + 2×TB + WPB', () => {
    const c = withChars({ s: 34, t: 36, wp: 32 })
    c.identity.species = 'human'
    expect(maxWounds(c).value).toBe(3 + 6 + 3)
  })
  it('Halfling: 2×TB + WPB', () => {
    const c = withChars({ s: 34, t: 36, wp: 32 })
    c.identity.species = 'halfling'
    expect(maxWounds(c).value).toBe(6 + 3)
  })
  it('Hardy adds TB once', () => {
    const c = withChars({ s: 34, t: 36, wp: 32 })
    c.identity.species = 'dwarf'
    c.talents.push({
      id: newId(),
      name: 'Hardy',
      timesTaken: 1,
      max: '',
      tests: '',
      description: '',
      notes: '',
    })
    expect(maxWounds(c).value).toBe(12 + 3)
  })
  it('Hardy taken twice is not guessed — asks for a manual value', () => {
    const c = withChars({ s: 34, t: 36, wp: 32 })
    c.identity.species = 'human'
    c.talents.push({
      id: newId(),
      name: 'Hardy',
      timesTaken: 2,
      max: '',
      tests: '',
      description: '',
      notes: '',
    })
    expect(maxWounds(c).value).toBeNull()
  })
  it('unknown species needs input', () => {
    const c = withChars({ s: 34, t: 36, wp: 32 })
    expect(maxWounds(c).value).toBeNull()
  })
})

describe('movement (p. 35)', () => {
  it('Walk = 2×M, Run = 4×M', () => {
    const c = newCharacter()
    c.movement = 4
    expect(walk(c).value).toBe(8)
    expect(run(c).value).toBe(16)
  })
})

describe('encumbrance (p. 293)', () => {
  it('limit SB + TB; only Current items count', () => {
    const c = withChars({ s: 34, t: 36 })
    c.trappings.push(
      {
        id: newId(),
        name: 'Pack',
        quantity: 1,
        enc: 4,
        location: '',
        current: true,
        notes: '',
        category: 'container',
      },
      {
        id: newId(),
        name: 'Stored',
        quantity: 1,
        enc: 9,
        location: '',
        current: false,
        notes: '',
        category: 'other',
      },
    )
    const e = encumbrance(c)
    expect(e.max.value).toBe(6)
    expect(e.total).toBe(4)
    expect(e.level).toBe(0)
  })
  it('levels: double and triple', () => {
    const c = withChars({ s: 30, t: 30 })
    c.trappings.push({
      id: newId(),
      name: 'Heavy',
      quantity: 1,
      enc: 10,
      location: '',
      current: true,
      notes: '',
      category: 'other',
    })
    expect(encumbrance(c).level).toBe(1)
    c.trappings[0]!.enc = 19
    expect(encumbrance(c).level).toBe(3)
  })
})

describe('weapon damage (p. 293–294)', () => {
  const w = (damage: string) => ({
    id: 'w',
    name: 'X',
    quantity: 1,
    enc: 1,
    location: '',
    current: true,
    notes: '',
    kind: 'melee' as const,
    group: '',
    rangeReach: '',
    damage,
    qualities: '',
    skillId: null,
    ammo: '',
  })
  it('+SB+4 resolves with Strength Bonus', () => {
    const c = withChars({ s: 34 })
    expect(weaponDamage(c, w('+SB+4')).value).toBe(7)
  })
  it('plain +9 is used as entered', () => {
    expect(weaponDamage(newCharacter(), w('+9')).value).toBe(9)
  })
  it('unrecognised notation is not guessed', () => {
    expect(weaponDamage(newCharacter(), w('Special')).value).toBeNull()
  })
})
