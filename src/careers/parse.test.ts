// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { splitList, parseCareers, type PdfPage } from './parse'
import { extractPages, type PdfDoc } from './importPdf'

describe('career parser', () => {
  it('splits lists only at top-level commas', () => {
    expect(splitList('Lore (Local, Politics), Heal, Trade (Any).')).toEqual([
      'Lore (Local, Politics)',
      'Heal',
      'Trade (Any)',
    ])
  })

  it('reads a synthetic career page', () => {
    const it = (str: string, x: number, y: number) => ({ str, x, y })
    const page: PdfPage = {
      page: 53,
      width: 600,
      items: [
        it('Apothecary Advance Scheme', 65, 450),
        ...['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'].map((s, i) =>
          it(s, 65 + i * 22, 437),
        ),
        it('h', 65 + 3 * 22, 422),
        it('Career Path', 65, 387),
        ...[1, 2, 3, 4].flatMap((n) => [
          it(`Title ${n} — Silver ${n}`, 75, 380 - n * 70),
          it('Skills:', 65, 370 - n * 70),
          it('Heal, Lore (A, B),', 92, 370 - n * 70),
          it('Trade (X)', 65, 360 - n * 70),
          it('Talents:', 65, 350 - n * 70),
          it('Savvy', 100, 350 - n * 70),
          it('Trappings:', 65, 340 - n * 70),
          it('Book', 110, 340 - n * 70),
        ]),
      ],
    }
    const r = parseCareers([page])
    expect(r.careers).toHaveLength(1)
    const c = r.careers[0]!
    expect(c.name).toBe('Apothecary')
    expect(c.levels[0]).toEqual({
      title: 'Title 1',
      statusTier: 'silver',
      statusStanding: 1,
      skills: ['Heal', 'Lore (A, B)', 'Trade (X)'],
      talents: ['Savvy'],
      trappings: ['Book'],
    })
    expect(c.scheme.t).toBe(1)
    expect(c.scheme.ws).toBe(0)
  })

  // Optional check against the player's own rulebook (never committed):
  //   RULEBOOK_PDF="U:/…/Warhammer_Fantasy_Roleplay_PDF_version4.pdf" npx vitest run src/careers
  it.skipIf(!process.env.RULEBOOK_PDF)(
    'reads all 64 careers from the real rulebook',
    async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
      const doc = (await pdfjs.getDocument({ url: process.env.RULEBOOK_PDF!, verbosity: 0 })
        .promise) as unknown as PdfDoc
      const pages = await extractPages(doc, 40, 130)
      const r = parseCareers(pages)
      if (r.problems.length) console.log(r.problems)
      expect(r.careers).toHaveLength(64)
      for (const c of r.careers) {
        expect(c.levels).toHaveLength(4)
        if (Object.values(c.scheme).filter((v) => v === 1).length !== 3)
          console.log('scheme', c.name, c.scheme)
        for (const l of c.levels) expect(l.skills.length + l.talents.length).toBeGreaterThan(0)
      }
      if (process.env.CAREERS_OUT)
        (await import('node:fs')).writeFileSync(process.env.CAREERS_OUT, JSON.stringify(r, null, 1))
    },
    300_000,
  )
})
