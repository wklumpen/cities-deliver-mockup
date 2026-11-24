import { useEffect, useState } from 'react'
import { REFERRALS, SHARE_FIELDS } from './content.js'

const INTAKE_DELAYS = [500, 4500, 11000, 16000, 23000]
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function Check() {
  return <svg className="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function Alert() {
  return <svg className="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1L8 1.8Z" fill="currentColor" /><path d="M8 6v4M8 11.8v.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
}

export function Intake({ t, onNext }) {
  const total = t.script.length
  const [shown, setShown] = useState(() => (reducedMotion() ? total : 0))

  useEffect(() => {
    if (reducedMotion()) return
    const ids = INTAKE_DELAYS.map((delay, i) => setTimeout(() => setShown(i + 1), delay))
    return () => ids.forEach(clearTimeout)
  }, [])

  const nextIsAi = shown < total && t.script[shown][0] === 'ai'
  return (
    <div className="screen intake">
      <h1>{t.heading}</h1>
      <div className="chat" role="log" aria-live="polite">
        {t.script.slice(0, shown).map(([who, text]) => <p key={text} className={`bubble ${who}`}>{text}</p>)}
        {nextIsAi && <p className="bubble ai typing" aria-label={t.typing}><span /><span /><span /></p>}
      </div>
      {shown === total
        ? <button type="button" className="cta" onClick={onNext}>{t.cta}</button>
        : <div className="composer" aria-hidden="true">{t.placeholder}</div>}
    </div>
  )
}

export function Skills({ t, skills, setSkills, playing, onNext }) {
  const [adding, setAdding] = useState(false)
  const [edited, setEdited] = useState(null)
  const draft = edited ?? t.items.welcome[0]
  const hasWelcome = skills.includes('welcome')

  const add = (value) => {
    const text = value.trim()
    if (!text) return
    const id = edited === null || text === t.items.welcome[0] ? 'welcome' : `custom:${text}`
    setSkills((list) => (list.includes(id) ? list : [...list, id]))
    setEdited(null)
    setAdding(false)
  }

  useEffect(() => {
    if (!playing || hasWelcome) return
    const open = setTimeout(() => setAdding(true), 7000)
    const save = setTimeout(() => {
      setSkills((list) => (list.includes('welcome') ? list : [...list, 'welcome']))
      setAdding(false)
    }, 11000)
    return () => { clearTimeout(open); clearTimeout(save) }
  }, [playing, hasWelcome, setSkills])

  return (
    <div className="screen">
      <h1>{t.heading}</h1>
      <p className="muted">{t.intro}</p>
      <ul className="skill-list">
        {skills.map((id) => {
          const custom = id.startsWith('custom:')
          const [name, from] = custom ? [id.slice(7), t.custom] : t.items[id]
          return (
            <li key={id} className={id === 'welcome' || custom ? 'skill added' : 'skill'}>
              <span><strong>{name}</strong><small>{from}</small></span>
              <button type="button" className="ghost" aria-label={`${t.remove}: ${name}`} onClick={() => setSkills((list) => list.filter((s) => s !== id))}>×</button>
            </li>
          )
        })}
      </ul>
      {adding ? (
        <form className="add-form" onSubmit={(e) => { e.preventDefault(); add(draft) }}>
          <label htmlFor="new-skill">{t.addLabel}</label>
          <div>
            <input id="new-skill" value={draft} onChange={(e) => setEdited(e.target.value)} autoFocus={!playing} />
            <button type="submit" className="small-primary">{t.save}</button>
          </div>
        </form>
      ) : (
        <button type="button" className="add" onClick={() => setAdding(true)}>+ {t.add}</button>
      )}
      <button type="button" className="cta" onClick={onNext}>{t.cta}</button>
    </div>
  )
}

export function Match({ t, onNext }) {
  return (
    <div className="screen">
      <h1>{t.heading}</h1>
      <article className="card">
        <div className="card-head">
          <div><h2>{t.role}</h2><p className="muted">{t.org}</p></div>
          <span className="badge ok"><Check />{t.verified}</span>
        </div>
        <dl className="facts">
          {t.facts.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}
        </dl>
        <p className="why"><strong>{t.whyTitle}:</strong> {t.why}</p>
        <p className="source">{t.source}</p>
      </article>
      <section className="trip" aria-labelledby="trip-title">
        <h2 id="trip-title">{t.tripTitle}</h2>
        <dl>
          <div><dt>{t.there}</dt><dd>{t.thereText}</dd></div>
          <div className="highlight"><dt>{t.home}</dt><dd>{t.homeText}</dd></div>
          <div><dt>{t.backup}</dt><dd>{t.backupText}</dd></div>
        </dl>
      </section>
      <button type="button" className="cta" onClick={onNext}>{t.cta}</button>
    </div>
  )
}

export function Fallback({ t, onNext }) {
  return (
    <div className="screen">
      <h1>{t.heading}</h1>
      <article className="card withheld">
        <span className="badge warn"><Alert />{t.status}</span>
        <h2>{t.role}</h2>
        <p className="muted">{t.org}</p>
        <p>{t.reason}</p>
      </article>
      <h2 className="section-title">{t.insteadTitle}</h2>
      <article className="card">
        <div className="card-head">
          <div><h3>{t.altRole}</h3><p className="muted">{t.altOrg}</p></div>
          <span className="badge ok"><Check />{t.altVerified}</span>
        </div>
        <p>{t.altFacts}</p>
      </article>
      <section className="person">
        <h2>{t.contactTitle}</h2>
        <p>{t.contactName}</p>
        <p><strong>{t.contactPhone}</strong></p>
      </section>
      <button type="button" className="cta" onClick={onNext}>{t.cta}</button>
    </div>
  )
}

