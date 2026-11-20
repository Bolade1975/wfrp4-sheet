import { LOCATIONS, type Armour, type Trapping, type Weapon } from '../../domain/schema'
import { encumbrance, ENC_LEVEL_TEXT, skillLabel } from '../../rules/engine'
import { useChar } from '../../state/store'
import { Panel, Readout } from '../../ui/components'
import { LOCATION_LABEL, locationsText } from '../../ui/labels'
import { Check, NumberField } from '../../ui/fields'
import { ItemList } from '../../ui/ItemList'
import { fmtNum } from '../../ui/format'

const itemDefaults = { quantity: 1, enc: null, location: '', current: true, notes: '' }

export function InventoryTab() {
  const { c, update } = useChar()
  const enc = encumbrance(c)
  const skillOptions = [
    { value: '', label: '— not linked —' },
    ...c.skills.map((s) => ({ value: s.id, label: skillLabel(s) })),
  ]
  return (
    <div className="stack">
      <p className="hint lead">
        Everything the character owns. Mark items <b>Current</b> when they are carried or available
        right now — only those appear in Current Loadout and count towards Encumbrance. Item stats
        are typed in by you from the book; the app adds none.
      </p>

      <Panel title="Weapons">
        <ItemList<Weapon>
          items={c.weapons}
          onChange={(v) => update((x) => void (x.weapons = v))}
          current
          addLabel="Add weapon"
          emptyText="No weapons."
          title={(w) => w.name || 'Unnamed weapon'}
          columns={[
            { label: 'Damage', get: (w) => w.damage || '—' },
            { label: 'Enc', get: (w) => fmtNum(w.enc) },
          ]}
          make={() => ({
            ...itemDefaults,
            name: '',
            kind: 'melee',
            group: '',
            rangeReach: '',
            damage: '',
            qualities: '',
            skillId: null,
            ammo: '',
          })}
          fields={[
            { key: 'name', label: 'Name', type: 'text' },
            {
              key: 'kind',
              label: 'Type',
              type: 'select',
              options: [
                { value: 'melee', label: 'Melee' },
                { value: 'ranged', label: 'Ranged' },
              ],
            },
            { key: 'group', label: 'Group', type: 'text' },
            { key: 'rangeReach', label: 'Range / Reach', type: 'text' },
            { key: 'damage', label: 'Damage (e.g. +SB+4)', type: 'text' },
            {
              key: 'skillId',
              label: 'Attack skill',
              type: 'select',
              options: skillOptions,
              nullable: true,
            },
            { key: 'qualities', label: 'Qualities & Flaws', type: 'text', full: true },
            { key: 'enc', label: 'Enc', type: 'num' },
            { key: 'quantity', label: 'Quantity', type: 'int' },
            { key: 'location', label: 'Carried where / slot', type: 'text' },
            { key: 'ammo', label: 'Ammunition', type: 'text' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
          ]}
        />
      </Panel>

      <Panel title="Armour">
        <ItemList<Armour>
          items={c.armour}
          onChange={(v) => update((x) => void (x.armour = v))}
          current
          addLabel="Add armour"
          emptyText="No armour."
          title={(a) => (
            <>
              {a.name || 'Unnamed armour'} {a.worn && <span className="badge worn">Worn</span>}
            </>
          )}
          columns={[
            { label: 'Locations', get: (a) => locationsText(a.locations) || '—' },
            { label: 'AP', get: (a) => fmtNum(a.ap) },
            { label: 'Enc', get: (a) => fmtNum(a.enc) },
          ]}
          make={() => ({
            ...itemDefaults,
            name: '',
            locations: [],
            ap: null,
            qualities: '',
            penalty: '',
            worn: false,
          })}
          fields={[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'ap', label: 'AP', type: 'num' },
            { key: 'enc', label: 'Enc', type: 'num' },
            { key: 'worn', label: 'Worn (listed on the AP map)', type: 'bool' },
            { key: 'qualities', label: 'Qualities & Flaws', type: 'text' },
            { key: 'penalty', label: 'Penalty', type: 'text' },
            { key: 'location', label: 'Carried where', type: 'text' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
          ]}
          extra={(a, set) => (
            <fieldset className="loc-pick">
              <legend>Locations</legend>
              {LOCATIONS.map((l) => (
                <Check
                  key={l}
                  label={LOCATION_LABEL[l]}
                  checked={a.locations.includes(l)}
                  onChange={(v) =>
                    set({
                      locations: v
                        ? LOCATIONS.filter((x) => x === l || a.locations.includes(x))
                        : a.locations.filter((x) => x !== l),
                    })
                  }
                />
              ))}
            </fieldset>
          )}
        />
        <p className="hint">Set AP totals per Hit Location on the Combat tab.</p>
      </Panel>

      <Panel title="Trappings">
        <ItemList<Trapping>
          items={c.trappings}
          onChange={(v) => update((x) => void (x.trappings = v))}
          current
          addLabel="Add trapping"
          emptyText="No trappings."
          title={(t) => (
            <>
              {t.name || 'Unnamed item'}
              {t.quantity !== null && t.quantity !== 1 ? ` × ${t.quantity}` : ''}
            </>
          )}
          columns={[
            { label: 'Where', get: (t) => t.location || '—' },
            { label: 'Enc', get: (t) => fmtNum(t.enc) },
          ]}
          make={() => ({ ...itemDefaults, name: '', category: 'equipment' })}
          fields={[
            { key: 'name', label: 'Name', type: 'text' },
            {
              key: 'category',
              label: 'Kind',
              type: 'select',
              options: [
                { value: 'equipment', label: 'Equipment' },
                { value: 'tool', label: 'Tool' },
                { value: 'container', label: 'Container' },
                { value: 'consumable', label: 'Consumable' },
                { value: 'other', label: 'Other' },
              ],
            },
            { key: 'quantity', label: 'Quantity', type: 'int' },
            { key: 'enc', label: 'Enc (total for this row)', type: 'num' },
            { key: 'location', label: 'Carried where / slot', type: 'text' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
          ]}
        />
      </Panel>

      <div className="grid two">
        <Panel title="Wealth">
          <div className="fields three-col">
            <NumberField
              label="GC (Gold Crowns)"
              value={c.wealth.gc}
              onChange={(v) => update((x) => void (x.wealth.gc = v))}
            />
            <NumberField
              label="SS (Silver Shillings)"
              value={c.wealth.ss}
              onChange={(v) => update((x) => void (x.wealth.ss = v))}
            />
            <NumberField
              label="D (Brass Pennies)"
              value={c.wealth.d}
              onChange={(v) => update((x) => void (x.wealth.d = v))}
            />
          </div>
          <div className="wealth-notes">
            {c.wealth.notes.map((n, i) => (
              <input
                key={i}
                className="input small"
                value={n}
                placeholder={`Note ${i + 1}`}
                aria-label={`Wealth note ${i + 1}`}
                onChange={(e) => {
                  const v = e.target.value
                  update((x) => void (x.wealth.notes[i] = v))
                }}
              />
            ))}
          </div>
        </Panel>
        <EncumbrancePanel enc={enc} />
      </div>
    </div>
  )
}

export function EncumbrancePanel(props: { enc: ReturnType<typeof encumbrance> }) {
  const { enc } = props
  return (
    <Panel title="Encumbrance" hint="Current items only. Limit = SB + TB (p. 293).">
      <div className="enc-box">
        <div className="kv-list">
          <div className="kv">
            <span>Weapons</span>
            <b className="num">{enc.weapons}</b>
          </div>
          <div className="kv">
            <span>Armour</span>
            <b className="num">{enc.armour}</b>
          </div>
          <div className="kv">
            <span>Trappings</span>
            <b className="num">{enc.trappings}</b>
          </div>
          <div className="kv total">
            <span>Total</span>
            <b className="num">{enc.total}</b>
          </div>
        </div>
        <Readout d={enc.max} big />
      </div>
      {enc.level !== null && (
        <div className={`banner ${enc.level === 0 ? 'ok' : 'warn'}`}>
          {ENC_LEVEL_TEXT[enc.level]}{' '}
          <span className="hint">(reminder only — values are not changed)</span>
        </div>
      )}
      {enc.missingEnc.length > 0 && (
        <p className="hint">No Enc entered for: {enc.missingEnc.join(', ')} (not counted).</p>
      )}
    </Panel>
  )
}
