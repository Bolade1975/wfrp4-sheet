import { makeSkill, newCharacter, newId } from './factory'
import type { Character } from './schema'

/**
 * An invented example character for trying out the app. Clearly marked as
 * EXAMPLE DATA everywhere (roster, header, PDF). Item stats are entered by
 * hand as a player would; they are sample inputs, not reference data.
 */
export function exampleCharacter(): Character {
  const c = newCharacter('Greta Holzmann')
  c.isExample = true
  c.identity = {
    ...c.identity,
    species: 'human',
    class: 'Warriors',
    career: 'Soldier',
    careerLevel: 1,
    careerPath: 'Recruit',
    statusTier: 'silver',
    statusStanding: 1,
    age: '24',
    height: '5\'8"',
    hair: 'Auburn',
    eyes: 'Grey',
    motivation: 'Protect the weak',
  }
  const init = { ws: 38, bs: 31, s: 34, t: 36, i: 33, ag: 30, dex: 27, int: 29, wp: 32, fel: 28 }
  const adv = { ws: 3, bs: 0, s: 0, t: 2, i: 0, ag: 0, dex: 0, int: 0, wp: 0, fel: 0 }
  for (const k of Object.keys(init) as (keyof typeof init)[]) {
    c.characteristics[k] = {
      initial: init[k],
      advances: adv[k],
      inCareer: ['ws', 't', 'wp'].includes(k),
    }
  }
  c.fate = 2
  c.fortune = 2
  c.resilience = 2
  c.resolve = 1
  c.movement = 4
  c.wounds.current = 11
  c.advantage = 0
  c.corruption = 1
  c.ambitions = { short: 'Earn the respect of the sergeant.', long: 'Command my own company.' }
  c.party = {
    name: 'The Grey Lanterns',
    short: 'Escort the cart to Ubersreik.',
    long: 'Clear our names in Altdorf.',
    members: 'Greta, Ansel (scribe), Wim (rat catcher)',
  }

  const set = (name: string, spec: string, advances: number, inCareer = true) => {
    const s = c.skills.find((x) => x.name === name && x.specialisation === spec)
    if (s) Object.assign(s, { advances, inCareer })
    else c.skills.push(makeSkill(name, spec, { advances, inCareer }))
  }
  set('Athletics', '', 3)
  set('Climb', '', 2)
  set('Cool', '', 5)
  set('Dodge', '', 5)
  set('Endurance', '', 5)
  set('Melee', 'Basic', 10)
  set('Gamble', '', 3)
  set('Outdoor Survival', '', 2)
  set('Perception', '', 4, false)
  set('Language', 'Battle Tongue', 3)
  set('Ranged', 'Crossbow', 5)
  set('Heal', '', 0, false)
  const melee = c.skills.find((s) => s.name === 'Melee' && s.specialisation === 'Basic')!
  const xbow = c.skills.find((s) => s.name === 'Ranged')!
  for (const s of c.skills)
    if (['Dodge', 'Cool', 'Melee', 'Ranged', 'Perception'].includes(s.name)) s.favourite = true

  c.talents = [
    {
      id: newId(),
      name: 'Diceman',
      timesTaken: 1,
      max: 'Intelligence Bonus',
      tests: 'Gamble',
      description: 'Example entry — write your own summary.',
      notes: '',
    },
    {
      id: newId(),
      name: 'Warrior Born',
      timesTaken: 1,
      max: '1',
      tests: '',
      description: 'Example entry.',
      notes: '',
    },
  ]
  c.psychology = [{ id: newId(), name: 'Animosity (Beastmen)', description: 'Example entry.' }]

  c.weapons = [
    {
      id: newId(),
      kind: 'melee',
      name: 'Hand Weapon (Sword)',
      quantity: 1,
      enc: 1,
      location: 'Belt',
      current: true,
      notes: '',
      group: 'Basic',
      rangeReach: 'Average',
      damage: '+SB+4',
      qualities: '',
      skillId: melee.id,
      ammo: '',
    },
    {
      id: newId(),
      kind: 'ranged',
      name: 'Crossbow',
      quantity: 1,
      enc: 2,
      location: 'Back',
      current: true,
      notes: '',
      group: 'Crossbow',
      rangeReach: '100',
      damage: '+9',
      qualities: 'Reload 1',
      skillId: xbow.id,
      ammo: '12 bolts',
    },
    {
      id: newId(),
      kind: 'melee',
      name: 'Dagger',
      quantity: 1,
      enc: 0,
      location: 'Boot',
      current: true,
      notes: '',
      group: 'Basic',
      rangeReach: 'Very Short',
      damage: '+SB+2',
      qualities: '',
      skillId: melee.id,
      ammo: '',
    },
    {
      id: newId(),
      kind: 'melee',
      name: 'Halberd (left at the barracks)',
      quantity: 1,
      enc: 3,
      location: 'Barracks',
      current: false,
      notes: '',
      group: 'Polearm',
      rangeReach: 'Long',
      damage: '+SB+4',
      qualities: '',
      skillId: null,
      ammo: '',
    },
  ]
  c.armour = [
    {
      id: newId(),
      name: 'Leather Jack',
      quantity: 1,
      enc: 1,
      location: 'Worn',
      current: true,
      notes: '',
      locations: ['leftArm', 'rightArm', 'body'],
      ap: 1,
      qualities: '',
      penalty: '',
      worn: true,
    },
    {
      id: newId(),
      name: 'Leather Skullcap',
      quantity: 1,
      enc: 0,
      location: 'Worn',
      current: true,
      notes: '',
      locations: ['head'],
      ap: 1,
      qualities: '',
      penalty: '',
      worn: true,
    },
  ]
  c.apTotals = { head: 1, leftArm: 1, rightArm: 1, body: 1, leftLeg: null, rightLeg: null }
  c.trappings = [
    {
      id: newId(),
      name: 'Backpack',
      quantity: 1,
      enc: 1,
      location: 'Back',
      current: true,
      notes: '',
      category: 'container',
    },
    {
      id: newId(),
      name: 'Blanket and tinderbox',
      quantity: 1,
      enc: 1,
      location: 'Backpack',
      current: true,
      notes: '',
      category: 'equipment',
    },
    {
      id: newId(),
      name: 'Rations (days)',
      quantity: 3,
      enc: 1,
      location: 'Backpack',
      current: true,
      notes: '',
      category: 'consumable',
    },
    {
      id: newId(),
      name: 'Dice and a deck of cards',
      quantity: 1,
      enc: 0,
      location: 'Pouch',
      current: true,
      notes: '',
      category: 'tool',
    },
    {
      id: newId(),
      name: "Mother's letters",
      quantity: 1,
      enc: 0,
      location: 'Home',
      current: false,
      notes: 'Kept with my sister.',
      category: 'other',
    },
  ]
  c.wealth = { gc: 0, ss: 3, d: 14 }
  c.conditions = [{ id: newId(), name: 'Fatigued', count: 1, notes: 'From the forced march.' }]
  c.criticalWounds = []
  c.xp = {
    openingTotal: 0,
    openingSpent: 0,
    log: [
      {
        id: newId(),
        kind: 'earned',
        date: '',
        session: 'Creation',
        category: 'award',
        name: 'Random species, career and characteristics',
        before: '',
        after: '',
        amount: 120,
        notes: 'Example entry.',
      },
      {
        id: newId(),
        kind: 'earned',
        date: '',
        session: 'Session 1',
        category: 'award',
        name: 'Session award',
        before: '',
        after: '',
        amount: 150,
        notes: '',
      },
      {
        id: newId(),
        kind: 'spent',
        date: '',
        session: 'Session 1',
        category: 'characteristic',
        name: 'Weapon Skill',
        before: '38',
        after: '41',
        amount: 75,
        notes: 'Example — cost typed by the player.',
      },
      {
        id: newId(),
        kind: 'spent',
        date: '',
        session: 'Session 1',
        category: 'skill',
        name: 'Dodge',
        before: '0 adv',
        after: '5 adv',
        amount: 50,
        notes: '',
      },
    ],
  }
  c.quickTests = [
    {
      id: newId(),
      label: 'Parry',
      source: { kind: 'skill', skillId: melee.id },
      modifier: null,
      modifierNote: '',
      notes: 'Opposed against the attack.',
    },
    {
      id: newId(),
      label: 'Resist fear',
      source: { kind: 'skill', skillId: c.skills.find((s) => s.name === 'Cool')!.id },
      modifier: null,
      modifierNote: '',
      notes: '',
    },
    {
      id: newId(),
      label: 'Spot an ambush',
      source: { kind: 'skill', skillId: c.skills.find((s) => s.name === 'Perception')!.id },
      modifier: 20,
      modifierNote: 'Average (GM call)',
      notes: '',
    },
  ]
  c.notes = [
    {
      id: newId(),
      category: 'relationship',
      title: 'Sergeant Rudi Klein',
      body: 'Gruff, fair. Owes me for the bridge.',
      date: '',
    },
    { id: newId(), category: 'goal', title: 'Find out who forged the orders', body: '', date: '' },
  ]
  return c
}
