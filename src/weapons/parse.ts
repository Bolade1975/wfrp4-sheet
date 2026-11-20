import { lines, norm, splitList, type PdfPage, type PdfTextItem } from '../careers/parse'
import type { QualityRef, WeaponRef } from '../domain/schema'
import { WEAPON_QUALITIES } from './qualities'

/**
 * Pure parsers for the weapon tables (p. 294–295) and the Weapon Qualities and
 * Flaws descriptions (p. 297–299) of the player's own Core Rulebook PDF.
 * Nothing here contains rulebook content.
 */

type Col = 'name' | 'price' | 'enc' | 'availability' | 'reach' | 'damage' | 'qualities'

const HEADER: [Col, RegExp][] = [
  ['name', /^Weapon$/],
  ['price', /^Price$/],
  ['enc', /^Enc$/],
  ['availability', /^Availability$/],
  ['reach', /^(Reach|Range)$/],
  ['damage', /^Damage$/],
  ['qualities', /^Qualities/],
]

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
}

function tableKind(items: PdfTextItem[], headerY: number): 'melee' | 'ranged' | null {
  const above = lines(items.filter((i) => i.y > headerY && i.y < headerY + 40))
  for (const l of above) {
    const n = norm(l.text)
    if (n.includes('meleeweapons')) return 'melee'
    if (n.includes('rangedweapons')) return 'ranged'
  }
  return null
}

/** Reads the Melee Weapons and Ranged Weapons tables (the Ammunition table is skipped). */
export function parseWeaponTables(pages: PdfPage[]): WeaponRef[] {
  const out: WeaponRef[] = []
  for (const p of pages) {
    const weaponHeads = p.items.filter((i) => i.str.trim() === 'Weapon')
    for (const head of weaponHeads) {
      const row = p.items.filter((i) => Math.abs(i.y - head.y) <= 2 && i.str.trim())
      const cols: { col: Col; x: number }[] = []
      for (const [col, re] of HEADER) {
        const it = row.find((i) => re.test(i.str.trim()))
        if (it) cols.push({ col, x: it.x })
      }
      if (cols.length !== HEADER.length) continue
      const kind = tableKind(p.items, head.y)
      if (!kind) continue
      const nearest = (x: number): Col =>
        cols.reduce((best, c) => (Math.abs(c.x - x) < Math.abs(best.x - x) ? c : best)).col
      // Rows below the header; merge items within 4pt ("(2H)" sits a little higher).
      const below = p.items
        .filter((i) => i.y < head.y - 2 && i.str.trim())
        .sort((a, b) => b.y - a.y || a.x - b.x)
      const rows: PdfTextItem[][] = []
      for (const it of below) {
        const last = rows[rows.length - 1]
        if (last && Math.abs(last[0]!.y - it.y) <= 4) last.push(it)
        else rows.push([it])
      }
      let group = ''
      // Rows in table order; wrapped quality lines are attached afterwards to the
      // nearest weapon row of the same group (names sit vertically centred).
      type Entry = { y: number; group: string; weapon?: WeaponRef; wrap?: string[] }
      const entries: Entry[] = []
      for (const r of rows) {
        const text = r
          .map((i) => i.str.trim())
          .join(' ')
          .trim()
        if (/^\*/.test(text) || /^\d+$/.test(text)) break // footnotes / page number
        if (r.length === 1 && /^[A-Z][A-Z\s*-]+$/.test(text)) {
          group = titleCase(text.replace(/\*/g, '').trim())
          continue
        }
        const cells: Partial<Record<Col, string>> = {}
        for (const it of r.sort((a, b) => a.x - b.x)) {
          const c = nearest(it.x)
          cells[c] = cells[c] ? `${cells[c]} ${it.str.trim()}` : it.str.trim()
        }
        const y = r[0]!.y
        if (!cells.name) {
          if (cells.qualities) entries.push({ y, group, wrap: splitList(cells.qualities) })
          continue
        }
        let name = cells.name.replace(/\s+/g, ' ').trim()
        const twoHanded = /\(2H\)/.test(name)
        name = name.replace(/\(2H\)\s*/, '')
        const footnote = /\*/.test(name)
        name = name.replace(/\*/g, '').trim()
        const dash = (s?: string) => (!s || /^[–-]$/.test(s.trim()) ? '' : s.trim())
        entries.push({
          y,
          group,
          weapon: {
            name,
            kind,
            group,
            twoHanded,
            price: dash(cells.price),
            enc: dash(cells.enc),
            availability: dash(cells.availability),
            reachRange: dash(cells.reach),
            damage: dash(cells.damage).replace(/\*+$/, ''),
            qualities: splitList(dash(cells.qualities)),
            footnote,
          },
        })
      }
      entries.forEach((e, i) => {
        if (!e.wrap) return
        let prev: Entry | undefined
        for (let j = i - 1; j >= 0 && !prev; j--) if (entries[j]!.weapon) prev = entries[j]
        let next: Entry | undefined
        for (let j = i + 1; j < entries.length && !next; j++)
          if (entries[j]!.weapon) next = entries[j]
        if (prev && prev.group !== e.group) prev = undefined
        if (next && next.group !== e.group) next = undefined
        const toNext = next && (!prev || Math.abs(next.y - e.y) < Math.abs(prev.y - e.y))
        if (toNext) next!.weapon!.qualities = [...e.wrap, ...next!.weapon!.qualities]
        else if (prev) prev.weapon!.qualities = [...prev.weapon!.qualities, ...e.wrap]
      })
      for (const e of entries) if (e.weapon) out.push(e.weapon)
    }
  }
  return out
}

