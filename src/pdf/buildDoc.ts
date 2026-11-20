import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import { careerLine, displayName, speciesLabel, statusLabel } from '../domain/factory'
import { CHAR_KEYS, LOCATIONS, type Character, type Weapon } from '../domain/schema'
import { HIT_LOCATIONS } from '../rules/catalog'
import {
  CHAR_LABELS,
  CHAR_NAMES,
  ENC_LEVEL_TEXT,
  bonus,
  canTest,
  characteristic,
  corruptionLimits,
  encumbrance,
  isSheetBasic,
  maxWounds,
  quickTestBase,
  run,
  skillLabel,
  skillValue,
  testTarget,
  walk,
  weaponDamage,
  weaponSkill,
  weaponTest,
  type Derived,
} from '../rules/engine'
import { xpSummary } from '../rules/xp'

/**
 * Pure builder for the A4 PDF (pdfmake document definition): a light,
 * print-friendly layout — not a screenshot of the app. Tables repeat their
 * header row on continuation pages, rows never split across pages, headings
 * are never left alone at the bottom of a page, and text wraps instead of
 * being clipped. The Notes tab is never exported.
 */

export const PDF_SECTIONS = [
  { id: 'character', title: 'Character, Ambitions & Party' },
  { id: 'characteristics', title: 'Characteristics, Fate, Resilience, Movement & Wounds' },
  { id: 'skills', title: 'Skills' },
  { id: 'talents', title: 'Talents, Traits & Psychology' },
  { id: 'combat', title: 'Combat: Wounds, Advantage, Conditions, Critical Wounds & Armour Points' },
  { id: 'loadout', title: 'Current Loadout' },
  { id: 'inventory', title: 'Inventory: Weapons, Armour, Trappings, Wealth & Encumbrance' },
  { id: 'magic', title: 'Spells and Prayers' },
  { id: 'corruption', title: 'Corruption & Mutations' },
  { id: 'xp', title: 'Experience & Advancement Log' },
  { id: 'tests', title: 'Quick Tests' },
] as const
export type SectionId = (typeof PDF_SECTIONS)[number]['id']

export type PdfOptions = { sections: SectionId[]; exportDate: Date }

export const DEFAULT_SECTIONS: SectionId[] = PDF_SECTIONS.map((s) => s.id)

const C = {
  ink: '#1d1a16',
  muted: '#6b6257',
  accent: '#7a1c1c',
  line: '#c8bba3',
  head: '#efe6d3',
  zebra: '#f8f4ea',
  manual: '#8a5a00',
  brass: '#9a7224',
}

// ---------- helpers ----------

const dash = (v: number | string | null | undefined): string =>
  v === null || v === undefined || v === '' ? '—' : String(v)

function val(d: Derived | null, empty = '—'): Content {
  if (!d || d.value === null) return { text: empty, color: C.muted }
  if (d.overridden)
    return {
      text: [
        { text: String(d.value), bold: true },
        { text: ' MANUAL', color: C.manual, bold: true, fontSize: 6.5 },
      ],
    }
  return { text: String(d.value), bold: true }
}

function h1(text: string): Content {
  return {
    stack: [
      { text: text.toUpperCase(), style: 'section' },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: C.accent }],
      },
    ],
    margin: [0, 12, 0, 6],
    headlineLevel: 1,
  } as Content
}

function h2(text: string, headline = true): Content {
  return (headline ? { text, style: 'sub', headlineLevel: 1 } : { text, style: 'sub' }) as Content
}

function empty(text: string): Content {
  return { text, color: C.muted, italics: true, margin: [0, 0, 0, 6] }
}

function th(text: string, alignment: 'left' | 'center' | 'right' = 'left'): TableCell {
  return { text, bold: true, fillColor: C.head, fontSize: 8, alignment }
}

function table(widths: (string | number)[], header: TableCell[], rows: TableCell[][]): Content {
  return {
    table: { headerRows: 1, dontBreakRows: true, widths, body: [header, ...rows] },
    layout: 'sheet',
    margin: [0, 0, 0, 8],
  }
}

