import { loadCardProgress, loadGrammarProgress, loadReadingProgress } from '../utils/storage'
import { vocabulary } from '../data/vocabulary'
import { grammarExercises } from '../data/grammar'
import { readings } from '../data/readings'
import { isDue } from '../utils/sm2'
import './Stats.css'

export default function Stats() {
  const cards   = loadCardProgress()
  const grammar = loadGrammarProgress()
  const reading = loadReadingProgress()

  const totalCards    = vocabulary.length
  const studiedCards  = Object.keys(cards).length
  const dueCards      = vocabulary.filter(w => isDue(cards[w.id] || {})).length
  const masteredCards = Object.values(cards).filter(c => c.repetitions >= 3).length

  const grammarAttempts = Object.values(grammar).reduce((s, v) => s + (v.attempts || 0), 0)
  const grammarCorrect  = Object.values(grammar).reduce((s, v) => s + (v.correct  || 0), 0)
  const grammarRate     = grammarAttempts > 0 ? Math.round((grammarCorrect / grammarAttempts) * 100) : 0

  const completedReadings = Object.values(reading).filter(r => r.completed).length

  const categoryBreakdown = [...new Set(vocabulary.map(w => w.category))].map(cat => {
    const catWords = vocabulary.filter(w => w.category === cat)
    const studied  = catWords.filter(w => cards[w.id]).length
    return { cat, total: catWords.length, studied }
  })

  return (
    <div className="stats">
      <h2 className="section-title">Your Progress</h2>

      <div className="stats-grid">
        <StatCard label="Cards Studied"  value={studiedCards}  total={totalCards}   color="#006aa7" />
        <StatCard label="Mastered"       value={masteredCards} total={totalCards}   color="#22c55e" />
        <StatCard label="Due for Review" value={dueCards}      total={totalCards}   color="#f59e0b" nobar />
        <StatCard label="Grammar Accuracy" value={`${grammarRate}%`} sub={`${grammarAttempts} attempts`} color="#8b5cf6" nobar />
        <StatCard label="Readings Done"  value={completedReadings} total={readings.length} color="#ec4899" />
      </div>

      <h3 className="stats-section-label">Vocabulary by Category</h3>
      <div className="stats-categories">
        {categoryBreakdown.map(({ cat, total, studied }) => (
          <div key={cat} className="stats-cat-row">
            <span className="stats-cat-name">{cat}</span>
            <div className="stats-cat-bar-wrap">
              <div className="stats-cat-bar" style={{ width: `${(studied / total) * 100}%` }} />
            </div>
            <span className="stats-cat-count">{studied}/{total}</span>
          </div>
        ))}
      </div>

      {grammarAttempts > 0 && (
        <>
          <h3 className="stats-section-label">Grammar by Category</h3>
          <div className="stats-categories">
            {[...new Set(grammarExercises.map(e => e.category))].map(cat => {
              const exs = grammarExercises.filter(e => e.category === cat)
              const att = exs.reduce((s, e) => s + (grammar[e.id]?.attempts || 0), 0)
              const cor = exs.reduce((s, e) => s + (grammar[e.id]?.correct  || 0), 0)
              const rate = att > 0 ? Math.round((cor / att) * 100) : null
              return (
                <div key={cat} className="stats-cat-row">
                  <span className="stats-cat-name">{cat.replace('-', ' ')}</span>
                  <div className="stats-cat-bar-wrap">
                    {rate !== null && <div className="stats-cat-bar" style={{ width: `${rate}%`, background: '#8b5cf6' }} />}
                  </div>
                  <span className="stats-cat-count">{rate !== null ? `${rate}%` : '—'}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, total, sub, color, nobar }) {
  const pct = total != null ? Math.round((Number(value) / total) * 100) : null
  return (
    <div className="stat-card card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ color }}>{value}</p>
      {total != null && <p className="stat-sub">of {total}</p>}
      {sub && <p className="stat-sub">{sub}</p>}
      {!nobar && pct != null && (
        <div className="stat-bar">
          <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  )
}
