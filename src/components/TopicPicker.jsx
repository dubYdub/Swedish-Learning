import { DIFFICULTY, estimateReadMinutes } from '../data/articles'
import './TopicPicker.css'

export default function TopicPicker({ topics, onSelect, date }) {
  const dateDisplay = new Date(date + 'T12:00:00').toLocaleDateString('sv-SE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="topic-picker">
      <div className="tp-intro">
        <p className="tp-date-label">{dateDisplay}</p>
        <h2 className="tp-heading">Vad vill du läsa om idag?</h2>
        <p className="tp-sub">Välj ett ämne för att börja din dagliga läsning.</p>
      </div>

      <div className="tp-grid">
        {topics.map(article => {
          const diff = DIFFICULTY[article.difficulty]
          return (
            <button key={article.id} className="tp-card" onClick={() => onSelect(article)}>
              <span className="tp-emoji">{article.topicEmoji}</span>
              <span className="tp-topic">{article.topicLabel}</span>
              <h3 className="tp-title">{article.title}</h3>
              <p className="tp-summary">{article.summary}</p>
              <div className="tp-footer">
                <span className="tp-diff" style={{ color: diff.color }}>
                  {diff.emoji} {article.difficulty} — {diff.label}
                </span>
                <span className="tp-time">{estimateReadMinutes(article)} min</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