function kvTable(
  rows: [string, Content | string][],
  widths: (string | number)[] = [110, '*'],
): Content {
  return {
    table: {
      dontBreakRows: true,
      widths,
      body: rows.map(([k, v]) => [
        { text: k, color: C.muted, fontSize: 8 },
        typeof v === 'string' ? { text: dash(v) } : v,
      ]),
    },
    layout: 'kv',
    margin: [0, 0, 0, 6],
  }
}

/** Keeps a small block on one page. */
function keep(content: Content[]): Content {
  return { stack: content, unbreakable: true } as Content
}

function locText(ls: string[]): string {
  if (ls.length === LOCATIONS.length) return 'All'
  return HIT_LOCATIONS.filter((h) => ls.includes(h.key))
    .map((h) => h.label)
    .join(', ')
}

// ---------- sections ----------

function characterSection(c: Character): Content[] {
  const i = c.identity
  return [
    h1('Character'),
    {
      columns: [
        kvTable([
          ['Name', i.name],
          ['Species', speciesLabel(c)],
          ['Class', i.class],
          ['Career', i.career],
          ['Career Tier', i.careerLevel === null ? '' : String(i.careerLevel)],
          ['Career Path', i.careerPath],
        ]),
        kvTable([
          ['Status', statusLabel(c)],
          ['Age', i.age],
          ['Height', i.height],
          ['Hair', i.hair],
          ['Eyes', i.eyes],
          ['Motivation', i.motivation],
        ]),
      ],
      columnGap: 16,
    },
    h2('Ambitions'),
    kvTable([
      ['Short Term', c.ambitions.short],
      ['Long Term', c.ambitions.long],
    ]),
    h2('Party'),
    kvTable([
      ['Party Name', c.party.name],
      ['Short Term Ambitions', c.party.short],
      ['Long Term Ambitions', c.party.long],
      ['Members', c.party.members],
    ]),
  ]
}

function characteristicsSection(c: Character): Content[] {
  const header: TableCell[] = [th(''), ...CHAR_KEYS.map((k) => th(CHAR_LABELS[k], 'center'))]
  const row = (label: string, f: (k: (typeof CHAR_KEYS)[number]) => Content): TableCell[] => [
    { text: label, bold: true, fontSize: 8 },
    ...CHAR_KEYS.map((k) => ({ ...(f(k) as object), alignment: 'center' }) as TableCell),
  ]
  const xp = xpSummary(c)
  const w = maxWounds(c)
  const part = (l: string) => w.parts.find((p) => p.label === l)?.value ?? null
  return [
    h1('Characteristics'),
    table([52, ...CHAR_KEYS.map(() => '*')], header, [
      row('Initial', (k) => ({ text: dash(c.characteristics[k].initial) })),
      row('Advances', (k) => ({ text: String(c.characteristics[k].advances) })),
      row('Current', (k) => val(characteristic(c, k))),
      row('Bonus', (k) => ({ text: dash(bonus(c, k)), color: C.muted })),
      row('Career', (k) => ({ text: c.characteristics[k].inCareer ? '●' : '', color: C.accent })),
    ]),
    {
      columns: [
        keep([
          h2('Fate', false),
          kvTable(
            [
              ['Fate', dash(c.fate)],
              ['Fortune', dash(c.fortune)],
            ],
            [60, '*'],
          ),
        ]),
        keep([
          h2('Resilience', false),
          kvTable(
            [
              ['Resilience', dash(c.resilience)],
              ['Resolve', dash(c.resolve)],
              ['Motivation', c.identity.motivation],
            ],
            [60, '*'],
          ),
        ]),
        keep([
          h2('Experience', false),
          kvTable(
            [
              ['Current', String(xp.current)],
              ['Spent', String(xp.spent)],
              ['Total', String(xp.total)],
            ],
            [60, '*'],
          ),
        ]),
      ],
      columnGap: 14,
      unbreakable: true,
    },
    {
      columns: [
        keep([
          h2('Movement', false),
          kvTable(
            [
              ['Movement', dash(c.movement)],
              ['Walk', val(walk(c))],
              ['Run', val(run(c))],
            ],
            [60, '*'],
          ),
        ]),
        keep([
          h2('Wounds', false),
          kvTable(
            [
              ['SB', c.identity.species === 'halfling' ? '— (Halfling)' : dash(part('SB'))],
              ['TB × 2', dash(part('TB × 2'))],
              ['WPB', dash(part('WPB'))],
              ['Hardy', dash(part('Hardy (TB)'))],
              ['Wounds', val(w)],
            ],
            [60, '*'],
          ),
        ]),
      ],
      columnGap: 14,
      unbreakable: true,
    },
  ]
}

