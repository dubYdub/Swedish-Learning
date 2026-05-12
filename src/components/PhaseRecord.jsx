import { useState, useEffect, useCallback } from 'react'
import Recorder from './Recorder'
import WaveformPlayer from './WaveformPlayer'
import * as tts from '../utils/tts'
import * as db from '../utils/db'
import { setRecordingCount } from '../utils/progress'
import { formatDuration } from '../utils/recorder'
import './PhaseRecord.css'

export default function PhaseRecord({ article, updateProgress, isDone, onMarkDone }) {
  const [recordings, setRecordings]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [compareIds, setCompareIds]   = useState([])
  const [playingOriginal, setPlayingOriginal] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await db.listRecordings(article.id)
      setRecordings(list)
      updateProgress(prev => setRecordingCount(prev, article.id, list.length))
    } catch (e) {
      console.error('Failed to load recordings', e)
    }
    setLoading(false)
  }, [article.id, updateProgress])

  useEffect(() => { refresh() }, [refresh])

  // Stop TTS on unmount
  useEffect(() => () => tts.stop(), [])

  async function handleSave({ blob, durationMs }) {
    await db.addRecording({ articleId: article.id, blob, durationMs })
    await refresh()
  }

  async function handleDelete(id) {
    if (!confirm('Ta bort den här inspelningen?')) return
    await db.deleteRecording(id)
    setCompareIds(ids => ids.filter(i => i !== id))
    await refresh()
  }

  function downloadRecording(rec) {
    const url = URL.createObjectURL(rec.blob)
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${article.id}-${rec.recordedAt.slice(0, 10)}.webm`,
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  function playOriginal() {
    if (playingOriginal) { tts.stop(); setPlayingOriginal(false); return }
    const fullText = article.content.map(p => p.text).join('  ')
    setPlayingOriginal(true)
    tts.speak(fullText, { onEnd: () => setPlayingOriginal(false) })
  }

  function toggleCompare(id) {
    setCompareIds(ids => {
      if (ids.includes(id)) return ids.filter(i => i !== id)
      if (ids.length >= 2) return [ids[1], id] // keep last 2
      return [...ids, id]
    })
  }

  const compareRecordings = compareIds
    .map(id => recordings.find(r => r.id === id))
    .filter(Boolean)

  return (
    <div className="phase-record">
      <div className="prc-intro">
        <h2 className="prc-intro-title">🎙️ Inspelning</h2>
        <p className="prc-intro-text">
          Spela in dig själv när du läser artikeln högt. Lyssna på originalet först om du vill,
          jämför sedan din inspelning med tidigare versioner för att se din utveckling över tid.
        </p>
      </div>

      {/* Original audio reference */}
      <div className="prc-original-row">
        <button
          className={`prc-original-btn ${playingOriginal ? 'active' : ''}`}
          onClick={playOriginal}
          title="Spela upp originalet via text-till-tal"
        >
          {playingOriginal ? '⏹ Stoppa original' : '▶ Lyssna på originalet'}
        </button>
        <span className="prc-original-hint">som referens innan du spelar in</span>
      </div>

      {/* Recorder */}
      <Recorder onSave={handleSave} />

      {/* Comparison view */}
      {compareRecordings.length === 2 && (
        <section className="prc-compare">
          <div className="prc-compare-header">
            <h3>Jämför inspelningar</h3>
            <button className="prc-compare-close" onClick={() => setCompareIds([])}>× Stäng</button>
          </div>
          {compareRecordings.map((rec, idx) => (
            <div key={rec.id} className="prc-compare-row">
              <div className="prc-compare-label">
                <span className="prc-compare-tag">{idx === 0 ? 'A' : 'B'}</span>
                <span>{new Date(rec.recordedAt).toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <WaveformPlayer blob={rec.blob} height={56} color={idx === 0 ? '#C25B5B' : '#5A7AA8'} />
            </div>
          ))}
        </section>
      )}

      {/* Recordings list */}
      <section className="prc-list-section">
        <div className="prc-list-header">
          <h3 className="prc-list-title">Dina inspelningar</h3>
          <span className="prc-list-count">{recordings.length} st</span>
        </div>

        {loading ? (
          <p className="prc-loading">Laddar…</p>
        ) : recordings.length === 0 ? (
          <p className="prc-empty">Inga inspelningar än. Tryck på "Spela in" ovan för att börja.</p>
        ) : (
          <div className="prc-list">
            {recordings.map((rec, idx) => {
              const isSelected = compareIds.includes(rec.id)
              return (
                <div key={rec.id} className={`prc-item ${isSelected ? 'selected' : ''}`}>
                  <div className="prc-item-header">
                    <div className="prc-item-meta">
                      <span className="prc-item-num">#{recordings.length - idx}</span>
                      <span className="prc-item-date">
                        {new Date(rec.recordedAt).toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span className="prc-item-duration">{formatDuration(rec.durationMs)}</span>
                    </div>
                    <div className="prc-item-actions">
                      <button
                        className={`prc-action-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleCompare(rec.id)}
                        title="Lägg till i jämförelse (max 2)"
                      >
                        {isSelected ? '✓ Jämför' : 'Jämför'}
                      </button>
                      <button
                        className="prc-action-btn"
                        onClick={() => downloadRecording(rec)}
                        title="Ladda ner som fil"
                      >↓</button>
                      <button
                        className="prc-action-btn prc-delete"
                        onClick={() => handleDelete(rec.id)}
                        title="Ta bort"
                      >×</button>
                    </div>
                  </div>
                  <WaveformPlayer blob={rec.blob} height={48} compact />
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className={`phase-done-bar ${isDone ? 'done' : ''}`}>
        <p>{isDone ? 'Inspelningsfasen markerad som klar.' : 'Klar med inspelningen?'}</p>
        <button className={`phase-done-btn ${isDone ? 'done' : ''}`} onClick={onMarkDone}>
          {isDone ? '✓ Klar' : 'Markera som klar'}
        </button>
      </div>
    </div>
  )
}
