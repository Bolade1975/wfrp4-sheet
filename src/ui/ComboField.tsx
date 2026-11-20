import { useId, useState } from 'react'

export type ComboGroup = { label?: string; options: { value: string; label: string }[] }

const OTHER = '__other__'

/**
 * Drop-down with a "type manually" escape hatch — touch friendly (a native
 * select, then a text field), unlike a datalist. A value that is not one of
 * the options is shown in the text field.
 */
export function ComboField(props: {
  label: string
  value: string
  groups: ComboGroup[]
  onPick: (v: string) => void
  onType: (v: string) => void
  placeholder?: string
  className?: string
  hint?: string
}) {
  const id = useId()
  const all = props.groups.flatMap((g) => g.options)
  const inList = all.some((o) => o.value === props.value)
  const [manual, setManual] = useState(props.value !== '' && !inList)
  const showInput = all.length === 0 || manual || (props.value !== '' && !inList)

  return (
    <div className={`field combo ${props.className ?? ''}`}>
      <label className="combo-label" htmlFor={id}>
        {props.label}
      </label>
      {all.length > 0 && (
        <select
          id={showInput ? undefined : id}
          aria-label={props.label}
          className="select"
          value={showInput ? OTHER : props.value}
          onChange={(e) => {
            const v = e.target.value
            if (v === OTHER) setManual(true)
            else {
              setManual(false)
              props.onPick(v)
            }
          }}
        >
          <option value="">— choose —</option>
          {props.groups.map((g, i) =>
            g.label ? (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              g.options.map((o) => (
                <option key={`${i}-${o.value}`} value={o.value}>
                  {o.label}
                </option>
              ))
            ),
          )}
          <option value={OTHER}>Other (type manually)…</option>
        </select>
      )}
      {showInput && (
        <input
          id={id}
          className="input"
          value={props.value}
          placeholder={props.placeholder ?? 'Type here'}
          aria-label={`${props.label} (typed)`}
          autoFocus={manual && props.value === ''}
          onChange={(e) => props.onType(e.target.value)}
        />
      )}
      {showInput && all.length > 0 && (
        <button
          type="button"
          className="link small-link"
          onClick={() => {
            setManual(false)
            props.onType('')
          }}
        >
          Choose from the list instead
        </button>
      )}
      {props.hint && <span className="combo-hint">{props.hint}</span>}
    </div>
  )
}
