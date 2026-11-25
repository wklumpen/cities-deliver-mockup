import { useCallback, useEffect, useRef, useState } from 'react'
import { COPY, DEFAULT_SHARING, DEFAULT_SKILLS, FILM_STEPS, STEPS } from './content.js'
import { Fallback, Intake, Match, Navigator, Plan, Share, Skills, Updates } from './screens.jsx'

const STAGE_W = 1600
const STAGE_H = 900
const WIDE_FROM = 900
const PLAYLIST = new URLSearchParams(location.search).has('film') ? FILM_STEPS : STEPS

const indexFromHash = () => Math.max(0, PLAYLIST.findIndex((s) => s.id === location.hash.slice(1)))

function useViewport() {
  const read = () => ({
    wide: innerWidth >= WIDE_FROM,
    scale: Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H),
  })
  const [viewport, setViewport] = useState(read)
  useEffect(() => {
    const onResize = () => setViewport(read())
    addEventListener('resize', onResize)
    return () => removeEventListener('resize', onResize)
  }, [])
  return viewport
}

export default function App() {
  const [index, setIndex] = useState(indexFromHash)
  const [baseLang, setBaseLang] = useState('en')
  const [langOverride, setLangOverride] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [run, setRun] = useState(0)
  const [skills, setSkills] = useState(DEFAULT_SKILLS)
  const [sharing, setSharing] = useState(DEFAULT_SHARING)
  const [followedUp, setFollowedUp] = useState(false)
  const { wide, scale } = useViewport()
  const [controlsIdle, setControlsIdle] = useState(false)
  const idleTimer = useRef(null)
  const mainRef = useRef(null)
  const moved = useRef(false)

  const wakeControls = useCallback(() => {
    setControlsIdle(false)
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setControlsIdle(true), 3000)
  }, [])

  useEffect(() => {
    wakeControls()
    addEventListener('pointermove', wakeControls)
    return () => {
      removeEventListener('pointermove', wakeControls)
      clearTimeout(idleTimer.current)
    }
  }, [wakeControls])

  const step = PLAYLIST[index]
  const lang = langOverride ?? step.lang ?? baseLang
  const t = COPY[lang]
  const screen = step.screen ?? step.id

  const go = useCallback((next) => {
    const clamped = Math.min(PLAYLIST.length - 1, Math.max(0, next))
    moved.current = true
    setLangOverride(null)
    setIndex(clamped)
    history.replaceState(null, '', `#${PLAYLIST[clamped].id}`)
  }, [])

  const restart = useCallback(() => {
    setPlaying(false)
    setBaseLang('en')
    setSkills(DEFAULT_SKILLS)
    setSharing(DEFAULT_SHARING)
    setFollowedUp(false)
    setRun((r) => r + 1)
    go(0)
  }, [go])

  const toggleLang = () => {
    const next = lang === 'en' ? 'es' : 'en'
    setBaseLang(next)
    setLangOverride(next)
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    if (!moved.current) return
    window.scrollTo(0, 0)
    if (!playing) mainRef.current?.focus({ preventScroll: true })
  }, [index, playing])

  useEffect(() => {
    if (!playing) return
    if (index === PLAYLIST.length - 1) {
      const id = setTimeout(() => setPlaying(false), step.seconds * 1000)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => go(index + 1), step.seconds * 1000)
    return () => clearTimeout(id)
  }, [playing, index, step.seconds, go])

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === 'Home') restart()
      else if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A') {
        e.preventDefault()
        setPlaying((p) => !p)
        wakeControls()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [index, go, restart, wakeControls])

  const next = () => go(index + 1)
  const key = `${step.id}-${run}`
  const story = t.stories[screen]

  const langButton = (
    <button className="lang" type="button" lang={lang === 'en' ? 'es' : 'en'} aria-label={t.switchLanguageName} onClick={toggleLang}>
      {t.switchLanguage}
    </button>
  )

  let body
  if (step.kind === 'title' || step.kind === 'end') {
    const card = step.kind === 'end' ? { tagline: t.end.heading, lead: t.end.lead } : t.title
    body = (
      <main className="title-card" ref={mainRef} tabIndex={-1}>
        {!playing && <div className="title-lang">{langButton}</div>}
        <p className="eyebrow">{t.project}</p>
        <h1>{card.tagline}</h1>
        <p className="title-lead">{card.lead}</p>
        <Dots />
        <p className="concept-label">{t.label}</p>
      </main>
    )
  } else if (step.kind === 'phone') {
    body = (
      <div className="phone-layout">
        <Story story={story} t={t} />
        <div className="phone">
          <header className="app-bar">
            <span className="brand"><span className="brand-dot" aria-hidden="true" />{t.brand}</span>
            {langButton}
          </header>
          <p className="concept-label">{t.label}</p>
          <main className="phone-body" ref={mainRef} tabIndex={-1} key={key}>
            {screen === 'intake' && <Intake t={t.intake} fast={step.fast} onNext={next} />}
            {screen === 'skills' && <Skills t={t.skills} skills={skills} setSkills={setSkills} playing={playing} fast={step.fast} onNext={next} />}
            {screen === 'match' && <Match t={t.match} onNext={next} />}
            {screen === 'fallback' && <Fallback t={t.fallback} onNext={next} />}
            {screen === 'plan' && <Plan t={t.plan} onNext={() => { const share = PLAYLIST.findIndex((s) => s.id === 'share'); go(share >= 0 ? share : index + 1) }} />}
            {screen === 'share' && <Share t={t.share} sharing={sharing} setSharing={setSharing} onNext={next} />}
            {screen === 'updates' && <Updates t={t.updates} playing={playing} fast={step.fast} />}
          </main>
        </div>
      </div>
    )
  } else if (step.kind === 'wide') {
    body = (
      <div className="wide-layout">
        <Story story={story} t={t} compact />
        <main className="desk" ref={mainRef} tabIndex={-1}>
          <Navigator t={t.navigator} label={t.label} langButton={langButton} sharing={sharing} followedUp={followedUp} setFollowedUp={setFollowedUp} />
        </main>
      </div>
    )
  } else {
    body = (
      <main className="diagram" ref={mainRef} tabIndex={-1}>
        <h1 className="sr-only">{t.architecture.heading}</h1>
        <img src="./architecture.svg" alt={t.architecture.alt} width="1500" height="800" />
      </main>
    )
  }

  return (
    <div className={wide ? 'viewport' : 'mobile'}>
      <div className="stage" style={wide ? { transform: `translate(-50%, -50%) scale(${scale})` } : undefined}>
        {body}
      </div>
      {!playing && (
        <nav className={controlsIdle ? 'controls idle' : 'controls'} aria-label={t.controls.name}>
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0}>{t.controls.back}</button>
          <span className="counter">{t.controls.step} {index + 1} {t.controls.of} {PLAYLIST.length}</span>
          <button type="button" onClick={next} disabled={index === PLAYLIST.length - 1}>{t.controls.next}</button>
          {wide && <button type="button" className="primary" onClick={() => setPlaying(true)}>{t.controls.play}</button>}
          {wide && <button type="button" onClick={restart}>{t.controls.restart}</button>}
        </nav>
      )}
      {playing && <button type="button" className="sr-only sr-focusable" onClick={() => setPlaying(false)}>{t.controls.pause}</button>}
    </div>
  )
}

function Story({ story, t, compact }) {
  return (
    <aside className={compact ? 'story compact' : 'story'}>
      <p className="eyebrow">{t.barrier}</p>
      <p className="barrier">{story.barrier}</p>
      <p className="eyebrow enabler-label">{t.enabler}</p>
      <p className="enabler">{story.enabler}</p>
    </aside>
  )
}

function Dots() {
  return (
    <svg className="dots" viewBox="0 0 520 60" aria-hidden="true">
      <path d="M12 42 C 90 4, 150 4, 200 30 S 320 58, 380 26 S 470 10, 508 20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
      {[[12, 42], [200, 30], [380, 26], [508, 20]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="9" fill="currentColor" />)}
    </svg>
  )
}
