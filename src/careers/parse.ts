import { CHAR_KEYS, type CareerData, type CareerLevel, type CharKey } from '../domain/schema'
import { ALL_CAREERS } from './catalog'

/**
 * Pure parser for the career pages of the player's own Core Rulebook PDF.
 * Input is the positioned text of each page (as pdf.js extracts it); output
 * is structured career data. Nothing here contains rulebook content.
 *
 * Layout facts used (Chapter 3, one career per page):
 * - "<Name> Advance Scheme" heading, then a row of the ten Characteristic
 *   labels (WS … Fel) and, below it, a text glyph under each Characteristic
 *   available at level 1. Marks for levels 2–4 are graphics and cannot be read.
 * - "Career Path", then four "<Title> — <Tier> <Standing>" lines, each
 *   followed by "Skills:", "Talents:" and "Trappings:" lists that may wrap.
 */
/** One positioned text run; width (in PDF units) when the extractor knows it. */
export type PdfTextItem = { str: string; x: number; y: number; w?: number }
export type PdfPage = { page: number; width: number; items: PdfTextItem[] }

export type { CareerData } from '../domain/schema'
type CareerLevelData = CareerLevel

export type Line = { y: number; x: number; text: string }

const TITLE_RE = /^(?:h\s+)?(.+?)\s*[—–]+\s*(Brass|Silver|Gold)\s+(\d+)\s*$/
const FIELD_RE = /^(Skills|Talents|Trappings):\s*(.*)$/

export function lines(items: PdfTextItem[]): Line[] {
  const sorted = [...items]
    .filter((i) => i.str.trim() !== '')
    .sort((a, b) => b.y - a.y || a.x - b.x)
  const out: { y: number; items: PdfTextItem[] }[] = []
  for (const it of sorted) {
    const last = out[out.length - 1]
    if (last && Math.abs(last.y - it.y) <= 2.5) last.items.push(it)
    else out.push({ y: it.y, items: [it] })
  }
  return out.map((l) => {
    const its = l.items.sort((a, b) => a.x - b.x)
    let text = ''
    let prevEnd = -Infinity
    for (const i of its) {
      // Use the real run width when known (inline bold words sit right after a
      // space-less run); otherwise estimate. Small-caps fragments have no gap.
      const gap = i.x - prevEnd
      const needsSpace =
        text !== '' &&
        !/s$/.test(text) &&
        !/^[s,.;:)]/.test(i.str) &&
        gap > (i.w !== undefined ? 0.8 : 3)
      text += needsSpace ? ' ' + i.str : i.str
      prevEnd = i.x + (i.w ?? i.str.length * 4.2)
    }
    return { y: l.y, x: its[0]!.x, text: text.replace(/\s+/g, ' ').trim() }
  })
}

/** Splits "A, B (C, D), E" at top-level commas only. */
export function splitList(s: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth += 1
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((x) => x.replace(/\s+/g, ' ').replace(/\.$/, '').trim()).filter(Boolean)
}

export function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

/** Characteristic marks for level 1, from glyph positions under the header row. */
function levelOneScheme(items: PdfTextItem[], left: boolean, mid: number): Record<CharKey, number> {
  const scheme = Object.fromEntries(CHAR_KEYS.map((k) => [k, 0])) as Record<CharKey, number>
  const inCol = (i: PdfTextItem) => (left ? i.x < mid : i.x >= mid)
  const ws = items.find((i) => i.str.trim() === 'WS' && inCol(i))
  if (!ws) return scheme
  const header = items
    .filter((i) => inCol(i) && i.str.trim() !== '' && Math.abs(i.y - ws.y) <= 2 && i.x >= ws.x - 1)
    .sort((a, b) => a.x - b.x)
  // Merge fragments ("d" + "ex", "i" + "nt") into the ten labels.
  const cols: number[] = []
  let lastX = -Infinity
  for (const h of header) {
    if (h.x - lastX >= 9) cols.push(h.x)
    lastX = h.x
  }
  if (cols.length !== 10) return scheme
  const marks = items.filter(
    (i) => inCol(i) && i.str.trim() === 'h' && ws.y - i.y > 4 && ws.y - i.y < 30,
  )
  for (const m of marks) {
    let best = 0
    for (let c = 1; c < 10; c++)
      if (Math.abs(cols[c]! - m.x) < Math.abs(cols[best]! - m.x)) best = c
    scheme[CHAR_KEYS[best]!] = 1
  }
  return scheme
}

