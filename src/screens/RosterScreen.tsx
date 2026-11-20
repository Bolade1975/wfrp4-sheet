import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteCharacter,
  listCharacters,
  saveCharacter,
  saveMany,
  type LoadedCharacter,
} from '../db/db'
import { exampleCharacter } from '../domain/example'
import {
  careerLine,
  displayName,
  duplicateCharacter,
  newCharacter,
  nowIso,
  speciesLabel,
  statusLabel,
} from '../domain/factory'
import type { Character } from '../domain/schema'
import {
  exportBackup,
  exportCharacter,
  parseImport,
  planImport,
  resolveImport,
  safeFilename,
  type ImportChoice,
  type ImportPlanItem,
} from '../domain/transfer'
import { ConfirmButton, Panel, Sheet } from '../ui/components'
import { downloadJson } from '../ui/download'
import { TextField } from '../ui/fields'
import { todayIso } from '../ui/format'

export function RosterScreen(props: { open: (id: string) => void }) {
  const [rows, setRows] = useState<LoadedCharacter[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [plan, setPlan] = useState<{ items: ImportPlanItem[]; warnings: string[] } | null>(null)
  const [renaming, setRenaming] = useState<Character | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(async () => {
    try {
      setRows(await listCharacters())
    } catch (e) {
      setError(`Could not read local storage: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [])

  useEffect(() => {
    // Initial load from IndexedDB (external system) — state is set asynchronously.
    let alive = true
    listCharacters()
      .then((r) => alive && setRows(r))
      .catch(
        (e: unknown) =>
          alive &&
          setError(`Could not read local storage: ${e instanceof Error ? e.message : String(e)}`),
      )
    return () => {
      alive = false
    }
  }, [])

  const chars = (rows ?? []).flatMap((r) => ('character' in r ? [r.character] : []))
  const broken = (rows ?? []).flatMap((r) => ('error' in r ? [r] : []))

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setError(null)
    try {
      await fn()
      if (ok) setMessage(ok)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const onFile = async (file: File) => {
    setError(null)
    setMessage(null)
    const parsed = parseImport(await file.text())
    if (!parsed.ok) {
      setError(`Import rejected: ${parsed.error} Nothing was changed.`)
      return
    }
    setPlan({ items: planImport(parsed.value.characters, chars), warnings: parsed.value.errors })
  }

  return (
    <main>
      {error && <div className="banner">{error}</div>}
      {message && <div className="banner info">{message}</div>}
      <div className="grid wide">
        <Panel
          title="Characters"
          className="span-all"
          actions={
            <div className="row">
              <button
                className="btn primary"
                onClick={() =>
                  void run(async () => {
                    const c = newCharacter()
                    await saveCharacter(c)
                    props.open(c.id)
                  })
                }
              >
                + New character
              </button>
              <button
                className="btn"
                onClick={() =>
                  void run(
                    async () => saveCharacter(exampleCharacter()),
                    'Example character added (clearly marked as EXAMPLE).',
                  )
                }
              >
                + Example character
              </button>
            </div>
          }
        >
          {rows === null && <div className="empty">Loading…</div>}
          {rows !== null && chars.length === 0 && (
            <div className="empty">No characters yet. Create one or import a JSON file.</div>
          )}
          <div className="grid">
            {chars.map((c) => (
              <div className="panel roster-card" key={c.id}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <div className="stack" style={{ flex: 1, gap: 4 }}>
                    <h3 className="roster-name">{displayName(c)}</h3>
                    <div className="hint">
                      {[speciesLabel(c), careerLine(c), statusLabel(c)]
                        .filter(Boolean)
                        .join(' · ') || 'No details yet'}
                    </div>
                    <div className="hint">Updated {new Date(c.updatedAt).toLocaleString()}</div>
                    {c.isExample && <span className="badge example">EXAMPLE DATA</span>}
                  </div>
                </div>
                <div className="row">
                  <button className="btn primary" onClick={() => props.open(c.id)}>
                    Open
                  </button>
                  <button className="btn" onClick={() => setRenaming(c)}>
                    Rename
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      void run(
                        async () => saveCharacter(duplicateCharacter(c)),
                        'Character duplicated.',
                      )
                    }
                  >
                    Duplicate
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      downloadJson(
                        `${safeFilename(displayName(c))}-${todayIso()}.wfrp4.json`,
                        exportCharacter(c),
                      )
                    }
                  >
                    Export JSON
                  </button>
                  <ConfirmButton
                    label="Delete"
                    confirmLabel="Tap again to delete"
                    onConfirm={() =>
                      void run(async () => deleteCharacter(c.id), 'Character deleted.')
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          {broken.length > 0 && (
            <div className="banner warn" style={{ marginTop: 12 }}>
              {broken.length} stored record(s) could not be read and were left untouched:
              <ul>
                {broken.map((b) => (
                  <li key={b.id}>{b.error}</li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel
          title="Backup & transfer"
          hint="JSON files are for your own backups and moving between devices. They stay on this device until you share them; the GM only needs the PDF."
        >
          <div className="row">
            <button
              className="btn"
              disabled={chars.length === 0}
              onClick={() => downloadJson(`wfrp4-backup-${todayIso()}.json`, exportBackup(chars))}
            >
              Download full backup
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              Import / restore…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void onFile(f)
              }}
            />
          </div>
          <p className="hint">
            Import accepts a single-character export or a full backup. Every file is validated
            before anything is written, and you choose per character whether to add a copy or
            replace.
          </p>
        </Panel>
      </div>

      {renaming && (
        <RenameSheet
          c={renaming}
          onClose={() => setRenaming(null)}
          onSave={(name) =>
            void run(async () => {
              await saveCharacter({
                ...renaming,
                identity: { ...renaming.identity, name },
                updatedAt: nowIso(),
              })
              setRenaming(null)
            })
          }
        />
      )}

      {plan && (
        <Sheet title="Confirm import" onClose={() => setPlan(null)}>
          <div className="stack">
            {plan.warnings.length > 0 && (
              <div className="banner warn">
                Skipped invalid entries:
                <ul>
                  {plan.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {plan.items.map((item, i) => (
              <div className="panel" key={item.incoming.id + i}>
                <div className="row">
                  <b style={{ flex: 1, overflowWrap: 'anywhere' }}>{displayName(item.incoming)}</b>
                  {item.existing ? (
                    <span className="badge">Already exists</span>
                  ) : (
                    <span className="badge cyan">New</span>
                  )}
                </div>
                {item.existing && (
                  <div className="hint">
                    Existing copy updated {new Date(item.existing.updatedAt).toLocaleString()} ·
                    imported copy updated {new Date(item.incoming.updatedAt).toLocaleString()}
                  </div>
                )}
                <div className="row" style={{ marginTop: 6 }}>
                  {(item.existing
                    ? (['copy', 'replace', 'skip'] as ImportChoice[])
                    : (['replace', 'skip'] as ImportChoice[])
                  ).map((ch) => (
                    <button
                      key={ch}
                      className={`btn small ${item.choice === ch ? 'on' : ''}`}
                      aria-pressed={item.choice === ch}
                      onClick={() =>
                        setPlan({
                          ...plan,
                          items: plan.items.map((x, j) => (j === i ? { ...x, choice: ch } : x)),
                        })
                      }
                    >
                      {ch === 'copy'
                        ? 'Add as copy'
                        : ch === 'replace'
                          ? item.existing
                            ? 'Replace existing'
                            : 'Import'
                          : 'Skip'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="row">
              <button
                className="btn primary"
                onClick={() =>
                  void run(async () => {
                    const toWrite = resolveImport(plan.items)
                    await saveMany(toWrite)
                    setPlan(null)
                  }, 'Import complete.')
                }
              >
                Import selected
              </button>
              <button className="btn" onClick={() => setPlan(null)}>
                Cancel
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </main>
  )
}

function RenameSheet(props: { c: Character; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(props.c.identity.name)
  return (
    <Sheet title="Rename" onClose={props.onClose}>
      <div className="fields">
        <TextField label="Name" value={name} onChange={setName} />
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={() => props.onSave(name)}>
          Save
        </button>
        <button className="btn" onClick={props.onClose}>
          Cancel
        </button>
      </div>
    </Sheet>
  )
}