/** Reads the descriptions under "Weapon Qualities" and "Weapon Flaws". */
export function parseQualityDescriptions(pages: PdfPage[]): QualityRef[] {
  const names = new Map(WEAPON_QUALITIES.map((q) => [norm(q.name), q]))
  const out: QualityRef[] = []
  let started = false
  let current: QualityRef | null = null
  const finish = () => {
    if (current) {
      current.description = current.description.replace(/\s+/g, ' ').trim()
      out.push(current)
    }
    current = null
  }
  for (const p of pages) {
    const split = rightColumnStart(p)
    const stream = [
      ...lines(p.items.filter((i) => i.x < split)),
      ...lines(p.items.filter((i) => i.x >= split)),
    ]
    if (!started && !stream.some((l) => norm(l.text) === 'weaponqualities')) continue
    for (const l of stream) {
      const n = norm(l.text)
      if (!started) {
        if (n === 'weaponqualities') started = true
        continue
      }
      if (n === 'armour') {
        finish()
        return out
      }
      if (n === 'weaponflaws') {
        finish()
        continue
      }
      // Running heads, page numbers and chapter tabs.
      if (/^\d+$/.test(l.text) || l.y > 715 || l.y < 35) continue
      const heading = names.get(norm(l.text.replace(/\(\s*Rating\s*\)/i, '')))
      if (heading && l.text.length <= heading.name.length + 9) {
        finish()
        current = { name: heading.name, kind: heading.kind, description: '' }
        continue
      }
      if (current) {
        const d = current.description
        current.description = d.endsWith('-') ? d + l.text : `${d} ${l.text}`
      }
    }
  }
  finish()
  return out
}

/**
 * x where the right text column starts: the most common item start in the
 * right half (the gutter can sit left of the page's midline).
 */
function rightColumnStart(p: PdfPage): number {
  const counts = new Map<number, number>()
  for (const i of p.items) {
    if (!i.str.trim() || i.x < p.width * 0.4 || i.x > p.width * 0.65) continue
    const x = Math.round(i.x)
    counts.set(x, (counts.get(x) ?? 0) + 1)
  }
  let best = p.width / 2
  let n = 0
  for (const [x, c] of counts) if (c > n) [best, n] = [x, c]
  return best - 3
}
