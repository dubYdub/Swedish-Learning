import { useState } from 'react'
import { readings } from '../data/readings'
import { loadReadingProgress, saveReadingProgress } from '../utils/storage'
import './Reading.css'

export default function Reading() {
  const [progress, setProgress] = useState(() => loadReadingProgress())
  const [selectedId, setSelectedId]   = useState(readings[0].id)
  const [revealAll, setRevealAll]     = useState(false)
  const [revealedLines, setRevealed]  = useState(new Set())
  const [showVocab, setShowVocab]     = useState(false)

  const text = readings.find(r => r.id === selectedId)

  function selectText(id) {
    setSelectedId(id)
    setRevealAll(false)
    setRevealed(new Set())
    setShowVocab(false)
  }

  function toggleLine(i) {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function markComplete() {
    const updated = { ...progress, [text.id]: { completed: true, completedAt: Date.now() } }
    setProgress(updated)
    saveReadingProgress(updated)
  }

  const isCompleted = progress[text.id]?.completed

  function speak(sentence) {
    if (!window.speechSynthesis) return
    const utt = new SpeechSynthesisUtterance(sentence)
    utt.lang = 'sv-SE'
    utt.rate = 0.8
    window.speechSynthesis.speak(utt)
  }

  return (
    <div className="reading">
      <div className="rd-list">
        {readings.map(r => (
          <button
            key={r.id}
            className={`rd-list-item ${r.id === selectedId ? 'active' : ''} ${progress[r.id]?.completed ? 'done' : ''}`}
            onClick={() => selectText(r.id)}
          >
            <span className="rd-title">{r.title}</span>
            <span className="rd-meta">
              <span className="rd-level">{r.level}</span>
              {progress[r.id]?.completed && <span className="rd-done-badge">✓</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="card rd-text-card">
        <div className="rd-text-header">
          <div>
            <h2 className="rd-text-title">{text.title}</h2>
            <p className="rd-text-subtitle">{text.titleEn} · {text.level}</p>
          </div>
          <div className="rd-text-actions">
            <button className="btn btn-secondary" onClick={() => setRevealAll(v => !v)}>
              {revealAll ? 'Hide translations' : 'Show all'}
            </button>
          </div>
        </div>

        <div className="rd-paragraphs">
          {text.paragraphs.map((p, i) => (
            <div key={i} className="rd-paragraph">
              <div className="rd-sv-line">
                <button
                  className="speak-btn"
                  title="Listen"
                  onClick={() => speak(p.sv)}
                >🔊</button>
                <span className="rd-sv">{p.sv}</span>
                <button
                  className="rd-toggle-btn"
                  onClick={() => toggleLine(i)}
                >
                  {revealedLines.has(i) ? '▲' : '▼'}
                </button>
              </div>
              {(revealAll || revealedLines.has(i)) && (
                <p className="rd-en">{p.en}</p>
              )}
            </div>
          ))}
        </div>

        <div className="rd-vocab-section">
          <button className="btn btn-secondary" onClick={() => setShowVocab(v => !v)}>
            {showVocab ? 'Hide vocabulary' : 'Show vocabulary'}
          </button>
          {showVocab && (
            <table className="rd-vocab-table">
              <thead><tr><th>Swedish</th><th>English</th></tr></thead>
              <tbody>
                {text.vocabulary.map((v, i) => (
                  <tr key={i}>
                    <td><strong>{v.sv}</strong></td>
                    <td>{v.en}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isCompleted ? (
          <button className="btn btn-primary rd-complete-btn" onClick={markComplete}>
            Mark as completed ✓
          </button>
        ) : (
          <p className="rd-completed-msg">Completed ✓</p>
        )}
      </div>
    </div>
  )
}
