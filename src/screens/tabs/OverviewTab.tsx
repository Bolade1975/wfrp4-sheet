import type { Character } from '../../domain/schema'
import { useChar } from '../../state/store'
import { Panel } from '../../ui/components'
import { NumberField, Select, TextField } from '../../ui/fields'
import type { TabKey } from '../tabKeys'
import { CareerAdvanceBox } from './CareerAdvanceBox'

type Ident = Character['identity']

export function OverviewTab(props: { goTo: (t: TabKey) => void }) {
  const { c, update } = useChar()
  const setI = <K extends keyof Ident>(k: K, v: Ident[K]) =>
    update((x) => {
      x.identity[k] = v
    })
  const i = c.identity
  return (
    <div className="grid two">
      <Panel title="Character" className="span-all">
        <div className="fields">
          <TextField
            label="Name"
            value={i.name}
            onChange={(v) => setI('name', v)}
            className="wide"
          />
          <Select
            label="Species"
            value={i.species}
            onChange={(v) => setI('species', v)}
            options={[
              { value: '', label: '— choose —' },
              { value: 'human', label: 'Human' },
              { value: 'dwarf', label: 'Dwarf' },
              { value: 'halfling', label: 'Halfling' },
              { value: 'highElf', label: 'High Elf' },
              { value: 'woodElf', label: 'Wood Elf' },
              { value: 'other', label: 'Other (supplement)' },
            ]}
          />
          {i.species === 'other' && (
            <TextField
              label="Species name"
              value={i.speciesOther}
              onChange={(v) => setI('speciesOther', v)}
            />
          )}
          <TextField label="Class" value={i.class} onChange={(v) => setI('class', v)} />
          <TextField label="Career" value={i.career} onChange={(v) => setI('career', v)} />
          <Select
            label="Career Tier (level)"
            value={i.careerLevel === null ? '' : String(i.careerLevel)}
            onChange={(v) => setI('careerLevel', v === '' ? null : Number(v))}
            options={[
              { value: '', label: '—' },
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
            ]}
          />
          <TextField
            label="Career Path (current level title)"
            value={i.careerPath}
            onChange={(v) => setI('careerPath', v)}
            className="wide"
          />
          <Select
            label="Status tier"
            value={i.statusTier}
            onChange={(v) => setI('statusTier', v)}
            options={[
              { value: '', label: '—' },
              { value: 'brass', label: 'Brass' },
              { value: 'silver', label: 'Silver' },
              { value: 'gold', label: 'Gold' },
            ]}
          />
          <NumberField
            label="Status standing"
            value={i.statusStanding}
            onChange={(v) => setI('statusStanding', v)}
          />
          <TextField label="Age" value={i.age} onChange={(v) => setI('age', v)} />
          <TextField label="Height" value={i.height} onChange={(v) => setI('height', v)} />
          <TextField label="Hair" value={i.hair} onChange={(v) => setI('hair', v)} />
          <TextField label="Eyes" value={i.eyes} onChange={(v) => setI('eyes', v)} />
        </div>
        {i.species === 'other' && (
          <p className="hint">
            For species outside the Core Rulebook, Wounds are not calculated — set them as a manual
            value on the Characteristics tab.
          </p>
        )}
      </Panel>

      <CareerAdvanceBox goTo={props.goTo} />

      <Panel title="Ambitions">
        <div className="fields one">
          <TextField
            label="Short Term"
            multiline
            value={c.ambitions.short}
            onChange={(v) => update((x) => void (x.ambitions.short = v))}
          />
          <TextField
            label="Long Term"
            multiline
            value={c.ambitions.long}
            onChange={(v) => update((x) => void (x.ambitions.long = v))}
          />
        </div>
      </Panel>

      <Panel title="Party">
        <div className="fields one">
          <TextField
            label="Party Name"
            value={c.party.name}
            onChange={(v) => update((x) => void (x.party.name = v))}
          />
          <TextField
            label="Short Term Ambitions"
            multiline
            value={c.party.short}
            onChange={(v) => update((x) => void (x.party.short = v))}
          />
          <TextField
            label="Long Term Ambitions"
            multiline
            value={c.party.long}
            onChange={(v) => update((x) => void (x.party.long = v))}
          />
          <TextField
            label="Members"
            multiline
            value={c.party.members}
            onChange={(v) => update((x) => void (x.party.members = v))}
          />
        </div>
      </Panel>
    </div>
  )
}