export function Plan({ t, onNext }) {
  return (
    <div className="screen">
      <div className="plan-head">
        <h1>{t.heading}</h1>
        <p className="saved"><Check />{t.saved}</p>
      </div>
      <p className="goal"><strong>{t.goal}</strong> <span>{t.goalNote}</span></p>
      <p className="notice"><Alert /><span>{t.conflict}</span></p>
      <h2 className="section-title">{t.timelineTitle}</h2>
      <ol className="timeline">
        {t.timeline.map(([time, text]) => <li key={time}><time>{time}</time><span>{text}</span></li>)}
      </ol>
      <dl className="plan-facts">
        <div><dt>{t.deadlineLabel}</dt><dd>{t.deadline}</dd></div>
        <div><dt>{t.contactLabel}</dt><dd>{t.contact}</dd></div>
        <div className="span"><dt>{t.alsoLabel}</dt><dd>{t.also}</dd></div>
      </dl>
      <button type="button" className="cta" onClick={onNext}>{t.cta}</button>
    </div>
  )
}

export function Share({ t, sharing, setSharing, onNext }) {
  return (
    <div className="screen">
      <h1>{t.heading}</h1>
      <p className="muted">{t.intro}</p>
      <ul className="share-list">
        {SHARE_FIELDS.map((field) => (
          <li key={field}>
            <label>
              <span>{t.fields[field]}</span>
              <span className={sharing[field] ? 'state on' : 'state'}>{sharing[field] ? t.on : t.off}</span>
              <input type="checkbox" role="switch" checked={sharing[field]} onChange={(e) => setSharing((s) => ({ ...s, [field]: e.target.checked }))} />
              <span className="switch" aria-hidden="true" />
            </label>
          </li>
        ))}
      </ul>
      <button type="button" className="cta" onClick={onNext}>{t.cta}</button>
    </div>
  )
}

export function Navigator({ t, label, langButton, sharing, followedUp, setFollowedUp }) {
  const [selected, setSelected] = useState('dana')
  const statusOf = (row) => (row.id === 'dana' && followedUp ? 'followed' : row.status)
  const count = (status) => REFERRALS.filter((row) => statusOf(row) === status).length
  const current = REFERRALS.find((row) => row.id === selected)

  return (
    <div className="nav-app">
      <header className="nav-bar">
        <span className="brand"><span className="brand-dot" aria-hidden="true" />{t.product}</span>
        <span className="nav-right"><span>{t.signedIn}</span>{langButton}</span>
      </header>
      <p className="concept-label">{label}</p>
      <div className="nav-main">
        <section className="nav-list">
          <div className="nav-title"><h1>{t.heading}</h1><p className="muted">{t.today}</p></div>
          <dl className="stats">
            {['overdue', 'late', 'waiting', 'acknowledged'].map((s) => (
              <div key={s} className={`stat ${s}`}><dd>{count(s)}</dd><dt>{t.stats[s]}</dt></div>
            ))}
          </dl>
          <table>
            <thead>
              <tr>
                <th scope="col">{t.columns.resident}</th>
                <th scope="col">{t.columns.referral}</th>
                <th scope="col">{t.columns.sent}</th>
                <th scope="col">{t.columns.status}</th>
                <th scope="col">{t.columns.owner}</th>
              </tr>
            </thead>
            <tbody>
              {REFERRALS.map((row) => {
                const status = statusOf(row)
                return (
                  <tr key={row.id} className={`${selected === row.id ? 'selected' : ''} ${status === 'overdue' ? 'flagged' : ''}`}>
                    <th scope="row" data-label={t.columns.resident}>
                      <button type="button" aria-pressed={selected === row.id} onClick={() => setSelected(row.id)}>{row.name}</button>
                    </th>
                    <td data-label={t.columns.referral}>{t.referrals[row.id]}</td>
                    <td data-label={t.columns.sent}>{t.sent[row.sent]}</td>
                    <td data-label={t.columns.status}><span className={`pill ${status}`}>{status === 'overdue' && <Alert />}{t.statuses[status]}</span></td>
                    <td data-label={t.columns.owner}>{row.owner}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
        <aside className="nav-detail" aria-label={current.name}>
          {selected === 'dana' ? (
            <>
              <p className="eyebrow alert-text">{t.detailEyebrow}</p>
              <h2>{current.name}</h2>
              <p className="detail-ref">{t.referrals.dana}</p>
              <p>{t.detailBody}</p>
              <p className="owner"><span>{t.ownerLabel}</span><strong>{current.owner}</strong></p>
              <h3>{t.sharedTitle}</h3>
              <ul className="shared">
                {SHARE_FIELDS.map((field) => (
                  <li key={field} className={sharing[field] ? '' : 'hidden-field'}>
                    {sharing[field] ? t.sharedValues[field] : t.notShared}
                  </li>
                ))}
              </ul>
              <button type="button" className="cta" disabled={followedUp} onClick={() => setFollowedUp(true)}>
                {followedUp ? t.actionDone : t.action}
              </button>
            </>
          ) : (
            <>
              <h2>{current.name}</h2>
              <p className="detail-ref">{t.referrals[current.id]}</p>
              <p className="muted">{t.otherBody}</p>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