function parseCareerPage(p: PdfPage, name: string, cls: string): CareerData | null {
  const mid = p.width / 2
  const pathLine = lines(p.items).find((l) => norm(l.text) === 'careerpath')
  if (!pathLine) return null
  const left = pathLine.x < mid
  const colItems = p.items.filter((i) => (left ? i.x < mid : i.x >= mid))
  const col = lines(colItems)
  const start = col.findIndex((l) => norm(l.text) === 'careerpath')
  if (start < 0) return null
  const levels: CareerLevelData[] = []
  let field: 'skills' | 'talents' | 'trappings' | null = null
  const buf: Record<string, string> = {}
  const flush = () => {
    const lv = levels[levels.length - 1]
    if (lv && field) lv[field] = splitList(buf[field] ?? '')
  }
  for (const l of col.slice(start + 1)) {
    if (/^\d+$/.test(l.text) || l.y < 40) break
    const t = TITLE_RE.exec(l.text)
    if (t) {
      flush()
      if (levels.length === 4) break
      levels.push({
        title: t[1]!.trim(),
        statusTier: t[2]!.toLowerCase() as CareerLevelData['statusTier'],
        statusStanding: Number(t[3]),
        skills: [],
        talents: [],
        trappings: [],
      })
      field = null
      for (const k of Object.keys(buf)) delete buf[k]
      continue
    }
    if (levels.length === 0) continue
    const f = FIELD_RE.exec(l.text)
    if (f) {
      flush()
      field = f[1]!.toLowerCase() as 'skills' | 'talents' | 'trappings'
      buf[field] = f[2]!
      continue
    }
    if (field) {
      const prev = buf[field] ?? ''
      buf[field] = prev.endsWith('-') ? prev + l.text : `${prev} ${l.text}`
    }
  }
  flush()
  if (levels.length !== 4) return null
  return { name, class: cls, page: p.page, levels, scheme: levelOneScheme(p.items, left, mid) }
}

/**
 * Finds the career pages (the pages with a "Career Path" block) and assigns
 * them, in order, to the known career names. A page heading that does not
 * contain the expected name is reported instead of being guessed.
 */
export function parseCareers(pages: PdfPage[]): { careers: CareerData[]; problems: string[] } {
  const careers: CareerData[] = []
  const problems: string[] = []
  const careerPages = pages.filter((p) => {
    const ls = lines(p.items)
    return (
      ls.some((l) => norm(l.text) === 'careerpath') &&
      ls.some((l) => TITLE_RE.test(l.text)) &&
      ls.some((l) => /advancescheme$/.test(norm(l.text)))
    )
  })
  careerPages.forEach((p, i) => {
    const expected = ALL_CAREERS[i]
    if (!expected) return
    const heading = lines(p.items).find((l) => /advancescheme$/.test(norm(l.text)))
    if (heading && !norm(heading.text).includes(norm(expected.name))) {
      problems.push(`Page ${p.page}: expected ${expected.name}, found “${heading.text}”.`)
      return
    }
    const c = parseCareerPage(p, expected.name, expected.class)
    if (c) careers.push(c)
    else problems.push(`Page ${p.page}: could not read the Career Path for ${expected.name}.`)
  })
  if (careerPages.length < ALL_CAREERS.length)
    problems.push(`Found ${careerPages.length} career pages; expected ${ALL_CAREERS.length}.`)
  return { careers, problems }
}
