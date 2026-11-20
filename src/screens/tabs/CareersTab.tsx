import { useEffect, useRef, useState } from 'react'
import { applyCareer, statusText, syncCareerMarks } from '../../careers/advance'
import { CAREER_CLASSES } from '../../careers/catalog'
import { parseCareers } from '../../careers/parse'
import { deleteCareerLibrary, getCareerLibrary, saveCareerLibrary } from '../../db/db'
import { nowIso } from '../../domain/factory'
import {
  CHAR_KEYS,
  type CareerData,
  type CareerLevel,
  type CareerLibrary,
} from '../../domain/schema'
import { CHAR_LABELS, CHAR_NAMES } from '../../rules/engine'
import { useChar } from '../../state/store'
import { ConfirmButton, Empty, Panel } from '../../ui/components'
import type { TabKey } from '../tabKeys'

export function CareersTab(props: { goTo: (t: TabKey) => void }) {
  const { c, update } = useChar()
  const [lib, setLib] = useState<CareerLibrary | null | undefined>(undefined)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(c.career.name || null)

  useEffect(() => {
    let alive = true
    void getCareerLibrary().then((l) => alive && setLib(l))
    return () => {
      alive = false
    }
  }, [])

  const byName = new Map((lib?.careers ?? []).map((x) => [x.name, x]))
  const n = q.trim().toLowerCase()

  const choose = (name: string, cls: string, level: number) =>
    update((x) => applyCareer(x, byName.get(name) ?? { name, class: cls }, level))

  return (
    <div className="stack">
      <CurrentCareer goTo={props.goTo} onSchemeSaved={(l) => setLib(l)} lib={lib ?? null} />

      <ImportPanel lib={lib} onChange={setLib} />

      <Panel
        title="All careers"
        hint="Tap a career to see its four levels, then choose the level (Path) your character is on."
      >
        <input
          className="input search"
          type="search"
          placeholder="Find a career or level title…"
          aria-label="Find a career"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="career-classes">
          {CAREER_CLASSES.map((cls) => {
            const list = cls.careers.filter((name) => {
              if (!n) return true
              const d = byName.get(name)
              return (
                name.toLowerCase().includes(n) ||
                cls.name.toLowerCase().includes(n) ||
                !!d?.levels.some((l) => l.title.toLowerCase().includes(n))
              )
            })
            if (list.length === 0) return null
            return (
              <section key={cls.name} className="career-class">
                <h3 className="class-head">{cls.name}</h3>
                <div className="career-list">
                  {list.map((name) => {
                    const d = byName.get(name)
                    const mine = c.career.name === name
                    const isOpen = open === name
                    return (
                      <div key={name} className={`career ${mine ? 'mine' : ''}`}>
                        <button
                          type="button"
                          className="career-head"
                          aria-expanded={isOpen}
                          onClick={() => setOpen(isOpen ? null : name)}
                        >
                          <span className="career-check" aria-hidden>
                            {mine ? '✓' : ''}
                          </span>
                          <b>{name}</b>
                          <span className="hint career-titles">
                            {d ? d.levels.map((l) => l.title).join(' → ') : ''}
                          </span>
                          {mine && c.career.level && (
                            <span className="badge career">Level {c.career.level}</span>
                          )}
                        </button>
                        {isOpen && (
                          <div className="career-body">
                            <div className="level-grid">
                              {[1, 2, 3, 4].map((lvl) => {
                                const l = d?.levels[lvl - 1]
                                const here = mine && c.career.level === lvl
                                return (
                                  <div key={lvl} className={`level ${here ? 'here' : ''}`}>
                                    <button
                                      type="button"
                                      className="level-pick"
                                      aria-pressed={here}
                                      onClick={() => choose(name, cls.name, lvl)}
                                    >
                                      <span className="box" aria-hidden>
                                        {here ? '✓' : ''}
                                      </span>
                                      <span>
                                        <b>
                                          {lvl}. {l?.title ?? `Level ${lvl}`}
                                        </b>
                                        {l && <small>{statusText(l)}</small>}
                                      </span>
                                    </button>
                                    {l ? <LevelDetails l={l} /> : null}
                                  </div>
                                )
                              })}
                            </div>
                            {!d && (
                              <p className="hint">
                                Level titles, status, skills and talents appear after you import
                                your rulebook (above).
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function LevelDetails(props: { l: CareerLevel }) {
  const { l } = props
  return (
    <dl className="level-details">
      <dt>Skills</dt>
      <dd>{l.skills.join(', ') || '—'}</dd>
      <dt>Talents</dt>
      <dd>{l.talents.join(', ') || '—'}</dd>
      <dt>Trappings</dt>
      <dd>{l.trappings.join(', ') || '—'}</dd>
    </dl>
  )
}

function CurrentCareer(props: {
  goTo: (t: TabKey) => void
  lib: CareerLibrary | null
  onSchemeSaved: (l: CareerLibrary) => void
}) {
  const { c, update } = useChar()
  const k = c.career
  if (!k.name)
    return (
      <Panel title="Your career">
        <Empty>No career chosen yet. Pick a career and level (Path) in the list below.</Empty>
      </Panel>
    )
  const setScheme = (key: (typeof CHAR_KEYS)[number], v: number) => {
    update((x) => {
      x.career.scheme[key] = v
      syncCareerMarks(x)
    })
    // Keep the device library in step so other characters get the same scheme.
    if (props.lib) {
      const next: CareerLibrary = {
        ...props.lib,
        careers: props.lib.careers.map((d) =>
          d.name === k.name ? { ...d, scheme: { ...d.scheme, [key]: v } } : d,
        ),
      }
      void saveCareerLibrary(next).then(() => props.onSchemeSaved(next))
    }
  }
  const lv = k.level ? k.levels[k.level - 1] : undefined
  return (
    <Panel
      title="Your career"
      actions={
        <button className="btn small" onClick={() => props.goTo('character')}>
          See what to spend XP on
        </button>
      }
    >
      <div className="current-career">
        <div>
          <div className="cc-name">{k.name}</div>
          <div className="hint">{k.class}</div>
        </div>
        <div className="seg" role="group" aria-label="Career level (Path)">
          {[1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              type="button"
              aria-pressed={k.level === lvl}
              onClick={() =>
                update((x) =>
                  applyCareer(
                    x,
                    { name: k.name, class: k.class, levels: k.levels, scheme: k.scheme, page: 0 },
                    lvl,
                  ),
                )
              }
            >
              {lvl}. {k.levels[lvl - 1]?.title ?? `Level ${lvl}`}
            </button>
          ))}
        </div>
        {lv && <span className="badge career">{statusText(lv)}</span>}
      </div>

      <h3 className="sub-head">Advance Scheme</h3>
      <p className="hint">
        The level at which each Characteristic becomes available (p. 47). Level 1 is read from your
        rulebook; the marks for levels 2–4 are graphics in the PDF, so set those from the book.
      </p>
      <div className="scheme-grid">
        {CHAR_KEYS.map((key) => (
          <label key={key} className="scheme-cell" title={CHAR_NAMES[key]}>
            <span className="lbl">{CHAR_LABELS[key]}</span>
            <select
              className="select"
              value={k.scheme[key]}
              aria-label={`${CHAR_NAMES[key]} becomes available at level`}
              onChange={(e) => setScheme(key, Number(e.target.value))}
            >
              <option value={0}>—</option>
              {[1, 2, 3, 4].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <span className="spacer" />
        <ConfirmButton
          label="Clear career"
          onConfirm={() =>
            update((x) => {
              x.career = {
                name: '',
                class: '',
                level: null,
                levels: [],
                scheme: Object.fromEntries(CHAR_KEYS.map((q) => [q, 0])) as typeof x.career.scheme,
              }
              syncCareerMarks(x)
            })
          }
        />
      </div>
    </Panel>
  )
}

function ImportPanel(props: {
  lib: CareerLibrary | null | undefined
  onChange: (l: CareerLibrary | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string; problems: string[] } | null>(null)

  const onFile = async (file: File) => {
    setMsg(null)
    setBusy('Opening the PDF…')
    try {
      const { readCareerPages } = await import('../../careers/importPdf')
      const pages = await readCareerPages(file, (d, t) => setBusy(`Reading page ${d} of ${t}…`))
      const r = parseCareers(pages)
      if (r.careers.length === 0) {
        setMsg({
          ok: false,
          text: 'No careers were found. Is this the WFRP 4th Edition Core Rulebook PDF?',
          problems: r.problems,
        })
        return
      }
      const lib: CareerLibrary = {
        importedAt: nowIso(),
        source: file.name,
        careers: mergeSchemes(r.careers, props.lib ?? null),
      }
      await saveCareerLibrary(lib)
      props.onChange(lib)
      setMsg({
        ok: r.problems.length === 0,
        text: `Imported ${r.careers.length} careers from ${file.name}.`,
        problems: r.problems,
      })
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

  return (
    <Panel
      title="Career data from your rulebook"
      hint="Career details come from your own copy of the WFRP 4e Core Rulebook. The PDF is read in this browser; nothing is uploaded, and the data is stored only on this device (and in your full backup)."
    >
      {props.lib === undefined ? (
        <div className="hint">Loading…</div>
      ) : props.lib ? (
        <div className="banner ok">
          {props.lib.careers.length} careers imported from <b>{props.lib.source}</b> on{' '}
          {new Date(props.lib.importedAt).toLocaleDateString()}.
        </div>
      ) : (
        <div className="banner info">
          Not imported yet. Choose your Core Rulebook PDF to fill in levels, status, skills, talents
          and trappings. On a tablet you can instead restore a full backup made on a device where
          you imported it.
        </div>
      )}
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn primary" disabled={!!busy} onClick={() => fileRef.current?.click()}>
          {props.lib ? 'Import again from PDF…' : 'Import from my rulebook PDF…'}
        </button>
        {props.lib && (
          <ConfirmButton
            label="Remove career data"
            onConfirm={() => void deleteCareerLibrary().then(() => props.onChange(null))}
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
