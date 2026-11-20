import { careerAdvance, skillFromEntry, statusText } from '../../careers/advance'
import { CHAR_LABELS, CHAR_NAMES, characteristic, skillLabel, skillValue } from '../../rules/engine'
import { useChar } from '../../state/store'
import { Empty, Panel } from '../../ui/components'
import type { TabKey } from '../tabKeys'

/**
 * "What can I spend XP on?" for the current career level (Core Rulebook
 * p. 47–48). Costs are not calculated — they are entered in the Experience log.
 */
export function CareerAdvanceBox(props: { goTo: (t: TabKey) => void }) {
  const { c, update } = useChar()
  const k = c.career
  const a = careerAdvance(c)

  if (!k.name || k.level === null)
    return (
      <Panel title="Career advancement" className="span-all">
        <Empty>
          Choose your career and level on the{' '}
          <button className="link" onClick={() => props.goTo('careers')}>
            Careers tab
          </button>{' '}
          to see what you can spend XP on.
        </Empty>
      </Panel>
    )
  if (!a)
    return (
      <Panel title={`Career advancement — ${k.name}, level ${k.level}`} className="span-all">
        <Empty>
          No level details for this career. Pick a career from the list in the Career field, or
          import your rulebook on the{' '}
          <button className="link" onClick={() => props.goTo('careers')}>
            Careers tab
          </button>
          .
        </Empty>
      </Panel>
    )

  const done = a.completion
  const missingSkills = a.skills.filter((s) => s.matches.length === 0)
  const unmarked = a.skills.flatMap((s) => s.matches).filter((s) => !s.inCareer)
  const charsComplete =
    done.characteristicsTotal > 0 && done.characteristicsDone === done.characteristicsTotal

  return (
    <Panel
      title={`Career advancement — ${a.levelData.title}`}
      className="span-all career-advance"
      hint={`${k.name}, level ${a.level} (${statusText(a.levelData)}). These are what you can spend XP on now (p. 47–48). Record costs in the Experience log — the app does not calculate them.`}
      actions={
        <button className="btn small" onClick={() => props.goTo('careers')}>
          Change career
        </button>
      }
    >
      <div className="adv-summary">
        <span className="hint">To complete this level (p. 48):</span>
        <span className={charsComplete ? 'ok' : ''}>
          Characteristics with {done.needed}+ advances{' '}
          <b>
            {done.characteristicsDone}/{done.characteristicsTotal}
          </b>
        </span>
        <span className={done.skillsDone >= 8 ? 'ok' : ''}>
          Skills with {done.needed}+ advances <b>{Math.min(done.skillsDone, 8)}/8</b>
        </span>
        <span className={done.talentOwned ? 'ok' : ''}>
          Talent from this level <b>{done.talentOwned ? 'yes' : 'no'}</b>
        </span>
      </div>

      <div className="adv-grid">
        <section>
          <h3 className="sub-head">Characteristics</h3>
          {a.schemeIncomplete && (
            <p className="hint">
              Advance Scheme not fully set — add levels 2–4 on the Careers tab.
            </p>
          )}
          {a.characteristics.length === 0 ? (
            <Empty>None set.</Empty>
          ) : (
            <ul className="adv-list">
              {a.characteristics.map((x) => {
                const d = characteristic(c, x.key)
                return (
                  <li key={x.key} className={x.advances >= done.needed ? 'met' : ''}>
                    <span>
                      <b>{CHAR_LABELS[x.key]}</b> <small>{CHAR_NAMES[x.key]}</small>
                    </span>
                    <span className="num">
                      {d.value ?? '—'} <small>({x.advances} adv)</small>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h3 className="sub-head">Skills (levels 1–{a.level})</h3>
          <ul className="adv-list">
            {a.skills.map((s) => (
              <li
                key={s.entry}
                className={s.matches.some((m) => m.advances >= done.needed) ? 'met' : ''}
              >
                <span>
                  {s.entry}
                  {s.fromLevel !== a.level && <small> · L{s.fromLevel}</small>}
                </span>
                {s.matches.length > 0 ? (
                  <span className="num">
                    {s.matches
                      .map((m) => {
                        const v = skillValue(c, m).value
                        const label = s.anySpec ? `${skillLabel(m)} ` : ''
                        return `${label}${v ?? '—'} (${m.advances} adv)`
                      })
                      .join(' · ')}
                  </span>
                ) : (
                  <button
                    className="btn small"
                    onClick={() => update((x) => void x.skills.push(skillFromEntry(s.entry)))}
                  >
                    + Add
                  </button>
                )}
              </li>
            ))}
          </ul>
          {(missingSkills.length > 0 || unmarked.length > 0) && (
            <div className="row" style={{ marginTop: 8 }}>
              {unmarked.length > 0 && (
                <button
                  className="btn small"
                  onClick={() =>
                    update((x) => {
                      const ids = new Set(unmarked.map((u) => u.id))
                      for (const s of x.skills) if (ids.has(s.id)) s.inCareer = true
                    })
                  }
                >
                  Mark {unmarked.length} as Career skills
                </button>
              )}
              {missingSkills.length > 1 && (
                <button
                  className="btn small"
                  onClick={() =>
                    update((x) => {
                      for (const s of missingSkills) x.skills.push(skillFromEntry(s.entry))
                    })
                  }
                >
                  + Add all {missingSkills.length} missing
                </button>
              )}
            </div>
          )}
        </section>

        <section>
          <h3 className="sub-head">Talents (this level only)</h3>
          <ul className="adv-list">
            {a.talents.map((t) => (
              <li key={t.entry} className={t.owned > 0 ? 'met' : ''}>
                <span>{t.entry}</span>
                <span className="hint">{t.owned > 0 ? `taken ×${t.owned}` : 'not taken'}</span>
              </li>
            ))}
          </ul>
          <h3 className="sub-head">Trappings</h3>
          <ul className="adv-list plain">
            {a.trappings.map((t) => (
              <li key={t.level}>
                <span>
                  <small>L{t.level}</small> {t.items.join(', ') || '—'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Panel>
  )
}
