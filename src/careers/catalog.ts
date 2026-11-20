/**
 * Career names grouped by Class, in the order they appear in Chapter 3 of the
 * Core Rulebook (p. 53–116). Names only — all career details (levels, status,
 * skills, talents, trappings) are imported by the player from their own copy
 * of the rulebook and stay on their device.
 */
export const CAREER_CLASSES: { name: string; careers: string[] }[] = [
  {
    name: 'Academics',
    careers: [
      'Apothecary',
      'Engineer',
      'Lawyer',
      'Nun',
      'Physician',
      'Priest',
      'Scholar',
      'Wizard',
    ],
  },
  {
    name: 'Burghers',
    careers: [
      'Agitator',
      'Artisan',
      'Beggar',
      'Investigator',
      'Merchant',
      'Rat Catcher',
      'Townsman',
      'Watchman',
    ],
  },
  {
    name: 'Courtiers',
    careers: ['Advisor', 'Artist', 'Duellist', 'Envoy', 'Noble', 'Servant', 'Spy', 'Warden'],
  },
  {
    name: 'Peasants',
    careers: [
      'Bailiff',
      'Hedge Witch',
      'Herbalist',
      'Hunter',
      'Miner',
      'Mystic',
      'Scout',
      'Villager',
    ],
  },
  {
    name: 'Rangers',
    careers: [
      'Bounty Hunter',
      'Coachman',
      'Entertainer',
      'Flagellant',
      'Messenger',
      'Pedlar',
      'Road Warden',
      'Witch Hunter',
    ],
  },
  {
    name: 'Riverfolk',
    careers: [
      'Boatman',
      'Huffer',
      'Riverwarden',
      'Riverwoman',
      'Seaman',
      'Smuggler',
      'Stevedore',
      'Wrecker',
    ],
  },
  {
    name: 'Rogues',
    careers: [
      'Bawd',
      'Charlatan',
      'Fence',
      'Grave Robber',
      'Outlaw',
      'Racketeer',
      'Thief',
      'Witch',
    ],
  },
  {
    name: 'Warriors',
    careers: [
      'Cavalryman',
      'Guard',
      'Knight',
      'Pit Fighter',
      'Protagonist',
      'Slayer',
      'Soldier',
      'Warrior Priest',
    ],
  },
]

export const ALL_CAREERS: { name: string; class: string }[] = CAREER_CLASSES.flatMap((c) =>
  c.careers.map((name) => ({ name, class: c.name })),
)

export function careerClass(name: string): string {
  return ALL_CAREERS.find((c) => c.name === name)?.class ?? ''
}
