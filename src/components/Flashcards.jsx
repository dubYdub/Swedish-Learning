import { useState, useMemo, useEffect } from 'react'
import * as srs from '../utils/srs'
import * as tts from '../utils/tts'
import './Flashcards.css'

// ── Shared sub-components ────────────────────────────────────────────────────

function Pips({ level, size = 'md' }) {
  return (
    <div className={`fc-pips fc-pips-${size}`}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          className={`fc-pip ${i <= level ? 'on' : ''} ${level >= srs.MAX_LEVEL ? 'memorized' : ''}`}
        />
      ))}
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ vocab, dueCount, onStart, onExit }) {
  const counts = useMemo(() => {
    const c = Array(6).fill(0)
    vocab.forEach(v => c[Math.min(5, v.level ?? 0)]++)
    return c
  }, [vocab])

  return (
    <div className="fc-dashboard">
      <div className="fc-dash-top">
        <button className="fc-back" onClick={onExit}>← Ordlistan</button>
        <span className="fc-dash-label">FLASHCARDS</span>
      </div>

      <div className="fc-due-hero">
        <span className="fc-due-num">{dueCount}</span>
        <span className="fc-due-sub">ord att öva idag</span>
      </div>

      {/* Level distribution */}
      <div className="fc-dist">
        <p className="fc-dist-title">Nivåfördelning</p>
        <div className="fc-dist-stack">
          {vocab.length === 0
            ? <div className="fc-dist-seg level-0" style={{ flex: 1 }} />
            : [0,1,2,3,4,5].map(l => counts[l] > 0 && (
              <div
                key={l}
                className={`fc-dist-seg level-${l}`}
                style={{ flex: counts[l] }}
                title={`${srs.LABELS[l]}: ${counts[l]} ord`}
              />
            ))
          }
        </div>
        <div className="fc-dist-legend">
          {[0,1,2,3,4,5].map(l => (
            <div key={l} className={`fc-dist-litem ${counts[l] === 0 ? 'empty' : ''}`}>
              <span className={`fc-dist-dot level-${l}`} />
              <span className="fc-dist-lcount">{counts[l]}</span>
              <span className="fc-dist-lname">{srs.LABELS[l]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="fc-dash-actions">
        <button className="fc-action-btn ghost" onClick={onExit}>← Tillbaka</button>
        <button
          className="fc-action-btn primary"
          onClick={onStart}
          disabled={dueCount === 0}
        >
          {dueCount === 0 ? 'Allt klart för idag ✓' : `Öva ${dueCount} ord →`}
        </button>
      </div>
    </div>
  )
}

// ── Session ──────────────────────────────────────────────────────────────────

function Session({ initialDeck, onAnswer, onDone }) {
  const total = initialDeck.length
  const [deck, setDeck]     = useState(() => initialDeck.map(e => ({ ...e })))
  const [idx, setIdx]       = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [feedback, setFeedback] = useState(null)  // { correct, newLevel }
  const [stats, setStats]   = useState({ correct: 0, wrong: 0 })
  const [shaking, setShaking] = useState(false)

  const card = deck[idx]
  const seen = total - deck.length

  // Speak the word whenever a new card appears
  useEffect(() => {
    if (card) tts.speak(card.word, { rate: 0.8 })
    return () => tts.stop()
  }, [card?.id])

  function speakWord(e) {
    e.stopPropagation()
    tts.speak(card.word, { rate: 0.8 })
  }

  function answer(correct) {
    if (feedback) return
    const changes = srs.advance(card, correct)
    onAnswer(card.id, correct)

    const newStats = { correct: stats.correct + (correct ? 1 : 0), wrong: stats.wrong + (correct ? 0 : 1) }
    setStats(newStats)
    setFeedback({ correct, newLevel: changes.level, interval: srs.INTERVALS[changes.level] })
    if (!correct) { setShaking(true); setTimeout(() => setShaking(false), 600) }

    setTimeout(() => {
      setFeedback(null)
      setFlipped(false)
      setDeck(prev => {
        const next = [...prev]
        if (!correct) {
          // Re-queue 3 positions later at downgraded level
          const [removed] = next.splice(idx, 1)
          const insertAt = Math.min(idx + 3, next.length)
          next.splice(insertAt, 0, { ...removed, level: changes.level })
          if (idx >= next.length) setIdx(0)
        } else {
          next.splice(idx, 1)
          if (next.length === 0) { onDone(newStats, total); return prev }
          if (idx >= next.length) setIdx(next.length - 1)
        }
        return next
      })
    }, 900)
  }

  if (!card) return null

  const progressPct = total > 0 ? (seen / total) * 100 : 0

  return (
    <div className="fc-session">
      {/* Progress header */}
      <div className="fc-sess-header">
        <button className="fc-back" onClick={() => onDone(stats, total)}>✕</button>
        <div className="fc-prog-wrap">
          <div className="fc-prog-bar">
            <div className="fc-prog-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="fc-prog-meta">
            <span className="fc-prog-count">{seen} / {total}</span>
            <span className="fc-prog-right">✓ {stats.correct}</span>
            <span className="fc-prog-wrong">✗ {stats.wrong}</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div key={card.id} className={`fc-card-wrap${shaking ? ' shaking' : ''}`}>
      <div
        className={`fc-card ${flipped ? 'flipped' : ''} ${feedback ? 'no-click' : ''}`}
        onClick={() => { if (!flipped && !feedback) { tts.speak(card.word, { rate: 0.8 }); setFlipped(true) } }}
      >
        <div className="fc-card-inner">
          {/* Front */}
          <div className="fc-card-front">
            <div className="fc-card-meta">
              <Pips level={card.level ?? 0} />
              <span className="fc-level-label">{srs.LABELS[card.level ?? 0]}</span>
            </div>
            <button className="fc-speak-btn" onClick={speakWord} title="Lyssna igen">🔊</button>
            <p className="fc-word">{card.word}</p>
            <span className="fc-flip-hint">klicka för att avslöja</span>
          </div>
          {/* Back */}
          <div className="fc-card-back">
            <div className="fc-card-meta">
              <Pips level={card.level ?? 0} />
              <span className="fc-level-label">{srs.LABELS[card.level ?? 0]}</span>
            </div>
            <p className="fc-word fc-word-sm">{card.word}</p>
            <div className="fc-rule" />
            <p className="fc-def">{card.context || '—'}</p>
            {card.mnemonic && <p className="fc-mnemonic">{card.mnemonic}</p>}
          </div>
        </div>

        {/* Feedback overlay */}
        {feedback && (
          <div className={`fc-feedback-overlay ${feedback.correct ? 'correct' : 'wrong'}`}>
            {feedback.correct ? (
              <div className="fc-fb-inner">
                <span className="fc-fb-icon">✓</span>
                <Pips level={feedback.newLevel} size="sm" />
                <span className="fc-fb-text">
                  {feedback.newLevel >= srs.MAX_LEVEL
                    ? 'Memorerad!'
                    : `Nästa om ${feedback.interval} dag${feedback.interval > 1 ? 'ar' : ''}`}
                </span>
              </div>
            ) : (
              <div className="fc-fb-inner">
                <span className="fc-fb-icon">✗</span>
                <Pips level={feedback.newLevel} size="sm" />
                <span className="fc-fb-text">Öva igen snart</span>
              </div>
            )}
          </div>
        )}
      </div>
      </div>{/* /fc-card-wrap */}

      {/* Answer buttons */}
      {flipped && !feedback && (
        <div className="fc-answers visible">
          <button className="fc-answer-btn fail" onClick={() => answer(false)}>
            <span className="fc-ans-icon">✗</span>
            <span>Glömt</span>
          </button>
          <button className="fc-answer-btn pass" onClick={() => answer(true)}>
            <span className="fc-ans-icon">✓</span>
            <span>Kan det!</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Done ─────────────────────────────────────────────────────────────────────

function Done({ stats, total, onRestart, onExit }) {
  const pct = total > 0 ? Math.round((stats.correct / total) * 100) : 0
  return (
    <div className="fc-done">
      <p className="fc-done-eyebrow">Session klar</p>
      <h2 className="fc-done-score">{stats.correct}<span>/{total}</span></h2>
      <p className="fc-done-pct">{pct}% rätt</p>
      <p className="fc-done-msg">
        {pct === 100 ? 'Perfekt! Alla ord klara.'
          : pct >= 70 ? 'Bra jobbat! Fortsätt så.'
          : 'Öva lite till — du klarar det!'}
      </p>
      <div className="fc-done-actions">
        <button className="fc-action-btn ghost"   onClick={onExit}>← Ordlistan</button>
        <button className="fc-action-btn primary" onClick={onRestart}>Kör igen</button>
      </div>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function Flashcards({ vocab, onAnswer, onExit }) {
  const dueCards = useMemo(() => vocab.filter(srs.isDue), [vocab])
  const [screen, setScreen]   = useState('dashboard')
  const [doneStats, setDoneStats] = useState(null)

  if (screen === 'session' && dueCards.length > 0) {
    return (
      <Session
        initialDeck={dueCards}
        onAnswer={onAnswer}
        onDone={(stats, total) => { setDoneStats({ stats, total }); setScreen('done') }}
      />
    )
  }

  if (screen === 'done' && doneStats) {
    return (
      <Done
        stats={doneStats.stats}
        total={doneStats.total}
        onRestart={() => setScreen('dashboard')}
        onExit={onExit}
      />
    )
  }

  return (
    <Dashboard
      vocab={vocab}
      dueCount={dueCards.length}
      onStart={() => setScreen('session')}
      onExit={onExit}
    />
  )
}
