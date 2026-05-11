import { useState, useMemo } from 'react'
import { grammarExercises } from '../data/grammar'
import { loadGrammarProgress, saveGrammarProgress } from '../utils/storage'
import './Grammar.css'

const CATEGORIES = ['all', ...new Set(grammarExercises.map(e => e.category))]

export default function Grammar() {
  const [progress, setProgress]     = useState(() => loadGrammarProgress())
  const [category, setCategory]     = useState('all')
  const [index, setIndex]           = useState(0)
  const [input, setInput]           = useState('')
  const [selected, setSelected]     = useState(null)
  const [checked, setChecked]       = useState(false)
  const [sessionStats, setStats]    = useState({ correct: 0, total: 0 })

  const exercises = useMemo(() => (
    category === 'all' ? grammarExercises : grammarExercises.filter(e => e.category === category)
  ), [category])

  const ex = exercises[index % exercises.length]

  const userAnswer = ex.type === 'fill-blank' ? input.trim().toLowerCase() : selected
  const correctAnswer = ex.answer.toLowerCase()
  const isCorrect = userAnswer === correctAnswer

  function submit() {
    if (!userAnswer) return
    setChecked(true)
    const updated = {
      ...progress,
      [ex.id]: {
        attempts: (progress[ex.id]?.attempts || 0) + 1,
        correct:  (progress[ex.id]?.correct  || 0) + (isCorrect ? 1 : 0),
      },
    }
    setProgress(updated)
    saveGrammarProgress(updated)
    setStats(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIndex(i => i + 1)
    setInput('')
    setSelected(null)
    setChecked(false)
  }

  function changeCategory(c) {
    setCategory(c)
    setIndex(0)
    setInput('')
    setSelected(null)
    setChecked(false)
  }

  return (
    <div className="grammar">
      <div className="gr-controls">
        <div className="fc-control-group">
          <label>Category</label>
          <select value={category} onChange={e => changeCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="session-badge">
          {sessionStats.total > 0 && `${sessionStats.correct}/${sessionStats.total} correct`}
        </div>
      </div>

      <div className="gr-progress-bar">
        <div className="gr-progress-fill" style={{ width: `${((index % exercises.length) / exercises.length) * 100}%` }} />
      </div>

      <div className="card gr-card">
        <div className="gr-category-tag">{ex.category.replace('-', ' ')}</div>
        <p className="gr-question">{ex.question}</p>

        {ex.type === 'multiple-choice' && (
          <div className="gr-options">
            {ex.options.map(opt => {
              let cls = 'gr-option'
              if (checked) {
                if (opt.toLowerCase() === correctAnswer) cls += ' correct'
                else if (opt === selected) cls += ' wrong'
              } else if (opt === selected) {
                cls += ' selected'
              }
              return (
                <button
                  key={opt}
                  className={cls}
                  onClick={() => !checked && setSelected(opt)}
                  disabled={checked}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {ex.type === 'fill-blank' && (
          <div className="gr-fill">
            {ex.hint && <p className="gr-hint">Hint: {ex.hint}</p>}
            <input
              className={`gr-input ${checked ? (isCorrect ? 'correct' : 'wrong') : ''}`}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !checked) submit() }}
              disabled={checked}
              placeholder="Type your answer…"
              autoFocus
            />
          </div>
        )}

        {!checked && (
          <button
            className="btn btn-primary gr-submit"
            onClick={submit}
            disabled={!userAnswer}
          >
            Check
          </button>
        )}

        {checked && (
          <div className={`gr-feedback ${isCorrect ? 'gr-correct' : 'gr-wrong'}`}>
            <strong>{isCorrect ? 'Correct!' : `Wrong — the answer is: ${ex.answer}`}</strong>
            <p>{ex.explanation}</p>
            <button className="btn btn-secondary" onClick={next}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
