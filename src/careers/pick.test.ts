import { describe, expect, it } from 'vitest'
import { newCharacter } from '../domain/factory'
import type { CareerData, CareerLibrary } from '../domain/schema'
import { careerLevelsFor, pickCareer, pickLevel, typeCareer } from './advance'

/** Synthetic library (not rulebook data). */
const career = (name: string, cls: string): CareerData => ({
  name,
  class: cls,
  page: 0,
  scheme: { ws: 1, bs: 0, s: 0, t: 1, i: 0, ag: 0, dex: 0, int: 0, wp: 1, fel: 0 },
  levels: [1, 2, 3, 4].map((n) => ({
    title: `${name} ${n}`,
    statusTier: 'brass' as const,
    statusStanding: n,
    skills: [],
    talents: [],
    trappings: [],
  })),
})
const LIB: CareerLibrary = {
  importedAt: '',
  source: 'test',
  careers: [career('Soldier', 'Warriors'), career('Scholar', 'Academics')],
}

describe('Career and Career Path drop-downs', () => {
  it('picking a career fills Class, Tier, Path and Status (level 1 for a new character)', () => {
    const c = newCharacter()
    pickCareer(c, 'Soldier', LIB)
    expect(c.identity).toMatchObject({
      career: 'Soldier',
      class: 'Warriors',
      careerLevel: 1,
      careerPath: 'Soldier 1',
      statusTier: 'brass',
      statusStanding: 1,
    })
    expect(careerLevelsFor(c, LIB).map((l) => l.title)).toEqual([
      'Soldier 1',
      'Soldier 2',
      'Soldier 3',
      'Soldier 4',
    ])
  })

  it('picking a Path (level) updates Tier, Path and Status', () => {
    const c = newCharacter()
    pickCareer(c, 'Soldier', LIB)
    pickLevel(c, 3, LIB)
    expect(c.identity.careerLevel).toBe(3)
    expect(c.identity.careerPath).toBe('Soldier 3')
    expect(c.identity.statusStanding).toBe(3)
    expect(c.career.level).toBe(3)
  })

  it('a typed career that is not in the library is kept as typed, without level titles', () => {
    const c = newCharacter()
    pickCareer(c, 'Soldier', LIB)
    typeCareer(c, 'Ratskin Guide', LIB)
    expect(c.identity.career).toBe('Ratskin Guide')
    expect(c.career.levels).toEqual([])
    expect(careerLevelsFor(c, LIB)).toEqual([])
    pickLevel(c, 2, LIB)
    expect(c.identity.careerLevel).toBe(2)
  })

  it('typing the exact name of an imported career links it', () => {
    const c = newCharacter()
    typeCareer(c, 'scholar', LIB)
    expect(c.identity.career).toBe('Scholar')
    expect(c.identity.careerPath).toBe('Scholar 1')
  })

  it('works without an imported library (names only)', () => {
    const c = newCharacter()
    pickCareer(c, 'Soldier', null)
    expect(c.identity.career).toBe('Soldier')
    expect(c.identity.class).toBe('Warriors')
    expect(careerLevelsFor(c, null)).toEqual([])
  })
})