function skillsSection(c: Character): Content[] {
  if (c.skills.length === 0) return [h1('Skills'), empty('No skills recorded.')]
  const basic = c.skills.filter(isSheetBasic)
  const other = c.skills.filter((s) => !isSheetBasic(s))
  const rows = (list: typeof c.skills): TableCell[][] =>
    list.map((s) => {
      const d = skillValue(c, s)
      return [
        {
          text: [
            { text: skillLabel(s) },
            ...(s.notes ? [{ text: `\n${s.notes}`, fontSize: 7.5, color: C.muted }] : []),
          ],
        },
        { text: CHAR_LABELS[s.characteristic], alignment: 'center' },
        { text: s.type === 'advanced' ? 'Adv.' : 'Basic', fontSize: 7.5, color: C.muted },
        { text: s.inCareer ? '●' : '', alignment: 'center', color: C.brass },
        { text: s.race ? '●' : '', alignment: 'center', color: C.accent },
        { text: String(s.advances), alignment: 'center' },
        canTest(s) || d.overridden
          ? ({ ...(val(d) as object), alignment: 'center' } as TableCell)
          : { text: 'n/a', alignment: 'center', color: C.muted, fontSize: 7.5 },
      ]
    })
  const header = () => [
    th('Name'),
    th('Char.', 'center'),
    th('Type'),
    th('Career', 'center'),
    th('Race', 'center'),
    th('Adv', 'center'),
    th('Skill', 'center'),
  ]
  const widths = ['*', 34, 34, 36, 30, 28, 40]
  return [
    h1('Skills'),
    {
      text: '● = marked as Career or Race skill · n/a = Advanced Skill without Advances (cannot be Tested, p. 118)',
      fontSize: 7.5,
      color: C.muted,
      margin: [0, 0, 0, 4],
    },
    ...(basic.length ? [h2('Basic Skills'), table(widths, header(), rows(basic))] : []),
    ...(other.length
      ? [h2('Grouped & Advanced Skills'), table(widths, header(), rows(other))]
      : []),
  ]
}

function talentsSection(c: Character): Content[] {
  const out: Content[] = [h1('Talents')]
  out.push(
    c.talents.length
      ? table(
          [110, 34, '*'],
          [th('Talent Name'), th('Times taken', 'center'), th('Description')],
          c.talents.map((t) => [
            { text: t.name || '—', bold: true },
            { text: String(t.timesTaken), alignment: 'center' },
            {
              text: [
                t.description,
                ...(t.max ? [`\nMax: ${t.max}`] : []),
                ...(t.tests ? [`\nTests: ${t.tests}`] : []),
                ...(t.notes ? [{ text: `\n${t.notes}`, color: C.muted }] : []),
              ].filter(Boolean),
            },
          ]),
        )
      : empty('No talents recorded.'),
  )
  if (c.traits.length) {
    out.push(h2('Traits'))
    out.push(
      table(
        [110, '*'],
        [th('Trait'), th('Description')],
        c.traits.map((t) => [
          { text: t.name || '—', bold: true },
          {
            text:
              [t.description, ...(t.notes ? [`\n${t.notes}`] : [])].filter(Boolean).join('') || '—',
          },
        ]),
      ),
    )
  }
  out.push(h2('Psychology'))
  out.push(
    c.psychology.length
      ? table(
          [110, '*'],
          [th('Psychology'), th('Details')],
          c.psychology.map((p) => [
            { text: p.name || '—', bold: true },
            { text: dash(p.description) },
          ]),
        )
      : empty('None recorded.'),
  )
  return out
}

