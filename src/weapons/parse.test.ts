// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { extractPages, type PdfDoc } from '../careers/importPdf'
import type { PdfPage } from '../careers/parse'
import { parseQualityDescriptions, parseWeaponTables } from './parse'
import { parseQualityText } from './qualities'

const item = (str: string, x: number, y: number) => ({ str, x, y })

describe('weapon parsing', () => {
  it('splits quality text into tags with ratings and keeps unknown text', () => {
    expect(parseQualityText('Shield 2, Defensive, Trap-blade, Odd Thing')).toEqual({
      tags: [
        { name: 'Shield', rating: 2 },
        { name: 'Defensive', rating: null },
        { name: 'Trap Blade', rating: null },
      ],
      rest: 'Odd Thing',
    })
    expect(parseQualityText('–')).toEqual({ tags: [], rest: '' })
  })

  it('reads a synthetic weapons table', () => {
    const page: PdfPage = {
      page: 1,
      width: 600,
      items: [
        item('melee Weapons', 260, 670),
        ...['Weapon', 'Price', 'Enc', 'Availability', 'Reach', 'Damage', 'Qualities and Flaws'].map(
          (s, i) => item(s, [129, 206, 247, 277, 339, 382, 423][i]!, 650),
        ),
        item('TESTGROUP', 300, 633),
        item('(2H)', 101, 621),
        item('Test Blade*', 111, 618),
        item('1GC', 208, 618),
        item('2', 253, 618),
        item('Common', 282, 618),
        item('Long', 340, 618),
        item('+SB+4*', 386, 618),
        item('Impale, Shield 1,', 423, 618),
        item('Slow', 423, 606),
        item('294', 300, 40),
      ],
    }
    const w = parseWeaponTables([page])
    expect(w).toEqual([
      {
        name: 'Test Blade',
        kind: 'melee',
        group: 'Testgroup',
        twoHanded: true,
        price: '1GC',
        enc: '2',
        availability: 'Common',
        reachRange: 'Long',
        damage: '+SB+4',
        qualities: ['Impale', 'Shield 1', 'Slow'],
        footnote: true,
      },
    ])
  })

  it('reads synthetic quality descriptions in column order', () => {
    const page: PdfPage = {
      page: 1,
      width: 600,
      items: [
        item('Weapon Qualities', 50, 600),
        item('Accurate', 50, 580),
        item('First line', 50, 570),
        item('second line.', 50, 560),
        item('Weapon Flaws', 320, 600),
        item('Slow', 320, 580),
        item('Slow text.', 320, 570),
        item('Armour', 320, 400),
        item('Not a quality', 320, 390),
      ],
    }
    expect(parseQualityDescriptions([page])).toEqual([
      { name: 'Accurate', kind: 'quality', description: 'First line second line.' },
      { name: 'Slow', kind: 'flaw', description: 'Slow text.' },
    ])
  })

  // Optional check against the player's own rulebook (never committed):
  //   RULEBOOK_PDF="…/Warhammer_Fantasy_Roleplay_PDF_version4.pdf" npx vitest run src/weapons
  it.skipIf(!process.env.RULEBOOK_PDF)(
    'reads weapons and all 26 qualities/flaws from the real rulebook',
    async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
      const doc = (await pdfjs.getDocument({ url: process.env.RULEBOOK_PDF!, verbosity: 0 })
        .promise) as unknown as PdfDoc
      const pages = await extractPages(doc, 290, 302)
      const weapons = parseWeaponTables(pages)
      const qualities = parseQualityDescriptions(pages)
      if (process.env.WEAPONS_OUT)
        (await import('node:fs')).writeFileSync(
          process.env.WEAPONS_OUT,
          JSON.stringify({ weapons, qualities }, null, 1),
        )
      expect(qualities).toHaveLength(26)
      for (const q of qualities) expect(q.description.length).toBeGreaterThan(40)
      expect(weapons.filter((w) => w.kind === 'melee').length).toBeGreaterThan(20)
      expect(weapons.filter((w) => w.kind === 'ranged').length).toBeGreaterThan(20)
      expect(weapons.filter((w) => w.damage === '').length).toBeLessThanOrEqual(2)
      const foil = weapons.find((w) => w.name === 'Foil')
      expect(foil?.qualities.length).toBeGreaterThan(1)
    },
    300_000,
  )
})
