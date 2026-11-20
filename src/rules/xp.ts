import type { Character } from '../domain/schema'

/**
 * XP accounting. Costs are always typed in by the player — the app never
 * calculates an XP cost. It only adds up what was entered:
 *   Total   = opening total + all "earned" entries
 *   Spent   = opening spent + all "spent" entries
 *   Current = Total − Spent   (the sheet's Experience: Current / Spent / Total)
 */
export type XpSummary = {
  total: number
  spent: number
  current: number
  earnedInLog: number
  spentInLog: number
  /** Log entries without an amount (not counted). */
  incomplete: number
  negativeCurrent: boolean
}

export function xpSummary(c: Character): XpSummary {
  let earnedInLog = 0
  let spentInLog = 0
  let incomplete = 0
  for (const e of c.xp.log) {
    if (e.amount === null) {
      incomplete += 1
      continue
    }
    if (e.kind === 'earned') earnedInLog += e.amount
    else spentInLog += e.amount
  }
  const total = (c.xp.openingTotal ?? 0) + earnedInLog
  const spent = (c.xp.openingSpent ?? 0) + spentInLog
  const current = total - spent
  return {
    total,
    spent,
    current,
    earnedInLog,
    spentInLog,
    incomplete,
    negativeCurrent: current < 0,
  }
}