function weaponRows(c: Character, ws: Weapon[], withLocation: boolean): TableCell[][] {
  return ws.map((w) => {
    const t = weaponTest(c, w)
    const sk = weaponSkill(c, w)
    const d = weaponDamage(c, w)
    return [
      {
        text: [
          { text: w.name || '—', bold: true },
          ...(w.ammo ? [{ text: `\nAmmo: ${w.ammo}`, fontSize: 7.5, color: C.muted }] : []),
          ...(withLocation && w.location
            ? [{ text: `\n${w.location}`, fontSize: 7.5, color: C.muted }]
            : []),
          ...(w.notes ? [{ text: `\n${w.notes}`, fontSize: 7.5, color: C.muted }] : []),
        ],
      },
      { text: dash(w.group) },
      { text: dash(w.enc), alignment: 'center' },
      { text: dash(w.rangeReach) },
      {
        text:
          d.value !== null
            ? [
                { text: `${d.value}`, bold: true },
                { text: ` (${w.damage})`, color: C.muted, fontSize: 7.5 },
              ]
            : dash(w.damage),
      },
      t
        ? ({
            stack: [
              val(t, sk && !canTest(sk) ? 'n/a' : '—'),
              { text: sk ? skillLabel(sk) : '', fontSize: 7, color: C.muted },
            ],
            alignment: 'center',
          } as TableCell)
        : { text: '—', alignment: 'center', color: C.muted },
      { text: dash(w.qualities) },
    ]
  })
}

const weaponHeader = (): TableCell[] => [
  th('Name'),
  th('Group'),
  th('Enc', 'center'),
  th('Range/Reach'),
  th('Damage'),
  th('Test', 'center'),
  th('Qualities'),
]
const weaponWidths = ['*', 50, 24, 50, 52, 54, 90]

function armourTable(list: Character['armour'], marker = false): Content {
  return table(
    [...(marker ? [10] : []), '*', 110, 24, 24, 110],
    [
      ...(marker ? [th('')] : []),
      th('Name'),
      th('Locations'),
      th('Enc', 'center'),
      th('AP', 'center'),
      th('Qualities'),
    ],
    list.map((a) => [
      ...(marker ? [{ text: a.current ? '●' : '', color: C.accent } as TableCell] : []),
      {
        text: [
          { text: a.name || '—', bold: true },
          ...(a.worn ? [{ text: '  (worn)', color: C.muted, fontSize: 7.5 }] : []),
          ...(a.penalty
            ? [{ text: `\nPenalty: ${a.penalty}`, fontSize: 7.5, color: C.muted }]
            : []),
          ...(a.notes ? [{ text: `\n${a.notes}`, fontSize: 7.5, color: C.muted }] : []),
        ],
      },
      { text: locText(a.locations) || '—' },
      { text: dash(a.enc), alignment: 'center' },
      { text: dash(a.ap), alignment: 'center' },
      { text: dash(a.qualities) },
    ]),
  )
}

function apTable(c: Character): Content {
  return table(
    [70, 38, 30, '*'],
    [th('Location'), th('Roll'), th('AP', 'center'), th('Worn armour covering it')],
    [
      ...HIT_LOCATIONS.map((h) => {
        const pieces = c.armour.filter((a) => a.worn && a.locations.includes(h.key))
        return [
          { text: h.label, bold: true },
          { text: h.roll },
          { text: dash(c.apTotals[h.key]), alignment: 'center', bold: true },
          { text: pieces.map((a) => `${a.name} ${dash(a.ap)}`).join(', ') || '—', color: C.muted },
        ] as TableCell[]
      }),
      [
        { text: 'Shield', bold: true },
        { text: '' },
        { text: dash(c.shield), alignment: 'center', bold: true },
        { text: '' },
      ],
    ],
  )
}

