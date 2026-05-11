import './DateHistory.css'

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('sv-SE', {
    month: 'short', day: 'numeric',
  })
}

function calcStreak(history, today) {
  if (!history.find(h => h.date === today)) return 0
  let streak = 1
  let d = new Date(today + 'T12:00:00')
  while (true) {
    d.setDate(d.getDate() - 1)
    const key = d.toISOString().slice(0, 10)
    if (history.find(h => h.date === key)) streak++
    else break
  }
  return streak
}

export default function DateHistory({ history, today, viewingDate, onSelectEntry, onToday }) {
  const todayEntry = history.find(h => h.date === today)
  const past = [...history]
    .filter(h => h.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))
  const streak = calcStreak(history, today)

  return (
    <div className="date-history">
      <div className="dh-header">
        <p className="dh-label">Historik</p>
        {streak >= 2 && (
          <div className="dh-streak">
            <span>🔥</span>
            <span>{streak} dagar</span>
          </div>
        )}
      </div>

      {/* Today */}
      <button
        className={`dh-entry dh-today ${!viewingDate ? 'active' : ''}`}
        onClick={onToday}
      >
        <span className="dh-entry-day">Idag</span>
        <span className="dh-entry-title">
          {todayEntry ? todayEntry.title : 'Välj artikel →'}
        </span>
      </button>

      {/* Past entries */}
      {past.length > 0 && (
        <div className="dh-list">
          {past.map(entry => (
            <button
              key={entry.date}
              className={`dh-entry ${viewingDate === entry.date ? 'active' : ''}`}
              onClick={() => onSelectEntry(entry)}
            >
              <span className="dh-entry-day">{formatDate(entry.date)}</span>
              <span className="dh-entry-title">{entry.title}</span>
            </button>
          ))}
        </div>
      )}

      {past.length === 0 && !todayEntry && (
        <p className="dh-empty">Din studiehistorik visas här.</p>
      )}

      <div className="dh-footer">
        <span>{history.length} {history.length === 1 ? 'dag' : 'dagar'} studerat</span>
      </div>
    </div>
  )
}
