// @vitest-environment node
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { exampleCharacter } from '../domain/example'
import { makeSkill, newCharacter, newId } from '../domain/factory'
import type { Character } from '../domain/schema'
import { SKILL_CATALOG } from '../rules/catalog'
import {
  buildPdfDoc,
  DEFAULT_SECTIONS,
  PDF_SECTIONS,
  TABLE_LAYOUTS,
  type PdfOptions,
} from './buildDoc'

const require = createRequire(import.meta.url)

const FULL: PdfOptions = { sections: DEFAULT_SECTIONS, exportDate: new Date('2026-11-20') }
const SECRET = 'SECRET-NOTE-TEXT-should-never-appear'

/** Long lists and long text to stress page breaks and wrapping. */
function stressCharacter(): Character {
  const c = exampleCharacter()
  c.identity.name = 'Wilhelmina Augusta von Unterbrücken-Hochstetter the Younger'
  for (const cat of SKILL_CATALOG)
    for (const spec of cat.grouped ? ['Specialisation with a rather long name', 'Short'] : [''])
      c.skills.push(
        makeSkill(cat.name, spec, {
          advances: (cat.name.length % 7) + 1,
          notes:
            cat.name.length > 10
              ? 'A long note on this skill that must wrap onto a second line without being cut off at the edge of its column.'
              : '',
        }),
      )
  for (let i = 0; i < 18; i++)
    c.talents.push({
      id: newId(),
      name: `Talent ${i} with a long name`,
      timesTaken: 1 + (i % 3),
      max: 'Toughness Bonus',
      tests: 'Any Test related to this',
      description: 'Description text '.repeat(12),
      notes: '',
    })
  for (let i = 0; i < 30; i++)
    c.trappings.push({
      id: newId(),
      name: `Trapping ${i}: ${'very '.repeat(i % 5)}long item name`,
      quantity: i,
      enc: i % 3,
      location: 'Backpack',
      current: i % 2 === 0,
      notes: i % 4 === 0 ? 'Some notes '.repeat(6) : '',
      category: 'equipment',
    })
  for (let i = 0; i < 40; i++)
    c.xp.log.push({
      id: newId(),
      kind: i % 5 === 0 ? 'earned' : 'spent',
      date: '2026-01-01',
      session: `Session ${i}`,
      category: 'skill',
      name: `Advance ${i}`,
      before: String(i),
      after: String(i + 1),
      amount: 10 + i,
      notes: 'Note '.repeat(i % 8),
    })
  for (let i = 0; i < 6; i++)
    c.spells.push({
      id: newId(),
      kind: 'spell',
      name: `Spell ${i}`,
      lore: 'Lore of Light',
      tn: '7',
      range: 'Willpower yards',
      target: '1',
      duration: 'Willpower Bonus Rounds',
      effect: 'Effect text '.repeat(15),
      notes: '',
    })
  c.notes.push({ id: newId(), category: 'note', title: SECRET, body: SECRET, date: '' })
  c.overrides['wounds.max'] = 17
  return c
}

async function render(c: Character, o: PdfOptions): Promise<Buffer> {
  const pdfmake = require('pdfmake') as {
    addFonts: (f: unknown) => void
    addTableLayouts: (l: unknown) => void
    setUrlAccessPolicy: (cb: (url: string) => boolean) => void
    createPdf: (d: unknown) => { getBuffer: () => Promise<Buffer> }
  }
  const dir = require
    .resolve('pdfmake/build/fonts/Roboto/Roboto-Regular.ttf')
    .replace(/Roboto-Regular\.ttf$/, '')
  pdfmake.addFonts({
    Roboto: {
      normal: `${dir}Roboto-Regular.ttf`,
      bold: `${dir}Roboto-Medium.ttf`,
      italics: `${dir}Roboto-Italic.ttf`,
      bolditalics: `${dir}Roboto-MediumItalic.ttf`,
    },
  })
  pdfmake.setUrlAccessPolicy(() => false)
  pdfmake.addTableLayouts(TABLE_LAYOUTS)
  return pdfmake.createPdf(buildPdfDoc(c, o)).getBuffer()
}

const pageCount = (buf: Buffer) => (buf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length
const docText = (c: Character, o: PdfOptions) => JSON.stringify(buildPdfDoc(c, o).content)

describe('PDF document', () => {
  it('never contains the Notes tab', () => {
    const text = docText(stressCharacter(), FULL)
    expect(text).not.toContain(SECRET)
    expect(text).toContain('Notes tab (never exported)')
  })

  it('contains every selected section and lists them on page 1', () => {
    const text = docText(exampleCharacter(), FULL)
    for (const h of [
      'CHARACTER',
      'CHARACTERISTICS',
      'SKILLS',
      'TALENTS',
      'COMBAT',
      'CURRENT LOADOUT',
      'INVENTORY',
      'SPELLS AND PRAYERS',
      'CORRUPTION & MUTATIONS',
      'EXPERIENCE',
      'QUICK TESTS',
    ])
      expect(text).toContain(`"${h}"`)
    for (const s of PDF_SECTIONS) expect(text).toContain(s.title)
  })

  it('leaves out unselected sections and says so', () => {
    const o: PdfOptions = { ...FULL, sections: ['skills'] }
    const text = docText(exampleCharacter(), o)
    expect(text).toContain('"SKILLS"')
    expect(text).not.toContain('"CURRENT LOADOUT"')
    expect(text).toMatch(/Not included:.*Current Loadout/)
  })

  it('shows Career and Race skill marks and the wealth notes', () => {
    const text = docText(exampleCharacter(), FULL)
    expect(text).toContain('"Career"')
    expect(text).toContain('"Race"')
    expect(text).toContain('Owes Rudi 2 SS')
  })

  it('marks manual values', () => {
    expect(docText(stressCharacter(), FULL)).toContain('Manual values')
  })

  it('renders valid multi-page PDFs (example, stress, blank)', async () => {
    const stress = await render(stressCharacter(), FULL)
    expect(stress.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pageCount(stress)).toBeGreaterThan(4)
    const blank = await render(newCharacter('Blank Character'), FULL)
    expect(pageCount(blank)).toBeGreaterThan(0)
    const example = await render(exampleCharacter(), FULL)
    if (process.env.PDF_OUT) {
      writeFileSync(`${process.env.PDF_OUT}/stress-full.pdf`, stress)
      writeFileSync(`${process.env.PDF_OUT}/blank-full.pdf`, blank)
      writeFileSync(`${process.env.PDF_OUT}/example-full.pdf`, example)
      writeFileSync(
        `${process.env.PDF_OUT}/example-loadout.pdf`,
        await render(exampleCharacter(), { ...FULL, sections: ['loadout', 'combat'] }),
      )
    }
  }, 60_000)
})