function combatSection(c: Character): Content[] {
  const w = maxWounds(c)
  return [
    h1('Combat'),
    {
      columns: [
        kvTable([
          ['Wounds (current)', dash(c.wounds.current)],
          ['Wounds (max)', val(w)],
          ['Advantage', String(c.advantage)],
        ]),
        kvTable([
          ['Fortune / Fate', `${dash(c.fortune)} / ${dash(c.fate)}`],
          ['Resolve / Resilience', `${dash(c.resolve)} / ${dash(c.resilience)}`],
          ['Corruption', dash(c.corruption)],
        ]),
      ],
      columnGap: 16,
    },
    h2('Conditions'),
    c.conditions.length
      ? table(
          [110, 30, '*'],
          [th('Condition'), th('Count', 'center'), th('Note')],
          c.conditions.map((k) => [
            { text: k.name, bold: true },
            { text: String(k.count), alignment: 'center' },
            { text: dash(k.notes) },
          ]),
        )
      : empty('No Conditions.'),
    h2('Critical Wounds'),
    c.criticalWounds.length
      ? table(
          [60, 90, '*', 80, 36],
          [th('Location'), th('Critical'), th('Effect'), th('Duration'), th('Status')],
          c.criticalWounds.map((k) => [
            { text: dash(k.location) },
            { text: dash(k.name), bold: true },
            { text: dash(k.effect) },
            { text: dash(k.duration) },
            { text: k.healed ? 'Healed' : 'Active', color: k.healed ? C.muted : C.accent },
          ]),
        )
      : empty('No Critical Wounds.'),
    keep([h2('Armour Points'), apTable(c)]),
  ]
}

function encumbranceBlock(c: Character): Content {
  const e = encumbrance(c)
  return keep([
    h2('Encumbrance (current items)', false),
    kvTable([
      ['Weapons', String(e.weapons)],
      ['Armour', String(e.armour)],
      ['Trappings', String(e.trappings)],
      ['Total', { text: String(e.total), bold: true }],
      ['Max Enc. (SB + TB)', val(e.max)],
      ['State', e.level === null ? '—' : ENC_LEVEL_TEXT[e.level]],
    ]),
  ])
}

function trappingsTable(list: Character['trappings']): Content {
  return table(
    ['*', 30, 110, 28],
    [th('Name'), th('Qty', 'center'), th('Where / slot'), th('Enc', 'center')],
    list.map((t) => [
      {
        text: [
          { text: t.name || '—', bold: true },
          ...(t.notes ? [{ text: `\n${t.notes}`, fontSize: 7.5, color: C.muted }] : []),
        ],
      },
      { text: dash(t.quantity), alignment: 'center' },
      { text: dash(t.location) },
      { text: dash(t.enc), alignment: 'center' },
    ]),
  )
}

function loadoutSection(c: Character): Content[] {
  const ws = c.weapons.filter((w) => w.current)
  const as = c.armour.filter((a) => a.current)
  const ts = c.trappings.filter((t) => t.current)
  return [
    h1('Current Loadout'),
    {
      text: 'Only items marked Current (carried or available now).',
      fontSize: 7.5,
      color: C.muted,
      margin: [0, 0, 0, 4],
    },
    h2('Weapons'),
    ws.length ? table(weaponWidths, weaponHeader(), weaponRows(c, ws, true)) : empty('None.'),
    h2('Armour'),
    as.length ? armourTable(as) : empty('None.'),
    h2('Equipment & other items'),
    ts.length ? trappingsTable(ts) : empty('None.'),
    encumbranceBlock(c),
  ]
}

