import { describe, expect, it } from 'vitest'
import { exampleCharacter } from '../domain/example'
import { newCharacter, newId } from '../domain/factory'
import { xpSummary } from './xp'

describe('XP reconciliation', () => {
  it('Total − Spent = Current, using only entered amounts', () => {
    const c = newCharacter()
    c.xp.openingTotal = 100
    c.xp.openingSpent = 40
    c.xp.log.push(
      {
        id: newId(),
        kind: 'earned',
        date: '',
        session: '',
        category: 'award',
        name: '',
        before: '',
        after: '',
        amount: 150,
        notes: '',
      },
      {
        id: newId(),
        kind: 'spent',
        date: '',
        session: '',
        category: 'skill',
        name: 'Dodge',
        before: '',
        after: '',
        amount: 25,
        notes: '',
      },
      {
        id: newId(),
        kind: 'spent',
        date: '',
        session: '',
        category: 'talent',
        name: 'Hardy',
        before: '',
        after: '',
        amount: null,
        notes: '',
      },
    )
    const s = xpSummary(c)
    expect(s.total).toBe(250)
    expect(s.spent).toBe(65)
    expect(s.current).toBe(185)
    expect(s.total - s.spent).toBe(s.current)
    expect(s.incomplete).toBe(1)
  })
  it('example character reconciles', () => {
    const s = xpSummary(exampleCharacter())
    expect(s.current).toBe(s.total - s.spent)
    expect(s.negativeCurrent).toBe(false)
  })
  it('flags overspending', () => {
    const c = newCharacter()
    c.xp.log.push({
      id: newId(),
      kind: 'spent',
      date: '',
      session: '',
      category: 'skill',
      name: '',
      before: '',
      after: '',
      amount: 10,
      notes: '',
    })
    expect(xpSummary(c).negativeCurrent).toBe(true)
  })
})
