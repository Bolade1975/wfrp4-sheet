import { useState } from 'react'
import { makeSkill } from '../../domain/factory'
import { CHAR_KEYS, type Skill } from '../../domain/schema'
import { SKILL_CATALOG, type CatalogSkill } from '../../rules/catalog'
import {
  CHAR_LABELS,
  CHAR_NAMES,
  canTest,
  isSheetBasic,
  skillLabel,
  skillValue,
} from '../../rules/engine'
import { useChar } from '../../state/store'
import { Breakdown, ConfirmButton, Empty, OvrBadge, Panel, Sheet } from '../../ui/components'
import { Check, NumberField, Segmented, Select, TextField } from '../../ui/fields'

type Filter = 'all' | 'basic' | 'advanced' | 'career' | 'race' | 'fav'
type Sort = 'sheet' | 'name' | 'value'

export function SkillsTab() {
  const { c, update } = useChar()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('sheet')
  const [openId, setOpenId] = useState<string | null>(null)
  const [valueId, setValueId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const setSkill = (id: string, patch: Partial<Skill>) =>
    update((x) => {
      const s = x.skills.find((k) => k.id === id)
      if (s) Object.assign(s, patch)
    })

  const needle = q.trim().toLowerCase()
  let list = c.skills.filter((s) => {
    if (
      needle &&
      !`${skillLabel(s)} ${CHAR_NAMES[s.characteristic]} ${s.notes}`.toLowerCase().includes(needle)
    )
      return false
    if (filter === 'basic') return isSheetBasic(s)
    if (filter === 'advanced') return !isSheetBasic(s)
    if (filter === 'career') return s.inCareer
    if (filter === 'race') return s.race
    if (filter === 'fav') return s.favourite
    return true
  })
  if (sort === 'name') list = [...list].sort((a, b) => skillLabel(a).localeCompare(skillLabel(b)))
  if (sort === 'value')
    list = [...list].sort((a, b) => (skillValue(c, b).value ?? -1) - (skillValue(c, a).value ?? -1))

  const move = (id: string, dir: -1 | 1) =>
    update((x) => {
      const i = x.skills.findIndex((s) => s.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= x.skills.length) return
      ;[x.skills[i], x.skills[j]] = [x.skills[j]!, x.skills[i]!]
    })

  const valueSkill = c.skills.find((s) => s.id === valueId)

  return (
    <div className="stack">
      <Panel
        title="Skills"
        hint="Skill = Characteristic + Advances (p. 47, 117). Basic Skills can be Tested with no Advances; Advanced Skills need at least one (p. 118). Grouped Skills: each Specialisation is its own row. Tap Career / Race to mark a skill — the marks are for reference and change no values."
        actions={
          <button className="btn primary" onClick={() => setAdding(true)}>
            + Add skill
          </button>
        }
      >
        <div className="toolbar">
          <input
            className="input search"
            type="search"
            placeholder="Find a skill…"
            aria-label="Find a skill"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Segmented
            label="Filter skills"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'basic', label: 'Basic' },
              { value: 'advanced', label: 'Grouped & Advanced' },
              { value: 'career', label: 'Career' },
              { value: 'race', label: 'Race' },
              { value: 'fav', label: '★ Favourites' },
            ]}
          />
          <Segmented
            label="Sort skills"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'sheet', label: 'Your order' },
              { value: 'name', label: 'A–Z' },
              { value: 'value', label: 'Highest' },
            ]}
          />
        </div>

        <div className="skill-table">
          <div className="skill-row head" aria-hidden>
            <span />
            <span>Name</span>
            <span>Char.</span>
            <span>Career · Race</span>
            <span>Adv</span>
            <span>Skill</span>
            <span />
          </div>
          {list.length === 0 && (
            <Empty>
              {c.skills.length === 0
                ? 'No skills yet. Use “Add skill”.'
                : 'No skills match the search or filter.'}
            </Empty>
          )}
          {list.map((s) => {
            const d = skillValue(c, s)
            const open = openId === s.id
            const testable = canTest(s)
            return (
              <div key={s.id} className={`skill ${open ? 'open' : ''}`}>
                <div className="skill-row">
                  <button
                    type="button"
                    className={`fav ${s.favourite ? 'on' : ''}`}
                    aria-pressed={s.favourite}
                    aria-label={`Favourite ${skillLabel(s)}`}
                    onClick={() => setSkill(s.id, { favourite: !s.favourite })}
                  >
                    {s.favourite ? '★' : '☆'}
                  </button>
                  <span className="skill-name">
                    {skillLabel(s)}
                    <span className="tags">
                      {s.type === 'advanced' && <span className="badge">Advanced</span>}
                      {s.grouped && <span className="badge">Grouped</span>}
                    </span>
                    {s.notes && <span className="skill-note">{s.notes}</span>}
                  </span>
                  <span className="skill-char" title={CHAR_NAMES[s.characteristic]}>
                    {CHAR_LABELS[s.characteristic]}
                  </span>
                  <span className="skill-marks">
                    <button
                      type="button"
                      className="mark career"
                      aria-pressed={s.inCareer}
                      aria-label={`Career skill: ${skillLabel(s)}`}
                      onClick={() => setSkill(s.id, { inCareer: !s.inCareer })}
                    >
                      Career
                    </button>
                    <button
                      type="button"
                      className="mark race"
                      aria-pressed={s.race}
                      aria-label={`Race skill: ${skillLabel(s)}`}
                      onClick={() => setSkill(s.id, { race: !s.race })}
                    >
                      Race
                    </button>
                  </span>
                  <NumberField
                    hideLabel
                    label={`${skillLabel(s)} advances`}
                    value={s.advances}
                    allowNull={false}
                    onChange={(v) => setSkill(s.id, { advances: v ?? 0 })}
                    className="adv"
                  />
                  <button
                    type="button"
                    className={`skill-val ${d.overridden ? 'overridden' : ''} ${testable ? '' : 'untestable'}`}
                    onClick={() => setValueId(s.id)}
                    aria-label={`${skillLabel(s)} value ${d.value ?? 'not available'}`}
                  >
                    <b className="num">{d.value ?? (testable ? '—' : '✕')}</b>
                    {d.overridden && <OvrBadge />}
                    {!testable && !d.overridden && <small>needs Adv</small>}
                  </button>
                  <button
                    type="button"
                    className="btn small ghost"
                    aria-expanded={open}
                    aria-label={`Edit ${skillLabel(s)}`}
                    onClick={() => setOpenId(open ? null : s.id)}
                  >
                    {open ? 'Close' : 'Edit'}
                  </button>
                </div>
                {open && (
                  <div className="skill-edit stack">
                    <div className="fields">
                      <TextField
                        label="Skill"
                        value={s.name}
                        onChange={(v) => setSkill(s.id, { name: v })}
                      />
                      <TextField
                        label="Specialisation"
                        value={s.specialisation}
                        onChange={(v) => setSkill(s.id, { specialisation: v })}
                      />
                      <Select
                        label="Characteristic"
                        value={s.characteristic}
                        onChange={(v) => setSkill(s.id, { characteristic: v })}
                        options={CHAR_KEYS.map((k) => ({
                          value: k,
                          label: `${CHAR_LABELS[k]} — ${CHAR_NAMES[k]}`,
                        }))}
                      />
                      <Select
                        label="Type"
                        value={s.type}
                        onChange={(v) => setSkill(s.id, { type: v })}
                        options={[
                          { value: 'basic', label: 'Basic' },
                          { value: 'advanced', label: 'Advanced' },
                        ]}
                      />
                      <Check
                        label="Grouped"
                        checked={s.grouped}
                        onChange={(v) => setSkill(s.id, { grouped: v })}
                      />
                      <Check
                        label="Career skill"
                        checked={s.inCareer}
                        onChange={(v) => setSkill(s.id, { inCareer: v })}
                      />
                      <Check
                        label="Race skill"
                        checked={s.race}
                        onChange={(v) => setSkill(s.id, { race: v })}
                      />
                      <TextField
                        label="Notes"
                        multiline
                        value={s.notes}
                        onChange={(v) => setSkill(s.id, { notes: v })}
                        className="full"
                      />
                    </div>
                    <div className="row">
                      <button className="btn small" onClick={() => move(s.id, -1)}>
                        ↑ Move up
                      </button>
                      <button className="btn small" onClick={() => move(s.id, 1)}>
                        ↓ Move down
                      </button>
                      <span className="spacer" />
                      <ConfirmButton
                        label="Remove skill"
                        onConfirm={() =>
                          update((x) => {
                            x.skills = x.skills.filter((k) => k.id !== s.id)
                          })
                        }
                      />
                    </div>
                    {sort !== 'sheet' && (
                      <p className="hint">Moving changes “Your order”; switch sort to see it.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Panel>

      {valueSkill && (
        <Sheet title={skillLabel(valueSkill)} onClose={() => setValueId(null)}>
          <Breakdown d={skillValue(c, valueSkill)} />
        </Sheet>
      )}
      {adding && (
        <AddSkillSheet
          onClose={() => setAdding(false)}
          onAdd={(s) => {
            update((x) => void x.skills.push(s))
            setAdding(false)
            setOpenId(null)
          }}
        />
      )}
    </div>
  )
}

function AddSkillSheet(props: { onClose: () => void; onAdd: (s: Skill) => void }) {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<CatalogSkill | null>(null)
  const [spec, setSpec] = useState('')
  const [adv, setAdv] = useState<number | null>(0)
  const n = q.trim().toLowerCase()
  const matches = SKILL_CATALOG.filter((s) => !n || s.name.toLowerCase().includes(n))
  return (
    <Sheet title="Add skill" onClose={props.onClose}>
      {!pick ? (
        <div className="stack">
          <input
            className="input search"
            type="search"
            autoFocus
            placeholder="Search the Core Rulebook skill list…"
            aria-label="Search skills"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="pick-list">
            {matches.map((s) => (
              <button key={s.name} className="pick" onClick={() => setPick(s)}>
                <b>{s.name}</b>
                <span>
                  {CHAR_LABELS[s.characteristic]} · {s.type === 'basic' ? 'Basic' : 'Advanced'}
                  {s.grouped ? ', Grouped' : ''}
                </span>
              </button>
            ))}
            <button
              className="pick custom"
              onClick={() =>
                setPick({
                  name: q.trim() || 'New skill',
                  characteristic: 'ws',
                  type: 'basic',
                  grouped: false,
                })
              }
            >
              <b>+ Custom skill{q.trim() ? `: “${q.trim()}”` : ''}</b>
              <span>For supplements — set its Characteristic and type yourself</span>
            </button>
          </div>
          <p className="hint">Skill list and Characteristics: Core Rulebook p. 118–131.</p>
        </div>
      ) : (
        <div className="stack">
          <div className="fields">
            <TextField
              label="Skill"
              value={pick.name}
              onChange={(v) => setPick({ ...pick, name: v })}
            />
            <TextField
              label={pick.grouped ? 'Specialisation (required for Grouped)' : 'Specialisation'}
              value={spec}
              onChange={setSpec}
            />
            <Select
              label="Characteristic"
              value={pick.characteristic}
              onChange={(v) => setPick({ ...pick, characteristic: v })}
              options={CHAR_KEYS.map((k) => ({
                value: k,
                label: `${CHAR_LABELS[k]} — ${CHAR_NAMES[k]}`,
              }))}
            />
            <Select
              label="Type"
              value={pick.type}
              onChange={(v) => setPick({ ...pick, type: v })}
              options={[
                { value: 'basic', label: 'Basic' },
                { value: 'advanced', label: 'Advanced' },
              ]}
            />
            <NumberField label="Advances" value={adv} onChange={setAdv} />
          </div>
          <div className="row">
            <button
              className="btn primary"
              onClick={() =>
                props.onAdd(
                  makeSkill(pick.name, spec.trim(), {
                    characteristic: pick.characteristic,
                    type: pick.type,
                    grouped: pick.grouped,
                    advances: adv ?? 0,
                  }),
                )
              }
            >
              Add
            </button>
            <button className="btn" onClick={() => setPick(null)}>
              Back
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
