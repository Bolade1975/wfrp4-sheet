import { useState } from 'react'
import { displayName } from '../../domain/factory'
import { exportCharacter, safeFilename } from '../../domain/transfer'
import { DEFAULT_SECTIONS, PDF_SECTIONS, type SectionId } from '../../pdf/buildDoc'
import { useChar } from '../../state/store'
import { Panel } from '../../ui/components'
import { downloadBlob, downloadJson } from '../../ui/download'
import { Check } from '../../ui/fields'
import { todayIso } from '../../ui/format'

const PRESETS: { label: string; sections: SectionId[] }[] = [
  { label: 'Full sheet', sections: DEFAULT_SECTIONS },
  {
    label: 'Play summary',
    sections: ['character', 'characteristics', 'skills', 'talents', 'combat', 'loadout', 'magic'],
  },
  { label: 'Inventory only', sections: ['inventory'] },
  { label: 'Loadout only', sections: ['loadout', 'combat'] },
]

export function ExportTab() {
  const { c } = useChar()
  const [sections, setSections] = useState<SectionId[]>(DEFAULT_SECTIONS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const base = `${safeFilename(displayName(c))}-${todayIso()}`

  const toggle = (id: SectionId, on: boolean) =>
    setSections((s) =>
      on
        ? PDF_SECTIONS.map((x) => x.id).filter((x) => x === id || s.includes(x))
        : s.filter((x) => x !== id),
    )

  const exportPdf = async () => {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const { renderPdf } = await import('../../pdf/exportPdf')
      const blob = await renderPdf(c, { sections, exportDate: new Date() })
      const name = `${base}-wfrp4.pdf`
      downloadBlob(name, blob)
      setDone(
        `Saved ${name} (${Math.round(blob.size / 1024)} KB). Send it to your GM yourself — the app never sends anything.`,
      )
    } catch (e) {
      setError(`PDF export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid two">
      <Panel
        title="PDF for the GM"
        hint="A light, print-friendly A4 document generated on this device (works offline)."
      >
        <div className="stack">
          <div className="chip-row">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={`chip ${p.sections.length === sections.length && p.sections.every((s) => sections.includes(s)) ? 'on' : ''}`}
                onClick={() => setSections(p.sections)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <fieldset className="section-pick">
            <legend>Sections to include</legend>
            {PDF_SECTIONS.map((s) => (
              <Check
                key={s.id}
                label={s.title}
                checked={sections.includes(s.id)}
                onChange={(v) => toggle(s.id, v)}
              />
            ))}
          </fieldset>
          <div className="banner info">
            The <b>Notes</b> tab is never exported. Notes written on skills, talents and items are
            included with those sections.
          </div>
          <div>
            <button
              className="btn primary"
              disabled={busy || sections.length === 0}
              onClick={() => void exportPdf()}
            >
              {busy ? 'Generating…' : 'Export PDF'}
            </button>
          </div>
          {error && <div className="banner">{error}</div>}
          {done && <div className="banner ok">{done}</div>}
        </div>
      </Panel>

      <div className="stack">
        <Panel title="The PDF will contain">
          {sections.length === 0 ? (
            <p className="hint">Nothing selected.</p>
          ) : (
            <ol className="included">
              {PDF_SECTIONS.filter((s) => sections.includes(s.id)).map((s) => (
                <li key={s.id}>{s.title}</li>
              ))}
            </ol>
          )}
          <p className="hint">
            Page 1 lists the included sections and any manual values. Every page shows the character
            name, export date and “Page X of Y”.
          </p>
        </Panel>
        <Panel
          title="JSON (your own backup)"
          hint="For moving between devices or backup — not for the GM."
        >
          <button
            className="btn"
            onClick={() => downloadJson(`${base}.wfrp4.json`, exportCharacter(c))}
          >
            Download character JSON
          </button>
        </Panel>
      </div>
    </div>
  )
}
