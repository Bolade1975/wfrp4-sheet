import { useRef, useState } from 'react'
import { parseCareers } from '../careers/parse'
import {
  deleteCareerLibrary,
  deleteWeaponLibrary,
  saveCareerLibrary,
  saveWeaponLibrary,
} from '../db/db'
import { nowIso } from '../domain/factory'
import {
  CHAR_KEYS,
  type CareerData,
  type CareerLibrary,
  type WeaponLibrary,
} from '../domain/schema'
import { ConfirmButton, Panel } from '../ui/components'
import { parseQualityDescriptions, parseWeaponTables } from '../weapons/parse'

/**
 * One import of the player's own Core Rulebook PDF: careers (Chapter 3),
 * weapon tables and Weapon Qualities/Flaws (Chapter 11). The PDF is read in
 * the browser; results are stored only on this device and in full backups.
 */
export function RulebookImport(props: {
  focus: 'careers' | 'weapons'
  careers: CareerLibrary | null | undefined
  weapons: WeaponLibrary | null | undefined
  onCareers: (l: CareerLibrary | null) => void
  onWeapons: (l: WeaponLibrary | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string; problems: string[] } | null>(null)

  const onFile = async (file: File) => {
    setMsg(null)
    setBusy('Opening the PDF…')
    try {
      const { readRulebookPages } = await import('../careers/importPdf')
      const pages = await readRulebookPages(file, (d, t) => setBusy(`Reading page ${d} of ${t}…`))
      setBusy('Reading careers and weapons…')
      const c = parseCareers(pages)
      const weapons = parseWeaponTables(pages)
      const qualities = parseQualityDescriptions(pages)
      const problems = [...c.problems]
      const done: string[] = []
      if (c.careers.length > 0) {
        const lib: CareerLibrary = {
          importedAt: nowIso(),
          source: file.name,
          careers: mergeSchemes(c.careers, props.careers ?? null),
        }
        await saveCareerLibrary(lib)
        props.onCareers(lib)
        done.push(`${c.careers.length} careers`)
      }
      if (weapons.length > 0 || qualities.length > 0) {
        const lib: WeaponLibrary = { importedAt: nowIso(), source: file.name, weapons, qualities }
        await saveWeaponLibrary(lib)
        props.onWeapons(lib)
        done.push(`${weapons.length} weapons`, `${qualities.length} quality and flaw descriptions`)
      }
      if (weapons.length === 0) problems.push('No weapon tables were found.')
      if (qualities.length < 26)
        problems.push(`Found ${qualities.length} of 26 quality/flaw descriptions.`)
      setMsg(
        done.length === 0
          ? {
              ok: false,
              text: 'Nothing was found. Is this the WFRP 4th Edition Core Rulebook PDF?',
              problems,
            }
          : {
              ok: problems.length === 0,
              text: `Imported ${done.join(', ')} from ${file.name}.`,
              problems,
            },
      )
    } catch (e) {
      setMsg({
        ok: false,
        text: `Import failed: ${e instanceof Error ? e.message : String(e)}`,
        problems: [],
      })
    } finally {
      setBusy(null)
    }
  }

  const status: string[] = []
  if (props.careers) status.push(`${props.careers.careers.length} careers`)
  if (props.weapons)
    status.push(
      `${props.weapons.weapons.length} weapons`,
      `${props.weapons.qualities.length} quality descriptions`,
    )
  const lib = props.careers ?? props.weapons
  const loading = props.careers === undefined || props.weapons === undefined
  const missingFocus = props.focus === 'careers' ? !props.careers : !props.weapons

  return (
    <Panel
      title="Data from your rulebook"
      hint="Career details, weapons and quality descriptions come from your own copy of the WFRP 4e Core Rulebook. The PDF is read in this browser; nothing is uploaded, and the data is stored only on this device (and in your full backup)."
    >
      {loading ? (
        <div className="hint">Loading…</div>
      ) : lib && status.length ? (
        <div className={`banner ${missingFocus ? 'warn' : 'ok'}`}>
          Imported from <b>{lib.source}</b> on {new Date(lib.importedAt).toLocaleDateString()}:{' '}
          {status.join(', ')}.
          {missingFocus && ` No ${props.focus} yet — import the PDF again to add them.`}
        </div>
      ) : (
        <div className="banner info">
          Not imported yet. Choose your Core Rulebook PDF to fill in careers, weapons and quality
          descriptions. On a tablet you can instead restore a full backup made on a device where you
          imported it.
        </div>
      )}
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn primary" disabled={!!busy} onClick={() => fileRef.current?.click()}>
          {lib ? 'Import again from PDF…' : 'Import from my rulebook PDF…'}
        </button>
        {(props.careers || props.weapons) && (
          <ConfirmButton
            label="Remove rulebook data"
            onConfirm={() =>
              void Promise.all([deleteCareerLibrary(), deleteWeaponLibrary()]).then(() => {
                props.onCareers(null)
                props.onWeapons(null)
              })
            }
          />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void onFile(f)
          }}
        />
      </div>
      {busy && <p className="hint">{busy}</p>}
      {msg && (
        <div className={`banner ${msg.ok ? 'ok' : 'warn'}`} style={{ marginTop: 10 }}>
          {msg.text}
          {msg.problems.length > 0 && (
            <ul>
              {msg.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  )
}

/** Keeps advance-scheme levels 2–4 the player already set when re-importing. */
function mergeSchemes(next: CareerData[], prev: CareerLibrary | null): CareerData[] {
  if (!prev) return next
  return next.map((d) => {
    const old = prev.careers.find((o) => o.name === d.name)
    if (!old) return d
    const scheme = { ...d.scheme }
    for (const k of CHAR_KEYS) if (old.scheme[k] > 1 && scheme[k] === 0) scheme[k] = old.scheme[k]
    return { ...d, scheme }
  })
}
