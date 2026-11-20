import { useState } from 'react'
import type { Character, Weapon, WeaponLibrary, WeaponRef } from '../domain/schema'
import { skillLabel } from '../rules/engine'
import { ComboField, type ComboGroup } from '../ui/ComboField'
import { NumberField } from '../ui/fields'
import { weaponFromRef, type QualityInfo } from './fromRef'
import { WEAPON_QUALITIES, qualityDef, tagText, type QualityTag } from './qualities'

/** Drop-down of the weapons in the player's imported rulebook, with manual entry. */
export function WeaponPicker(props: {
  w: Weapon
  c: Character
  lib: WeaponLibrary | null | undefined
  set: (patch: Partial<Weapon>) => void
}) {
  const { w, lib } = props
  const groups: ComboGroup[] = []
  for (const kind of ['melee', 'ranged'] as const) {
    const byGroup = new Map<string, WeaponRef[]>()
    for (const r of lib?.weapons ?? [])
      if (r.kind === kind) byGroup.set(r.group, [...(byGroup.get(r.group) ?? []), r])
    for (const [group, list] of byGroup)
      groups.push({
        label: `${kind === 'melee' ? 'Melee' : 'Ranged'} — ${group || 'Other'}`,
        options: list.map((r) => ({
          value: r.name,
          label: `${r.twoHanded ? '(2H) ' : ''}${r.name} · ${r.damage || '–'}`,
        })),
      })
  }
  const skill = props.c.skills.find((s) => s.id === w.skillId)
  return (
    <div className="weapon-pick">
      <ComboField
        label="Weapon"
        value={w.name}
        groups={groups}
        onPick={(name) => {
          const ref = lib?.weapons.find((r) => r.name === name)
          if (ref) props.set(weaponFromRef(ref, props.c))
        }}
        onType={(name) => props.set({ name })}
        placeholder="Weapon name"
        {...(lib && lib.weapons.length
          ? {}
          : {
              hint: 'Import your rulebook (Careers or Inventory tab) to pick from the weapon tables.',
            })}
      />
      {lib && lib.weapons.some((r) => r.name === w.name) && (
        <p className="hint">
          Filled from the rulebook table
          {skill
            ? `; attack skill set to ${skillLabel(skill)}`
            : '; no matching attack skill found'}
          . Everything below can be changed.
        </p>
      )}
    </div>
  )
}

/** Tick-list of all Weapon Qualities and Flaws, with ratings and descriptions. */
export function QualityPicker(props: {
  tags: QualityTag[]
  info: QualityInfo
  onChange: (tags: QualityTag[]) => void
}) {
  const has = (name: string) => props.tags.find((t) => t.name === name)
  const toggle = (name: string, rated: boolean) =>
    props.onChange(
      has(name)
        ? props.tags.filter((t) => t.name !== name)
        : [...props.tags, { name, rating: rated ? 1 : null }],
    )
  const setRating = (name: string, rating: number | null) =>
    props.onChange(props.tags.map((t) => (t.name === name ? { ...t, rating } : t)))
  return (
    <fieldset className="quality-pick">
      <legend>Qualities &amp; Flaws</legend>
      {(['quality', 'flaw'] as const).map((kind) => (
        <div key={kind} className="quality-group">
          <div className="lbl">{kind === 'quality' ? 'Qualities' : 'Flaws'}</div>
          <div className="chip-row">
            {WEAPON_QUALITIES.filter((q) => q.kind === kind).map((q) => {
              const t = has(q.name)
              return (
                <span key={q.name} className={`q-chip ${kind} ${t ? 'on' : ''}`}>
                  <button type="button" aria-pressed={!!t} onClick={() => toggle(q.name, q.rated)}>
                    <span className="box" aria-hidden>
                      {t ? '✓' : ''}
                    </span>
                    {q.name}
                  </button>
                  {t && q.rated && (
                    <NumberField
                      hideLabel
                      label={`${q.name} rating`}
                      value={t.rating}
                      onChange={(v) => setRating(q.name, v)}
                      className="q-rating"
                    />
                  )}
                </span>
              )
            })}
          </div>
        </div>
      ))}
      {props.tags.length > 0 && <QualityDescriptions tags={props.tags} info={props.info} />}
    </fieldset>
  )
}

export function QualityDescriptions(props: { tags: QualityTag[]; info: QualityInfo }) {
  return (
    <dl className="q-desc">
      {props.tags.map((t) => {
        const ref = props.info.get(t.name)
        const def = qualityDef(t.name)
        return (
          <div key={t.name} className={def?.kind === 'flaw' ? 'flaw' : 'quality'}>
            <dt>
              {tagText(t)} <small>{def?.kind === 'flaw' ? 'Flaw' : 'Quality'}</small>
            </dt>
            <dd>
              {ref?.description ||
                'No description yet — import your rulebook to see what it does (p. 297–299).'}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/** Compact quality chips for play; tap a chip to read what it does. */
export function QualityChips(props: { w: Weapon; info: QualityInfo }) {
  const [open, setOpen] = useState<string | null>(null)
  const { w } = props
  if (w.qualityTags.length === 0 && !w.qualities.trim()) return null
  const openTag = w.qualityTags.find((t) => t.name === open)
  return (
    <div className="q-chips">
      <div className="chip-row">
        {w.qualityTags.map((t) => {
          const flaw = qualityDef(t.name)?.kind === 'flaw'
          return (
            <button
              key={t.name}
              type="button"
              className={`q-tag ${flaw ? 'flaw' : 'quality'} ${open === t.name ? 'on' : ''}`}
              aria-expanded={open === t.name}
              onClick={() => setOpen(open === t.name ? null : t.name)}
            >
              {tagText(t)}
            </button>
          )
        })}
        {w.qualities.trim() && <span className="q-tag other">{w.qualities}</span>}
      </div>
      {openTag && <QualityDescriptions tags={[openTag]} info={props.info} />}
    </div>
  )
}