function inventorySection(c: Character): Content[] {
  return [
    h1('Inventory'),
    {
      text: '● = Current (carried or available now). All owned items are listed.',
      fontSize: 7.5,
      color: C.muted,
      margin: [0, 0, 0, 4],
    },
    h2('Weapons'),
    c.weapons.length
      ? table(
          [10, ...weaponWidths],
          [th(''), ...weaponHeader()],
          weaponRows(c, c.weapons, true).map((r, i) => [
            { text: c.weapons[i]!.current ? '●' : '', color: C.accent },
            ...r,
          ]),
        )
      : empty('No weapons.'),
    h2('Armour'),
    c.armour.length ? armourTable(c.armour, true) : empty('No armour.'),
    h2('Trappings'),
    c.trappings.length
      ? table(
          [10, '*', 30, 110, 28],
          [th(''), th('Name'), th('Qty', 'center'), th('Where / slot'), th('Enc', 'center')],
          c.trappings.map((t) => [
            { text: t.current ? '●' : '', color: C.accent },
            {
              text: [
                { text: t.name || '—', bold: true },
                ...(t.notes ? [{ text: `\n${t.notes}`, fontSize: 7.5, color: C.muted }] : []),
              ],
            },
            { text: dash(t.quantity), alignment: 'center' },
            { text: dash(t.location) },
            { text: dash(t.enc), alignment: 'center' },
          ]),
        )
      : empty('No trappings.'),
    {
      columns: [
        keep([
          h2('Wealth', false),
          kvTable(
            [
              ['GC', dash(c.wealth.gc)],
              ['SS', dash(c.wealth.ss)],
              ['D', dash(c.wealth.d)],
              ...c.wealth.notes.filter((n) => n.trim()).map((n): [string, string] => ['Note', n]),
            ],
            [40, '*'],
          ),
        ]),
        encumbranceBlock(c),
      ],
      columnGap: 16,
    },
  ]
}

function magicSection(c: Character): Content[] {
  return [
    h1('Spells and Prayers'),
    c.spells.length
      ? table(
          [90, 26, 46, 46, 46, '*'],
          [th('Name'), th('TN', 'center'), th('Range'), th('Target'), th('Duration'), th('Effect')],
          c.spells.map((s) => [
            {
              text: [
                { text: s.name || '—', bold: true },
                {
                  text: `\n${[s.kind === 'petty' ? 'Petty' : s.kind[0]!.toUpperCase() + s.kind.slice(1), s.lore].filter(Boolean).join(' · ')}`,
                  fontSize: 7,
                  color: C.muted,
                },
              ],
            },
            { text: dash(s.tn), alignment: 'center' },
            { text: dash(s.range) },
            { text: dash(s.target) },
            { text: dash(s.duration) },
            {
              text: [
                s.effect || '—',
                ...(s.notes ? [{ text: `\n${s.notes}`, color: C.muted }] : []),
              ],
            },
          ]),
        )
      : empty('No spells or prayers.'),
    kvTable([['Sin', dash(c.sin)]], [60, '*']),
  ]
}

function corruptionSection(c: Character): Content[] {
  const l = corruptionLimits(c)
  return [
    h1('Corruption & Mutations'),
    kvTable([
      ['Corruption points', dash(c.corruption)],
      ['Physical mutations', `${l.physical} (limit: more than TB ${dash(l.tb)})`],
      ['Mental corruptions', `${l.mental} (limit: more than WPB ${dash(l.wpb)})`],
    ]),
    c.mutations.length
      ? table(
          [110, 50, '*'],
          [th('Mutation'), th('Kind'), th('Effect')],
          c.mutations.map((m) => [
            { text: m.name || '—', bold: true },
            { text: m.kind === 'physical' ? 'Physical' : 'Mental' },
            { text: dash(m.effect) },
          ]),
        )
      : empty('No mutations.'),
  ]
}

