import { useState, useEffect, useRef, useCallback } from 'react'
import * as tts from '../utils/tts'
import * as ap from '../utils/audioPlayer'
import './PhaseShadow.css'

function resolveAudioUrl(article) {
  return article.audioFile ? ap.audioFileUrl(article.audioFile) : null
}

function estimateTimestamps(content, duration) {
  const totalChars = content.reduce((s, p) => s + p.text.length, 0)
  let cursor = 0
  return content.map(p => {
    const start = cursor
    cursor += (p.text.length / totalChars) * duration
    return { id: p.id, start, end: cursor }
  })
}

const TTS_RATES = [
  { value: 0.55, label: 'Mycket sakta' },
  { value: 0.70, label: 'Sakta' },
  { value: 0.82, label: 'Normal' },
  { value: 1.0,  label: 'Snabb' },
]
const FILE_RATES = [
  { value: 0.6,  label: 'Mycket sakta' },
  { value: 0.75, label: 'Sakta' },
  { value: 0.9,  label: 'Normal' },
  { value: 1.1,  label: 'Snabb' },
]

function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s) % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function PhaseShadow({ article, isDone, onMarkDone }) {
  const audioUrl = resolveAudioUrl(article)

  const [timestamps, setTimestamps]   = useState(null)
  const [playing, setPlaying]         = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [rate, setRate]               = useState(0.70)
  // TTS state
  const [playingAll, setPlayingAll]   = useState(false)
  const [currentIdx, setCurrentIdx]   = useState(-1)
  const stoppedManuallyRef = useRef(false)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!audioUrl) return
    let cancelled = false
    ap.loadSrc(audioUrl)
    ap.onDurationReady(d => {
      if (cancelled) return
      setDuration(d)
      ap.loadTimestamps(article.id).then(ts => {
        if (cancelled) return
        setTimestamps(ts ?? estimateTimestamps(article.content, d))
      })
    })
    return () => { cancelled = true }
  }, [article.id, audioUrl])

  useEffect(() => {
    return () => {
      tts.stop()
      ap.stop()
      cancelAnimationFrame(rafRef.current)
    }
  }, [article.id])

  // RAF tick for file seek bar + paragraph highlight
  const tick = useCallback(() => {
    const t = ap.getTime()
    setCurrentTime(t)
    const d = ap.getDuration()
    if (d > 0) setDuration(d)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  function startRaf() { rafRef.current = requestAnimationFrame(tick) }
  function stopRaf()  { cancelAnimationFrame(rafRef.current) }

  // ── Audio-file controls ──────────────────────────────────────────────────

  function handleFilePlay() {
    if (playing) {
      ap.pause()
      setPlaying(false)
      stopRaf()
    } else {
      const startAt = ap.isPaused() ? ap.getTime() : null
      ap.play(audioUrl, {
        start: startAt,
        rate,
        onTime: t => setCurrentTime(t),
        onEnd: () => { setPlaying(false); stopRaf(); setCurrentTime(0) },
      })
      setPlaying(true)
      startRaf()
    }
  }

  function handleSeek(e) {
    const t = Number(e.target.value)
    ap.seek(t)
    setCurrentTime(t)
    if (!playing) {
      ap.play(audioUrl, {
        rate,
        onTime: t2 => setCurrentTime(t2),
        onEnd: () => { setPlaying(false); stopRaf(); setCurrentTime(0) },
      })
      setPlaying(true)
      startRaf()
    }
  }

  function handleFileRate(r) {
    setRate(r)
    ap.setRate(r)
  }

  function seekToParagraph(idx) {
    if (!timestamps?.[idx]) return
    const { start } = timestamps[idx]
    ap.seek(start)
    setCurrentTime(start)
    if (!playing) {
      ap.play(audioUrl, {
        start,
        rate,
        onTime: t => setCurrentTime(t),
        onEnd: () => { setPlaying(false); stopRaf(); setCurrentTime(0) },
      })
      setPlaying(true)
      startRaf()
    }
  }

  // ── TTS controls ─────────────────────────────────────────────────────────

  function stopAllTts() {
    stoppedManuallyRef.current = true
    tts.stop()
    setPlayingAll(false)
    setCurrentIdx(-1)
  }

  function speakNext(idx) {
    if (idx >= article.content.length || stoppedManuallyRef.current) {
      setPlayingAll(false); setCurrentIdx(-1); return
    }
    setCurrentIdx(idx)
    tts.speak(article.content[idx].text, {
      rate,
      onEnd: () => {
        if (stoppedManuallyRef.current) return
        setTimeout(() => speakNext(idx + 1), 200)
      },
    })
  }

  function handleTtsPlayAll() {
    if (playingAll) { stopAllTts(); return }
    stoppedManuallyRef.current = false
    setPlayingAll(true)
    speakNext(0)
  }

  function handleTtsSentenceClick(idx) {
    stopAllTts()
    setTimeout(() => {
      stoppedManuallyRef.current = false
      setPlayingAll(true)
      speakNext(idx)
    }, 50)
  }

  function changeTtsRate(r) {
    setRate(r)
    if (playingAll) {
      const idx = currentIdx
      stopAllTts()
      setTimeout(() => { stoppedManuallyRef.current = false; setPlayingAll(true); speakNext(Math.max(0, idx)) }, 50)
    }
  }

  // ── Current paragraph from timestamps ────────────────────────────────────
  const fileCurrentIdx = timestamps
    ? ap.findParagraphAtTime(timestamps, currentTime)
    : -1

  // ── Render ───────────────────────────────────────────────────────────────

  const usingFile = !!audioUrl
  const displayIdx = usingFile ? fileCurrentIdx : currentIdx

  return (
    <div className="phase-shadow">
      <div className="ps-intro">
        <h2 className="ps-intro-title">🗣️ Skuggläsning</h2>
        <p className="ps-intro-text">
          Läs högt tillsammans med ljudet. Härma uttalet, rytmen och betoningen.
          {usingFile && timestamps
            ? ' Det markerade stycket spelas just nu.'
            : usingFile
              ? ' Lägg till tidsstämplar för styckemarkering.'
              : ' Stycket som spelas markeras med amber.'}
        </p>
      </div>

      {/* Controls */}
      {usingFile ? (
        <div className="ps-file-player">
          <div className="ps-file-top">
            <button
              className={`ps-play-btn ${playing ? 'active' : ''}`}
              onClick={handleFilePlay}
            >
              {playing ? '⏸ Pausa' : '▶ Skugga från början'}
            </button>
            <span className="ps-file-badge">LJUDFIL</span>
            <div className="ps-rates">
              {FILE_RATES.map(r => (
                <button
                  key={r.value}
                  className={`ps-rate-btn ${rate === r.value ? 'active' : ''}`}
                  onClick={() => handleFileRate(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ps-seek-row">
            <span className="ps-time">{fmtTime(currentTime)}</span>
            <input
              className="ps-seek"
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
            />
            <span className="ps-time">{fmtTime(duration)}</span>
          </div>
        </div>
      ) : (
        <div className="ps-controls">
          <button
            className={`ps-play-btn ${playingAll ? 'active' : ''}`}
            onClick={handleTtsPlayAll}
          >
            {playingAll ? '⏹ Stoppa' : '▶ Skugga från början'}
          </button>
          <div className="ps-rates">
            {TTS_RATES.map(r => (
              <button
                key={r.value}
                className={`ps-rate-btn ${rate === r.value ? 'active' : ''}`}
                onClick={() => changeTtsRate(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Synced paragraphs */}
      <div className="ps-content">
        {article.content.map((para, idx) => {
          const isCurrent = displayIdx === idx
          return (
            <div
              key={para.id}
              className={`ps-para ${isCurrent ? 'current' : ''}`}
              onClick={() => usingFile
                ? (timestamps ? seekToParagraph(idx) : null)
                : handleTtsSentenceClick(idx)
              }
              style={{ cursor: usingFile && !timestamps ? 'default' : 'pointer' }}
            >
              <span className="ps-para-num">{idx + 1}</span>
              <p className="ps-para-text">{para.text}</p>
            </div>
          )
        })}
      </div>

      <div className={`phase-done-bar ${isDone ? 'done' : ''}`}>
        <p>{isDone ? 'Skuggläsning markerad som klar.' : 'Klar med skuggläsningen?'}</p>
        <button className={`phase-done-btn ${isDone ? 'done' : ''}`} onClick={onMarkDone}>
          {isDone ? '✓ Klar' : 'Markera som klar'}
        </button>
      </div>
    </div>
  )
}
