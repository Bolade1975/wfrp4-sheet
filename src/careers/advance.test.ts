import { describe, expect, it } from 'vitest'
import { makeSkill, newCharacter, newId } from '../domain/factory'
import type { CareerData, CareerLibrary } from '../domain/schema'
import { exportBackup, parseImport } from '../domain/transfer'
import { applyCareer, careerAdvance, matchSkills, skillFromEntry } from './advance'

/** Synthetic test career (not rulebook data). */
const TEST_CAREER: CareerData = {
  name: 'Soldier',
  class: 'Warriors',
  page: 0,
  scheme: { ws: 1, bs: 0, s: 0, t: 1, i: 2, ag: 0, dex: 0, int: 0, wp: 1, fel: 3 },
  levels: [1, 2, 3, 4].map((n) => ({
    title: `Rank ${n}`,
    statusTier: 'silver' as const,
    statusStanding: n,
    skills:
      n === 1 ? ['Dodge', 'Melee (Basic)', 'Lore (Any)'] : n === 2 ? ['Cool', 'Dodge'] : ['Heal'],
    talents: [`Talent ${n}`],
    trappings: [`Item ${n}`],
  })),
}

describe('career advancement (p. 47–48)', () => {
  it('selecting a career fills Career, Tier, Path, Status and Class', () => {
    const c = newCharacter()
    applyCareer(c, TEST_CAREER, 2)
    expect(c.identity.career).toBe('Soldier')
    expect(c.identity.class).toBe('Warriors')
    expect(c.identity.careerLevel).toBe(2)
    expect(c.identity.careerPath).toBe('Rank 2')
    expect(c.identity.statusTier).toBe('silver')
    expect(c.identity.statusStanding).toBe(2)
    expect(c.characteristics.i.inCareer).toBe(true)
    expect(c.characteristics.fel.inCareer).toBe(false)
  })

  it('characteristics up to the current level, skills of all levels so far, talents of this level only', () => {
    const c = newCharacter()
    applyCareer(c, TEST_CAREER, 2)
    const a = careerAdvance(c)!
    expect(a.characteristics.map((x) => x.key)).toEqual(['ws', 't', 'i', 'wp'])
    expect(a.skills.map((s) => s.entry)).toEqual(['Dodge', 'Melee (Basic)', 'Lore (Any)', 'Cool'])
    expect(a.talents.map((t) => t.entry)).toEqual(['Talent 2'])
    expect(a.trappings).toHaveLength(2)
    expect(a.completion.needed).toBe(10)
  })

  it('matches "(Any)" to every specialisation and exact entries exactly', () => {
    const c = newCharacter()
    c.skills.push(makeSkill('Lore', 'Reikland'), makeSkill('Lore', 'Law'))
    expect(matchSkills(c, 'Lore (Any)').matches).toHaveLength(2)
    expect(matchSkills(c, 'Melee (Basic)').matches).toHaveLength(1)
    expect(matchSkills(c, 'Melee (Polearm)').matches).toHaveLength(0)
    const s = skillFromEntry('Lore (Any)')
    expect(s.name).toBe('Lore')
    expect(s.specialisation).toBe('')
    expect(s.inCareer).toBe(true)
  })

  it('counts completion against 5 × level advances', () => {
    const c = newCharacter()
    applyCareer(c, TEST_CAREER, 1)
    c.characteristics.ws.advances = 5
    c.skills.find((s) => s.name === 'Dodge')!.advances = 5
    c.talents.push({
      id: newId(),
      name: 'Talent 1',
      timesTaken: 1,
      max: '',
      tests: '',
      description: '',
      notes: '',
    })
    const a = careerAdvance(c)!
    expect(a.completion.characteristicsDone).toBe(1)
    expect(a.completion.characteristicsTotal).toBe(3)
    expect(a.completion.skillsDone).toBe(1)
    expect(a.completion.talentOwned).toBe(true)
  })

  it('no career → no advancement box data', () => {
    expect(careerAdvance(newCharacter())).toBeNull()
  })

  it('full backup carries the career library', () => {
    const lib: CareerLibrary = {
      importedAt: '2026-11-20',
      source: 'my.pdf',
      careers: [TEST_CAREER],
    }
    const r = parseImport(JSON.stringify(exportBackup([newCharacter('A')], lib)))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.careerLibrary?.careers[0]?.name).toBe('Soldier')
    const none = parseImport(JSON.stringify(exportBackup([newCharacter('B')])))
    expect(none.ok && none.value.careerLibrary).toBe(null)
  })
})
