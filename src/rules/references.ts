/**
 * Rule sources for every automatic calculation. Page numbers refer to the
 * WFRP 4th Edition Core Rulebook PDF (printed page numbers = PDF pages).
 * Only facts are referenced here; no rule text is reproduced.
 */
export type RuleRef = { title: string; pages: string; note?: string }

export const REFS = {
  current: { title: 'Current = Initial + Advances', pages: 'p. 35, 47' },
  bonus: { title: 'Characteristic Bonus = tens digit', pages: 'p. 34' },
  skill: {
    title: 'Skill = Characteristic + Skill Advances',
    pages: 'p. 47, 117',
    note: 'Advanced Skills cannot be Tested without at least one Advance (p. 118).',
  },
  wounds: {
    title: 'Wounds = SB + (2 × TB) + WPB; Halflings (2 × TB) + WPB',
    pages: 'p. 33–34',
  },
  hardy: { title: 'Hardy adds Toughness Bonus to Wounds', pages: 'p. 138' },
  movement: { title: 'Walk = 2 × Movement, Run = 4 × Movement', pages: 'p. 35, 165' },
  encumbrance: {
    title: 'Encumbrance limit = SB + TB',
    pages: 'p. 293',
    note: 'Penalties for exceeding the limit are shown as a reminder only.',
  },
  difficulty: { title: 'Difficulty modifiers add to the Test target', pages: 'p. 152–153' },
  advantage: { title: '+10 per Advantage to appropriate combat Tests', pages: 'p. 164' },
  corruption: {
    title: 'Corruption limits: mutations > TB or mental corruptions > WPB',
    pages: 'p. 183',
  },
  damage: { title: 'Weapon Damage is added to SL; +SB uses Strength Bonus', pages: 'p. 293–294' },
  hitLocations: { title: 'Hit Locations', pages: 'p. 159' },
  armour: {
    title: 'Armour Points by location',
    pages: 'p. 299–300',
    note: 'No general stacking formula is given, so totals per location are entered manually.',
  },
  xpCosts: {
    title: 'XP costs',
    pages: 'p. 47–49',
    note: 'Entered manually in the log; the app never calculates costs.',
  },
  conditions: { title: 'Conditions', pages: 'p. 167–169' },
  criticals: { title: 'Wounds, Critical Wounds and Death', pages: 'p. 172–174' },
} satisfies Record<string, RuleRef>

export type RefKey = keyof typeof REFS

export function formatRef(r: RuleRef): string {
  return `WFRP 4e Core Rulebook ${r.pages}`
}