function xpSection(c: Character): Content[] {
  const s = xpSummary(c)
  return [
    h1('Experience'),
    kvTable([
      [
        'Total earned',
        `${s.total}  (before log ${dash(c.xp.openingTotal ?? 0)} + log ${s.earnedInLog})`,
      ],
      ['Spent', `${s.spent}  (before log ${dash(c.xp.openingSpent ?? 0)} + log ${s.spentInLog})`],
      ['Unspent (Current)', { text: String(s.current), bold: true }],
      ...(s.incomplete
        ? ([
            [
              'Not counted',
              `${s.incomplete} entr${s.incomplete === 1 ? 'y' : 'ies'} without an XP amount`,
            ],
          ] as [string, string][])
        : []),
    ]),
    h2('Advancement log'),
    c.xp.log.length
      ? table(
          [52, 54, '*', 48, 48, 32, 90],
          [
            th('Session / date'),
            th('Category'),
            th('What changed'),
            th('Before'),
            th('After'),
            th('XP', 'right'),
            th('Notes'),
          ],
          c.xp.log.map((e) => [
            { text: [e.session, e.date].filter(Boolean).join('\n') || '—', fontSize: 7.5 },
            {
              text:
                e.kind === 'earned' ? 'Earned' : e.category[0]!.toUpperCase() + e.category.slice(1),
              fontSize: 7.5,
            },
            { text: dash(e.name), bold: true },
            { text: dash(e.before) },
            { text: dash(e.after) },
            {
              text: e.amount === null ? '—' : `${e.kind === 'earned' ? '+' : '−'}${e.amount}`,
              alignment: 'right',
              color: e.kind === 'earned' ? '#2f5d2f' : C.ink,
              bold: true,
            },
            { text: dash(e.notes), fontSize: 7.5 },
          ]),
        )
      : empty('No log entries.'),
  ]
}

function testsSection(c: Character): Content[] {
  return [
    h1('Quick Tests'),
    c.quickTests.length
      ? table(
          [90, '*', 90, 44, 90],
          [
            th('Test'),
            th('Base (Characteristic / Skill)'),
            th('Situational modifier'),
            th('Target', 'center'),
            th('Notes'),
          ],
          c.quickTests.map((q) => {
            const b = quickTestBase(c, q)
            const v = b.d?.value ?? null
            return [
              { text: q.label || '—', bold: true },
              { text: [{ text: `${b.kind}: `, color: C.muted }, `${b.label} `, val(b.d) as never] },
              {
                text:
                  q.modifier === null
                    ? '—'
                    : `${q.modifier > 0 ? '+' : ''}${q.modifier}${q.modifierNote ? ` (${q.modifierNote})` : ''}`,
              },
              { text: dash(testTarget(v, q.modifier)), alignment: 'center', bold: true },
              { text: dash(q.notes), fontSize: 7.5 },
            ]
          }),
        )
      : empty('No quick tests defined.'),
  ]
}

function manualValues(c: Character): string[] {
  const out: string[] = []
  for (const [id, v] of Object.entries(c.overrides)) {
    let label = id
    if (id.startsWith('char.')) label = CHAR_NAMES[id.slice(5) as (typeof CHAR_KEYS)[number]] ?? id
    else if (id.startsWith('skill.')) {
      const s = c.skills.find((k) => k.id === id.slice(6))
      if (!s) continue
      label = skillLabel(s)
    } else if (id === 'wounds.max') label = 'Wounds'
    else if (id === 'move.walk') label = 'Walk'
    else if (id === 'move.run') label = 'Run'
    else if (id === 'enc.max') label = 'Max Enc.'
    out.push(`${label} = ${v}`)
  }
  return out
}

const BUILDERS: Record<SectionId, (c: Character) => Content[]> = {
  character: characterSection,
  characteristics: characteristicsSection,
  skills: skillsSection,
  talents: talentsSection,
  combat: combatSection,
  loadout: loadoutSection,
  inventory: inventorySection,
  magic: magicSection,
  corruption: corruptionSection,
  xp: xpSection,
  tests: testsSection,
}

