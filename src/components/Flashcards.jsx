import { useState, useMemo, useCallback } from 'react'
import { vocabulary } from '../data/vocabulary'
import { sm2, isDue } from '../utils/sm2'
import { loadCardProgress, saveCardProgress } from '../utils/storage'
import './Flashcards.css'

const CATEGORIES = ['all', ...new Set(vocabulary.map(w => w.category))]

export default function Flashcards() {
  const [progress, setProgress] = useState(() => loadCardProgress())
  const [category, setCategory] = useState('all')
  const [direction, setDirection] = useState('sv→en')
  const [flipped, setFlipped] = useState(false)
  const [index, setIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })

  const deck = useMemo(() => {
    const filtered = category === 'all' ? vocabulary : vocabulary.filter(w => w.category === category)
    return filtered.filter(w => isDue(progress[w.id] || {}))
  }, [category, progress])

  const card = deck[index]

  const front = card ? (direction === 'sv→en' ? card.sv : card.en) : null
  const back  = card ? (direction === 'sv→en' ? card.en : card.sv) : null

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = direction === 'sv→en' ? 'sv-SE' : 'en-US'
    utt.rate = 0.85
    window.speechSynthesis.speak(utt)
  }, [direction])

  const rate = useCallback((quality) => {
    const updated = { ...progress }
    updated[card.id] = sm2(progress[card.id] || {}, quality)
    setProgress(updated)
    saveCardProgress(updated)
    setSessionStats(s => ({
      correct: s.correct + (quality >= 3 ? 1 : 0),
      total: s.total + 1,
    }))
    setFlipped(false)
    setIndex(i => (i + 1) % Math.max(deck.length, 1))
  }, [card, deck.length, progress])

  const allDone = deck.length === 0

  return (
    <div className="flashcards">
      <div className="fc-controls">
        <div className="fc-control-group">
          <label>Category</label>
          <select value={category} onChange={e => { setCategory(e.target.value); setIndex(0); setFlipped(false) }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="fc-control-group">
          <label>Direction</label>
          <select value={direction} onChange={e => { setDirection(e.target.value); setFlipped(false) }}>
            <option value="sv→en">Swedish → English</option>
            <option value="en→sv">English → Swedish</option>
          </select>
        </div>
        <div className="session-badge">
          {sessionStats.total > 0 && `${sessionStats.correct}/${sessionStats.total} correct`}
        </div>
      </div>

      {allDone ? (
        <div className="card fc-done">
          <div className="fc-done-icon">✓</div>
          <h2>All caught up!</h2>
          <p>No cards due right now. Come back later or change the category.</p>
          <p className="fc-due-count">{Object.keys(progress).length} cards reviewed total</p>
        </div>
      ) : (
        <>
          <div className="fc-progress-bar">
            <div className="fc-progress-bar-fill" style={{ width: `${((index) / deck.length) * 100}%` }} />
          </div>
          <p className="fc-counter">{index + 1} / {deck.length} due</p>

          <div className={`card fc-card ${flipped ? 'flipped' : ''}`} onClick={() => { setFlipped(f => !f); if (!flipped) speak(front) }}>
            <div className="fc-card-inner">
              <div className="fc-face fc-front">
                <span className="fc-lang-tag">{direction === 'sv→en' ? 'SV' : 'EN'}</span>
                <div className="fc-word">{front}</div>
                <p className="fc-hint">Click to reveal</p>
              </div>
              <div className="fc-face fc-back">
                <span className="fc-lang-tag">{direction === 'sv→en' ? 'EN' : 'SV'}</span>
                <div className="fc-word">{back}</div>
                <button
                  className="speak-btn"
                  onClick={e => { e.stopPropagation(); speak(direction === 'sv→en' ? card.sv : back) }}
                >
                  🔊
                </button>
              </div>
            </div>
          </div>

          {flipped && (
            <div className="fc-rating">
              <p>How well did you know it?</p>
              <div className="fc-rating-btns">
                <button className="btn btn-danger"  onClick={() => rate(1)}>Wrong</button>
                <button className="btn btn-warn"    onClick={() => rate(3)}>Hard</button>
                <button className="btn btn-success" onClick={() => rate(4)}>Good</button>
                <button className="btn btn-primary" onClick={() => rate(5)}>Easy</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
