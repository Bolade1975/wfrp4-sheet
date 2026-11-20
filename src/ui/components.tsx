import { useEffect, useState, type ReactNode } from 'react'
import type { Derived } from '../rules/engine'
import { formatRef } from '../rules/references'
import { useChar } from '../state/store'
import { NumberField } from './fields'

export function Panel(props: {
  title: string
  children: ReactNode
  actions?: ReactNode
  className?: string
  hint?: ReactNode
}) {
  return (
    <section className={`panel ${props.className ?? ''}`}>
      <div className="panel-head">
        <h2>{props.title}</h2>
        {props.actions}
      </div>
      {props.hint && <p className="hint panel-hint">{props.hint}</p>}
      {props.children}
    </section>
  )
}

export function Sheet(props: { title: string; onClose: () => void; children: ReactNode }) {
  const { onClose } = props
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row sheet-head">
          <h3>{props.title}</h3>
          <button className="btn small" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {props.children}
      </div>
    </div>
  )
}

/** Two-step delete/confirm button; no hover required. */
export function ConfirmButton(props: {
  label: string
  confirmLabel?: string
  onConfirm: () => void
  className?: string
}) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), 4000)
    return () => window.clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      className={`btn danger ${props.className ?? ''}`}
      onClick={() => {
        if (armed) {
          setArmed(false)
          props.onConfirm()
        } else setArmed(true)
      }}
    >
      {armed ? (props.confirmLabel ?? 'Tap again to confirm') : props.label}
    </button>
  )
}

export function OvrBadge() {
  return (
    <span className="badge ovr" title="Manual override — replaces the calculated value">
      MANUAL
    </span>
  )
}

/** Breakdown of a derived value: parts, rule source, missing inputs and override controls. */
export function Breakdown(props: { d: Derived; allowOverride?: boolean }) {
  const { c, update } = useChar()
  const { d } = props
  const [draft, setDraft] = useState<number | null>(d.overridden ? d.value : d.auto)
  return (
    <div className="stack">
      {d.missing.length > 0 && (
        <div className="banner warn">
          <b>Needs input:</b> {d.missing.join(', ')}. The calculated value is shown as “—” until
          this is filled in (or set a manual value below).
        </div>
      )}
      <table className="breakdown">
        <tbody>
          {d.parts.map((p, i) => (
            <tr key={i}>
              <td>{p.label}</td>
              <td className="v">
                {i === 0 ? p.value : p.value < 0 ? `− ${-p.value}` : `+ ${p.value}`}
              </td>
            </tr>
          ))}
          <tr className="total">
            <td>Calculated</td>
            <td className="v">{d.auto ?? '—'}</td>
          </tr>
          {d.overridden && (
            <tr className="total">
              <td>
                <OvrBadge /> Manual value in use
              </td>
              <td className="v">{d.value}</td>
            </tr>
          )}
        </tbody>
      </table>
      {d.notes.map((n, i) => (
        <div key={i} className="hint">
          {n}
        </div>
      ))}
      {d.ref && (
        <div className="ref">
          Rule: {d.ref.title} — {formatRef(d.ref)}
          {d.ref.note ? ` · ${d.ref.note}` : ''}
        </div>
      )}
      {props.allowOverride !== false && (
        <div className="override-box">
          <div className="row">
            <NumberField
              label="Manual value"
              value={draft}
              onChange={setDraft}
              className="spacer"
            />
            <button
              className="btn primary"
              disabled={draft === null}
              onClick={() =>
                update((x) => {
                  if (draft !== null) x.overrides[d.id] = draft
                })
              }
            >
              Use manual value
            </button>
            {c.overrides[d.id] !== undefined && (
              <button
                className="btn"
                onClick={() =>
                  update((x) => {
                    delete x.overrides[d.id]
                  })
                }
              >
                Back to calculated
              </button>
            )}
          </div>
          <div className="hint">
            For GM rulings, supplements or talents. A manual value replaces the calculated one
            everywhere (including the PDF) and is marked MANUAL until removed.
          </div>
        </div>
      )}
    </div>
  )
}

/** Tappable value box (label always visible). Opens the breakdown. */
export function Readout(props: {
  d: Derived
  label?: string
  sub?: ReactNode
  big?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const { d } = props
  return (
    <>
      <button
        type="button"
        className={`readout ${props.big ? 'big' : ''} ${d.overridden ? 'overridden' : ''} ${props.className ?? ''}`}
        onClick={() => setOpen(true)}
        aria-label={`${props.label ?? d.label}: ${d.value ?? 'needs input'}`}
      >
        <span className="lbl">{props.label ?? d.label}</span>
        {d.value === null ? (
          <span className="val missing">—</span>
        ) : (
          <span className="val num">{d.value}</span>
        )}
        {d.overridden ? <OvrBadge /> : props.sub ? <span className="sub">{props.sub}</span> : null}
      </button>
      {open && (
        <Sheet title={props.label ?? d.label} onClose={() => setOpen(false)}>
          <Breakdown d={d} />
        </Sheet>
      )}
    </>
  )
}

/** −/+ counter for play values (Wounds, Advantage, Fortune …). */
export function Counter(props: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  max?: number | null
  min?: number
  hint?: ReactNode
  className?: string
}) {
  const v = props.value
  const min = props.min ?? 0
  return (
    <div className={`counter ${props.className ?? ''}`}>
      <div className="lbl">{props.label}</div>
      <div className="counter-row">
        <button
          type="button"
          className="btn round"
          aria-label={`Decrease ${props.label}`}
          onClick={() => props.onChange(Math.max(min, (v ?? 0) - 1))}
        >
          −
        </button>
        <span className="val num">
          {v ?? '—'}
          {props.max !== undefined && <small> / {props.max ?? '—'}</small>}
        </span>
        <button
          type="button"
          className="btn round"
          aria-label={`Increase ${props.label}`}
          onClick={() => props.onChange((v ?? 0) + 1)}
        >
          +
        </button>
      </div>
      {props.hint && <div className="hint">{props.hint}</div>}
    </div>
  )
}

export function Empty(props: { children: ReactNode }) {
  return <div className="empty">{props.children}</div>
}
