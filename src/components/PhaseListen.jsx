import { useState, useEffect, useRef, useCallback } from 'react'
import * as tts from '../utils/tts'
import * as ap from '../utils/audioPlayer'
import * as ts from '../utils/timestamps'
import './PhaseListen.css'

function resolveAudioUrl(article) {
  return article.audioFile ? ap.audioFileUrl(article.audioFile) : null
}

function estimateTimestamps(content, duration) {
  const totalChars = content.reduce((s, p) => s + p.text.length, 0)
  let cursor = 0
  return content.map(p => {
    const start = cursor
    cursor += (p.text.length / totalChars) * duration
    return { id: p.id, start: parseFloat(start.toFixed(2)), end: parseFloat(cursor.toFixed(2)) }
  })
}

const TTS_RATES  = [
  { value: 0.65, label: 'Sakta' },
  { value: 0.82, label: 'Normal' },
  { value: 1.0,  label: 'Snabb' },
]
const FILE_RATES = [
  { value: 0.6,  label: 'Sakta' },
  { value: 0.85, label: 'Normal' },
  { value: 1.0,  label: 'Snabb' },
  { value: 1.25, label: 'Fort' },
]

function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s) % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function PhaseListen({ article, isDone, onMarkDone }) {
  const audioUrl = resolveAudioUrl(article)

  // ── Playback state ───────────────────────────────────────────────────────
  const [timestamps, setTimestamps]   = useState(null)
  const [playing, setPlaying]         = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [rate, setRate]               = useState(0.82)
  const [showText, setShowText]       = useState(false)
  const [playingId, setPlayingId]     = useState(null)
  const rafRef = useRef(null)

  // ── Editor state ─────────────────────────────────────────────────────────
  const [editMode, setEditMode]       = useState(false)
  const [draft, setDraft]             = useState(null)   // [{id, start, end}] working copy
  const [editingIdx, setEditingIdx]   = useState(null)   // paragraph index with active text input
  const [editVal, setEditVal]         = useState('')
  const [copied, setCopied]           = useState(false)
  const editInputRef = useRef(null)

  // ── Load timestamps: JSON file → localStorage → estimate ─────────────────
  useEffect(() => {
    if (!audioUrl) return
    let cancelled = false
    ap.loadSrc(audioUrl)
    ap.onDurationReady(d => {
      if (cancelled) return
      setDuration(d)
      ap.loadTimestamps(article.id).then(fileTs => {
        if (cancelled) return
        const local = ts.loadLocal(article.id)
        setTimestamps(fileTs ?? local ?? estimateTimestamps(article.content, d))
      })
    })
    return () => { cancelled = true }
  }, [article.id, audioUrl])

  useEffect(() => {
    return () => { tts.stop(); ap.stop(); cancelAnimationFrame(rafRef.current) }
  }, [article.id])

  // ── RAF for seek bar ─────────────────────────────────────────────────────
  const tickRaf = useCallback(() => {
    setCurrentTime(ap.getTime())
    const d = ap.getDuration()
    if (d > 0) setDuration(d)
    rafRef.current = requestAnimationFrame(tickRaf)
  }, [])

  function startRaf() { rafRef.current = requestAnimationFrame(tickRaf) }
  function stopRaf()  { cancelAnimationFrame(rafRef.current) }

  // ── Audio file controls ──────────────────────────────────────────────────
  function handleFilePlay() {
    if (playing) {
      ap.pause(); setPlaying(false); stopRaf()
    } else {
      ap.play(audioUrl, {
        rate,
        onTime: t => setCurrentTime(t),
        onEnd: () => { setPlaying(false); stopRaf(); setCurrentTime(0) },
      })
      setPlaying(true); startRaf()
    }
  }

  function handleSeek(e) {
    const t = Number(e.target.value)
    ap.seek(t); setCurrentTime(t)
    if (!playing) {
      ap.play(audioUrl, {
        rate,
        onTime: t2 => setCurrentTime(t2),
        onEnd: () => { setPlaying(false); stopRaf(); setCurrentTime(0) },
      })
      setPlaying(true); startRaf()
    }
  }

  function handleFileRate(r) { setRate(r); ap.setRate(r) }

  function seekToParagraph(idx) {
    if (!timestamps?.[idx]) return
    const { start, end } = timestamps[idx]
    stopRaf()
    ap.play(audioUrl, {
      start, end, rate,
      onTime: t => setCurrentTime(t),
      onEnd: () => { setPlaying(false); stopRaf() },
    })
    setCurrentTime(start); setPlaying(true); startRaf()
  }

  // ── TTS fallback controls ─────────────────────────────────────────────────
  function playAll() {
    if (playingId === 'all') { tts.stop(); setPlayingId(null); return }
    setPlayingId('all')
    tts.speak(article.content.map(p => p.text).join('  '), {
      rate, onEnd: () => setPlayingId(null),
    })
  }

  function playParagraph(para) {
    if (playingId === para.id) { tts.stop(); setPlayingId(null); return }
    setPlayingId(para.id)
    tts.speak(para.text, { rate, onEnd: () => setPlayingId(null) })
  }

  function changeTtsRate(r) {
    setRate(r)
    if (playingId) { tts.stop(); setPlayingId(null) }
  }

  const currentParaIdx = timestamps ? ap.findParagraphAtTime(timestamps, currentTime) : -1

  // ── Timestamp editor ──────────────────────────────────────────────────────
  function enterEditMode() {
    const d = article.content.map((p, i) => ({
      id: p.id,
      start: timestamps?.[i]?.start ?? null,
      end:   timestamps?.[i]?.end   ?? null,
    }))
    setDraft(d)
    setEditMode(true)
    setEditingIdx(null)
  }

  function exitEditMode() {
    setEditMode(false); setDraft(null); setEditingIdx(null)
  }

  function handleMark(idx) {
    const t = parseFloat(ap.getTime().toFixed(2))
    setDraft(prev => {
      const next = prev.map(x => ({ ...x }))
      next[idx].start = t
      if (idx > 0) next[idx - 1].end = t
      if (idx === next.length - 1 && duration > 0) next[idx].end = parseFloat(duration.toFixed(2))
      return next
    })
  }

  function handleSave() {
    const finalized = draft.map((item, i) => ({
      id:    item.id,
      start: item.start ?? 0,
      end:   item.end ?? (i < draft.length - 1 ? draft[i + 1].start ?? duration : duration),
    }))
    ts.saveLocal(article.id, finalized)
    setTimestamps(finalized)
    exitEditMode()
  }

  function handleClear() {
    ts.clearLocal(article.id)
    if (duration > 0) setTimestamps(estimateTimestamps(article.content, duration))
    exitEditMode()
  }

  function handleExport() {
    const json = JSON.stringify(draft.map(item => ({
      id: item.id,
      start: item.start ?? 0,
      end:   item.end   ?? 0,
    })), null, 2)
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function startInlineEdit(idx) {
    const t = draft[idx].start
    setEditingIdx(idx)
    setEditVal(t != null ? ts.fmtEdit(t) : '')
    setTimeout(() => editInputRef.current?.select(), 0)
  }

  function commitInlineEdit(idx) {
    const t = ts.parseTimeStr(editVal)
    if (t !== null) {
      setDraft(prev => {
        const next = prev.map(x => ({ ...x }))
        next[idx].start = t
        if (idx > 0) next[idx - 1].end = t
        return next
      })
    }
    setEditingIdx(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="phase-listen">
      <div className="pl-intro">
        <h2 className="pl-intro-title">🎧 Diktatläge</h2>
        <p className="pl-intro-text">
          Lyssna på artikeln och skriv ner det du hör på papper.
          Hoppar du över ett ord? Det är okej – fortsätt.
          {audioUrl ? ' Klicka på ett stycke för att hoppa dit.' : ' Kontrollera texten när du är klar.'}
        </p>
      </div>

      {/* Audio file player */}
      {audioUrl ? (
        <div className="pl-file-player">
          <div className="pl-file-top">
            <button className={`pl-play-btn ${playing ? 'active' : ''}`} onClick={handleFilePlay}>
              {playing ? '⏸ Pausa' : '▶ Spela'}
            </button>
            <span className="pl-file-badge">LJUDFIL</span>
          </div>
          <div className="pl-seek-row">
            <span className="pl-time">{fmtTime(currentTime)}</span>
            <input
              className="pl-seek" type="range"
              min={0} max={duration || 1} step={0.1} value={currentTime}
              onChange={handleSeek}
            />
            <span className="pl-time">{fmtTime(duration)}</span>
          </div>
          <div className="pl-rates">
            {FILE_RATES.map(r => (
              <button key={r.value}
                className={`pl-rate-btn ${rate === r.value ? 'active' : ''}`}
                onClick={() => handleFileRate(r.value)}
              >{r.label}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="pl-controls">
          <button className={`pl-play-btn ${playingId === 'all' ? 'active' : ''}`} onClick={playAll}>
            {playingId === 'all' ? '⏹ Stoppa' : '▶ Spela hela artikeln'}
          </button>
          <div className="pl-rates">
            {TTS_RATES.map(r => (
              <button key={r.value}
                className={`pl-rate-btn ${rate === r.value ? 'active' : ''}`}
                onClick={() => changeTtsRate(r.value)}
              >{r.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Text toggle + edit toggle */}
      <div className="pl-text-toggle-row">
        <button
          className={`pl-text-toggle ${showText ? 'active' : ''}`}
          onClick={() => setShowText(s => !s)}
        >
          {showText ? '👁 Dölj text' : '👁 Visa text'}
        </button>
        {audioUrl && !editMode && (
          <button className="pl-edit-toggle" onClick={enterEditMode}>
            ✏ Tidsstämplar
          </button>
        )}
      </div>

      {/* Editor bar — shown when in edit mode */}
      {editMode && (
        <div className="pl-edit-bar">
          <div className="pl-edit-hint">
            Spela upp och tryck <strong>Markera</strong> när varje stycke börjar.
            Klicka på en tid för att justera manuellt.
          </div>
          <div className="pl-edit-actions">
            <button className="pl-edit-btn ghost" onClick={handleClear}>Rensa</button>
            <button className="pl-edit-btn ghost" onClick={exitEditMode}>Avbryt</button>
            <button className={`pl-edit-btn export ${copied ? 'copied' : ''}`} onClick={handleExport}>
              {copied ? '✓ Kopierat!' : '↗ Exportera JSON'}
            </button>
            <button className="pl-edit-btn save" onClick={handleSave}>✓ Spara</button>
          </div>
        </div>
      )}

      {/* Paragraph list */}
      <div className="pl-sentences">
        <p className="pl-sentences-label">{editMode ? 'Markera stycken' : 'Stycken'}</p>
        <div className="pl-sentence-list">
          {article.content.map((para, idx) => {
            const isCurrent = audioUrl ? currentParaIdx === idx : playingId === para.id
            const draftItem = draft?.[idx]
            const isMarked  = draftItem?.start != null

            return (
              <div
                key={para.id}
                className={`pl-sentence ${isCurrent ? 'speaking' : ''} ${showText && !editMode ? 'revealed' : ''} ${editMode ? 'editing' : ''}`}
              >
                {editMode ? (
                  /* ── Editor row ── */
                  <div className="pl-edit-row">
                    {/* Time badge / inline input */}
                    {editingIdx === idx ? (
                      <input
                        ref={editInputRef}
                        className="pl-ts-input"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onBlur={() => commitInlineEdit(idx)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitInlineEdit(idx)
                          if (e.key === 'Escape') setEditingIdx(null)
                        }}
                        placeholder="0:00.0"
                      />
                    ) : (
                      <button
                        className={`pl-ts-badge ${isMarked ? 'set' : ''}`}
                        onClick={() => startInlineEdit(idx)}
                        title="Klicka för att redigera"
                      >
                        {isMarked ? ts.fmtEdit(draftItem.start) : '—'}
                      </button>
                    )}
                    <span className="pl-edit-num">{idx + 1}</span>
                    <p className="pl-edit-preview">{para.text}</p>
                    <button
                      className={`pl-mark-btn ${isCurrent ? 'current' : ''}`}
                      onClick={() => handleMark(idx)}
                    >
                      ● Markera
                    </button>
                  </div>
                ) : (
                  /* ── Normal row ── */
                  <div className="pl-sentence-row">
                    <button
                      className={`pl-sentence-btn ${isCurrent ? 'active' : ''}`}
                      onClick={() => audioUrl ? seekToParagraph(idx) : playParagraph(para)}
                      title={audioUrl ? 'Hoppa till stycket' : (isCurrent ? 'Stoppa' : 'Spela stycket')}
                      disabled={audioUrl && !timestamps}
                    >
                      {isCurrent ? '⏸' : '▶'}
                    </button>
                    <span className="pl-sentence-num">{idx + 1}</span>
                    {showText
                      ? <p className="pl-sentence-text">{para.text}</p>
                      : <p className="pl-sentence-placeholder">Stycke {idx + 1}</p>
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={`phase-done-bar ${isDone ? 'done' : ''}`}>
        <p>{isDone ? 'Lyssning markerad som klar.' : 'Klar med diktatet?'}</p>
        <button className={`phase-done-btn ${isDone ? 'done' : ''}`} onClick={onMarkDone}>
          {isDone ? '✓ Klar' : 'Markera som klar'}
        </button>
      </div>
    </div>
  )
}
