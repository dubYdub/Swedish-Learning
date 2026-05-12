import { useState, useMemo } from 'react'
import './Flashcards.css'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Flashcards({ vocab, onExit }) {
  const initial = useMemo(() => shuffle(vocab), [vocab])
  const [deck, setDeck]     = useState(initial)
  const [idx, setIdx]       = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown]   = useState(0)
  const [done, setDone]     = useState(false)
  const total = initial.length

  const card = deck[idx]

  function answer(didKnow) {
    const nextKnown = known + (didKnow ? 1 : 0)
    if (idx + 1 >= deck.length) {
      setKnown(nextKnown)
      setDone(true)
      return
    }
    setKnown(nextKnown)
    setIdx(i => i + 1)
    setFlipped(false)
  }

  function restart() {
    setDeck(shuffle(vocab))
    setIdx(0)
    setFlipped(false)
    setKnown(0)
    setDone(false)
  }

  if (done) {
    const pct = Math.round((known / total) * 100)
    return (
      <div className="fc-done">
        <p className="fc-done-eyebrow">Omgång klar</p>
        <h2 className="fc-done-score">{known}<span>/{total}</span></h2>
        <p className="fc-done-pct">{pct}% rätt</p>
        <p className="fc-done-msg">
          {pct === 100 ? 'Perfekt! Alla ord klara.' : pct >= 70 ? 'Bra jobbat! Fortsätt så.' : 'Öva lite till — du klarar det!'}
        </p>
        <div className="fc-done-actions">
          <button className="fc-action-btn ghost" onClick={onExit}>← Ordlistan</button>
          <button className="fc-action-btn primary" onClick={restart}>Kör igen</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flashcards">
      {/* Header */}
      <div className="fc-header">
        <button className="fc-back" onClick={onExit}>← Ordlistan</button>
        <div className="fc-progress-wrap">
          <div className="fc-progress-bar">
            <div className="fc-progress-fill" style={{ width: `${(idx / total) * 100}%` }} />
          </div>
          <span className="fc-progress-label">{idx + 1} / {total}</span>
        </div>
        <span className="fc-known-count">{known} ✓</span>
      </div>

      {/* Card */}
      <div
        className={`fc-card ${flipped ? 'flipped' : ''}`}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div className="fc-card-inner">
          {/* Front */}
          <div className="fc-card-front">
            <span className="fc-lang-tag">Svenska</span>
            <p className="fc-word">{card.word}</p>
            <span className="fc-flip-hint">Klicka för att avslöja →</span>
          </div>
          {/* Back */}
          <div className="fc-card-back">
            <span className="fc-lang-tag">English</span>
            <p className="fc-def">{card.context}</p>
            <p className="fc-word-small">{card.word}</p>
          </div>
        </div>
      </div>

      {/* Answer buttons — only after flip */}
      <div className={`fc-answers ${flipped ? 'visible' : ''}`}>
        <button className="fc-answer-btn fail" onClick={() => answer(false)}>
          <span className="fc-answer-icon">✗</span>
          <span>Visste inte</span>
        </button>
        <button className="fc-answer-btn pass" onClick={() => answer(true)}>
          <span className="fc-answer-icon">✓</span>
          <span>Kan det!</span>
        </button>
      </div>
    </div>
  )
}