export function buildPdfDoc(c: Character, o: PdfOptions): TDocumentDefinitions {
  const name = displayName(c)
  const chosen = PDF_SECTIONS.filter((s) => o.sections.includes(s.id))
  const dateText = o.exportDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const manual = manualValues(c)
  const cover: Content[] = [
    { text: name, style: 'title' },
    {
      text: [speciesLabel(c), careerLine(c), statusLabel(c)].filter(Boolean).join(' · ') || ' ',
      color: C.muted,
      margin: [0, 0, 0, 6],
    },
    ...(c.isExample
      ? [
          {
            text: 'EXAMPLE DATA — not a real character',
            color: C.accent,
            bold: true,
            margin: [0, 0, 0, 4],
          } as Content,
        ]
      : []),
    {
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                { text: 'This export contains', bold: true, fontSize: 8.5, margin: [0, 0, 0, 2] },
                { text: chosen.map((s) => s.title).join(' · '), fontSize: 8 },
                {
                  text:
                    'Not included: the player’s Notes tab (never exported)' +
                    (chosen.length < PDF_SECTIONS.length
                      ? `; ${PDF_SECTIONS.filter((s) => !o.sections.includes(s.id))
                          .map((s) => s.title)
                          .join(' · ')}`
                      : '') +
                    '.',
                  fontSize: 7.5,
                  color: C.muted,
                  margin: [0, 2, 0, 0],
                },
                ...(manual.length
                  ? [
                      {
                        text: `Manual values (GM ruling / override, marked MANUAL): ${manual.join(' · ')}`,
                        fontSize: 7.5,
                        color: C.manual,
                        margin: [0, 2, 0, 0],
                      } as Content,
                    ]
                  : []),
              ],
            },
          ],
        ],
      },
      layout: 'box',
      margin: [0, 0, 0, 4],
    },
  ]

  return {
    pageSize: 'A4',
    pageMargins: [40, 46, 40, 44],
    info: {
      title: `${name} — WFRP 4e character sheet`,
      subject: 'Warhammer Fantasy Roleplay 4th Edition character',
    },
    header: (page) =>
      page === 1
        ? []
        : {
            columns: [
              { text: name, bold: true, fontSize: 8, color: C.accent },
              { text: 'WFRP 4e Character Sheet', fontSize: 8, color: C.muted, alignment: 'right' },
            ],
            margin: [40, 22, 40, 0],
          },
    footer: (page, pages) => ({
      columns: [
        { text: `${name} · exported ${dateText}`, fontSize: 7.5, color: C.muted },
        { text: `Page ${page} of ${pages}`, fontSize: 7.5, color: C.muted, alignment: 'right' },
      ],
      margin: [40, 14, 40, 0],
    }),
    content: [...cover, ...chosen.flatMap((s) => BUILDERS[s.id](c))],
    // Never leave a heading alone at the bottom of a page.
    pageBreakBefore: (node, nodes) => {
      const n = node as {
        headlineLevel?: number
        startPosition: { top: number; pageInnerHeight: number }
      }
      if (n.headlineLevel !== 1) return false
      const after = (nodes as { getFollowingNodesOnPage?: () => unknown[] }).getFollowingNodesOnPage
      if (after && after().length === 0) return true
      return n.startPosition.top > n.startPosition.pageInnerHeight - 70
    },
    defaultStyle: { font: 'Roboto', fontSize: 9, color: C.ink, lineHeight: 1.15 },
    styles: {
      title: { fontSize: 20, bold: true, color: C.accent },
      section: {
        fontSize: 11.5,
        bold: true,
        color: C.accent,
        characterSpacing: 1,
        margin: [0, 0, 0, 2],
      },
      sub: { fontSize: 9.5, bold: true, color: C.ink, margin: [0, 4, 0, 3] },
    },
  }
}

export const TABLE_LAYOUTS = {
  sheet: {
    hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
      i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.4,
    vLineWidth: () => 0,
    hLineColor: (i: number) => (i <= 1 ? C.accent : C.line),
    fillColor: (row: number) => (row > 0 && row % 2 === 0 ? C.zebra : null),
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 2.5,
    paddingBottom: () => 2.5,
  },
  kv: {
    hLineWidth: () => 0.4,
    vLineWidth: () => 0,
    hLineColor: () => C.line,
    paddingLeft: () => 2,
    paddingRight: () => 4,
    paddingTop: () => 2,
    paddingBottom: () => 2,
  },
  box: {
    hLineWidth: () => 0.8,
    vLineWidth: () => 0.8,
    hLineColor: () => C.line,
    vLineColor: () => C.line,
    fillColor: () => C.zebra,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 5,
    paddingBottom: () => 5,
  },
}
