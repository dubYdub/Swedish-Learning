import { useState, useEffect } from 'react'
import * as srs from '../utils/srs'
import * as tts from '../utils/tts'
import './Flashcards.css'

const CORRECT_MSGS = [
  ['🌱', 'Växer i minnet!'],
  ['🎯', 'Pricksäkert!'],
  ['✨', 'Snyggt jobbat!'],
  ['🔥', 'Du är på eld!'],
  ['💪', 'Muskelminne aktiverat!'],
  ['🧠', 'Hjärnan gillar det här!'],
  ['⚡', 'Blixtsnabbt!'],
  ['🎉', 'Ja precis, det var det!'],
]
const CORRECT_MAX = ['🏆', 'Helt memorerat — legendariskt!']
const WRONG_MSGS = [
  ['🙈', 'Hoppsan — snart sitter det!'],
  ['😅', 'Ingen fara, öva igen!'],
  ['💡', 'Tips: kolla minnestipset!'],
  ['🤔', 'Hmm, svår den — försök igen!'],
  ['🎲', 'Nästa gång lyckas det!'],
  ['🌧️', 'Liten motgång, stor framgång!'],
]

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

function FeedbackPips({ oldLevel, newLevel, correct }) {
  return (
    <div className="fc-pips fc-pips-md">
      {[1,2,3,4,5].map(i => {
        const isOn  = i <= newLevel
        const isNew = correct  && i === newLevel && newLevel > oldLevel
        const wasOn = !correct && i === oldLevel && newLevel < oldLevel
        return (
          <span
            key={i}
            className={[
              'fc-pip',
              isOn  ? 'on'        : '',
              newLevel >= srs.MAX_LEVEL ? 'memorized' : '',
              isNew ? 'pip-gained' : '',
              wasOn ? 'pip-lost'   : '',
            ].filter(Boolean).join(' ')}
          />
        )
      })}
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
    const oldLevel = card.level ?? 0
    const changes  = srs.advance(card, correct)
    onAnswer(card.id, correct)

    const msgs = correct ? CORRECT_MSGS : WRONG_MSGS
    const [emoji, message] = (correct && changes.level >= srs.MAX_LEVEL)
      ? CORRECT_MAX
      : msgs[(typeof card.id === 'number' ? card.id : 0) % msgs.length]

    const newStats = { correct: stats.correct + (correct ? 1 : 0), wrong: stats.wrong + (correct ? 0 : 1) }
    setStats(newStats)
    setFeedback({ correct, newLevel: changes.level, oldLevel, interval: srs.INTERVALS[changes.level], emoji, message })
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
        <button className="fc-exit-btn" onClick={() => onDone(stats, total)}>← Avsluta</button>
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

      </div>
      </div>{/* /fc-card-wrap */}

      {/* Feedback — below the card */}
      {feedback && (
        <div className={`fc-feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
          <span className="fc-fb-emoji">{feedback.emoji}</span>
          <p className="fc-fb-msg">{feedback.message}</p>
          <div className="fc-fb-level-row">
            <FeedbackPips oldLevel={feedback.oldLevel} newLevel={feedback.newLevel} correct={feedback.correct} />
            <span className="fc-fb-level-name">{srs.LABELS[feedback.newLevel]}</span>
            <span className={`fc-fb-delta ${feedback.correct ? 'up' : 'down'}`}>
              {feedback.correct && feedback.newLevel > feedback.oldLevel ? '+1' : feedback.correct ? '✓' : '−1'}
            </span>
          </div>
        </div>
      )}

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
  // Snapshot due cards once at mount so vocab updates from onAnswer
  // don't prematurely unmount the session mid-review.
  const [initialDeck] = useState(() => vocab.filter(srs.isDue))
  const [screen, setScreen] = useState('session')
  const [doneStats, setDoneStats] = useState(null)

  if (screen === 'session' && initialDeck.length > 0) {
    return (
      <Session
        initialDeck={initialDeck}
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
        onRestart={() => setScreen('session')}
        onExit={onExit}
      />
    )
  }

  return (
    <div className="fc-noduetoday">
      <p className="fc-noduetoday-msg">Allt klart för idag ✓</p>
      <button className="fc-action-btn ghost" onClick={onExit}>← Ordlistan</button>
    </div>
  )
}
