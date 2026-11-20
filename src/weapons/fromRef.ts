import type { Character, QualityRef, Weapon, WeaponLibrary, WeaponRef } from '../domain/schema'
import { parseQualityText } from './qualities'

export type QualityInfo = Map<string, QualityRef>

export function qualityInfo(lib: WeaponLibrary | null | undefined): QualityInfo {
  return new Map((lib?.qualities ?? []).map((q) => [q.name, q]))
}

/** Fields of a weapon item filled from a rulebook row (stats as printed). */
export function weaponFromRef(ref: WeaponRef, c: Character): Partial<Weapon> {
  const { tags, rest } = parseQualityText(ref.qualities.join(', '))
  // Footnote on the ranged table (p. 295): Blackpowder and Engineering
  // weapons have the Blackpowder and Damaging Qualities.
  if (ref.footnote && /^(Blackpowder|Engineering)$/i.test(ref.group))
    for (const name of ['Blackpowder', 'Damaging'])
      if (!tags.some((t) => t.name === name)) tags.push({ name, rating: null })
  const enc = /^\d+$/.test(ref.enc) ? Number(ref.enc) : null
  const skillName = ref.kind === 'melee' ? 'Melee' : 'Ranged'
  const skill = c.skills.find(
    (s) =>
      s.name.toLowerCase() === skillName.toLowerCase() &&
      s.specialisation.toLowerCase() === ref.group.toLowerCase(),
  )
  const extra = [
    ref.enc && enc === null ? `Enc ${ref.enc}` : '',
    ref.price ? `Price ${ref.price}` : '',
    ref.availability ? `Availability ${ref.availability}` : '',
  ].filter(Boolean)
  return {
    name: ref.name,
    kind: ref.kind,
    group: ref.group,
    twoHanded: ref.twoHanded,
    rangeReach: ref.reachRange,
    damage: ref.damage,
    enc,
    qualityTags: tags,
    qualities: rest,
    skillId: skill?.id ?? null,
    notes: extra.join(' · '),
  }
}
