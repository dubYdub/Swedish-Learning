import { useState, useEffect, useRef, useCallback } from 'react'
import * as tts from '../utils/tts'
import * as ap from '../utils/audioPlayer'
import './PhaseListen.css'

const TTS_RATES = [
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
  const [audioUrl, setAudioUrl]       = useState(undefined)  // undefined = loading, null = none
  const [timestamps, setTimestamps]   = useState(null)
  const [playing, setPlaying]         = useState(false)       // audio file playing
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [rate, setRate]               = useState(0.82)
  const [showText, setShowText]       = useState(false)
  const [playingId, setPlayingId]     = useState(null)        // TTS: 'all' | para id | null
  const seekRef = useRef(null)
  const rafRef  = useRef(null)

  // Detect audio file and timestamps on mount
  useEffect(() => {
    let cancelled = false
    ap.detectAudioFile(article.id).then(url => {
      if (cancelled) return
      setAudioUrl(url)
      if (url) {
        ap.loadSrc(url)
        // Preload duration via a temporary listener
        const checkDuration = () => {
          const d = ap.getDuration()
          if (d > 0) setDuration(d)
        }
        setTimeout(checkDuration, 800)
        ap.loadTimestamps(article.id).then(ts => {
          if (!cancelled) setTimestamps(ts)
        })
      }
    })
    return () => { cancelled = true }
  }, [article.id])

  // Stop audio on unmount / article change
  useEffect(() => {
    return () => {
      tts.stop()
      ap.stop()
      cancelAnimationFrame(rafRef.current)
    }
  }, [article.id])

  // RAF loop to update seek bar while file is playing
  const tickRaf = useCallback(() => {
    const t = ap.getTime()
    setCurrentTime(t)
    const d = ap.getDuration()
    if (d > 0) setDuration(d)
    rafRef.current = requestAnimationFrame(tickRaf)
  }, [])

  function startRaf() { rafRef.current = requestAnimationFrame(tickRaf) }
  function stopRaf()  { cancelAnimationFrame(rafRef.current) }

  // ── Audio-file controls ──────────────────────────────────────────────────

  function handleFilePlay() {
    if (playing) {
      ap.pause()
      setPlaying(false)
      stopRaf()
    } else {
      ap.play(audioUrl, {
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
      // restart playback from new position
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
    if (!timestamps || !timestamps[idx]) return
    const { start, end } = timestamps[idx]
    stopRaf()
    ap.play(audioUrl, {
      start,
      end,
      rate,
      onTime: t => setCurrentTime(t),
      onEnd: () => { setPlaying(false); stopRaf() },
    })
    setCurrentTime(start)
    setPlaying(true)
    startRaf()
  }

  // ── TTS controls (fallback) ──────────────────────────────────────────────

  function playAll() {
    if (playingId === 'all') { tts.stop(); setPlayingId(null); return }
    const fullText = article.content.map(p => p.text).join('  ')
    setPlayingId('all')
    tts.speak(fullText, { rate, onEnd: () => setPlayingId(null) })
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

  // ── Current highlighted paragraph (from timestamps + currentTime) ────────
  const currentParaIdx = timestamps
    ? ap.findParagraphAtTime(timestamps, currentTime)
    : -1

  // ── Render ───────────────────────────────────────────────────────────────

  if (audioUrl === undefined) {
    return (
      <div className="phase-listen">
        <div className="pl-intro">
          <h2 className="pl-intro-title">🎧 Diktatläge</h2>
          <p className="pl-intro-text pl-loading">Söker efter ljudfil…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="phase-listen">
      <div className="pl-intro">
        <h2 className="pl-intro-title">🎧 Diktatläge</h2>
        <p className="pl-intro-text">
          Lyssna på artikeln och skriv ner det du hör på papper.
          Hoppar du över ett ord? Det är okej – fortsätt.
          {audioUrl
            ? ' Klicka på ett stycke nedan för att hoppa dit.'
            : ' Kontrollera texten när du är klar.'}
        </p>
      </div>

      {/* ── Audio-file player ── */}
      {audioUrl ? (
        <div className="pl-file-player">
          <div className="pl-file-top">
            <button
              className={`pl-play-btn ${playing ? 'active' : ''}`}
              onClick={handleFilePlay}
            >
              {playing ? '⏸ Pausa' : '▶ Spela'}
            </button>
            <span className="pl-file-badge">LJUDFIL</span>
          </div>
          <div className="pl-seek-row">
            <span className="pl-time">{fmtTime(currentTime)}</span>
            <input
              ref={seekRef}
              className="pl-seek"
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
            />
            <span className="pl-time">{fmtTime(duration)}</span>
          </div>
          <div className="pl-rates">
            {FILE_RATES.map(r => (
              <button
                key={r.value}
                className={`pl-rate-btn ${rate === r.value ? 'active' : ''}`}
                onClick={() => handleFileRate(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── TTS controls ── */
        <div className="pl-controls">
          <button
            className={`pl-play-btn ${playingId === 'all' ? 'active' : ''}`}
            onClick={playAll}
          >
            {playingId === 'all' ? '⏹ Stoppa' : '▶ Spela hela artikeln'}
          </button>
          <div className="pl-rates">
            {TTS_RATES.map(r => (
              <button
                key={r.value}
                className={`pl-rate-btn ${rate === r.value ? 'active' : ''}`}
                onClick={() => changeTtsRate(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text toggle */}
      <div className="pl-text-toggle-row">
        <button
          className={`pl-text-toggle ${showText ? 'active' : ''}`}
          onClick={() => setShowText(s => !s)}
        >
          {showText ? '👁 Dölj text' : '👁 Visa text'}
        </button>
        {audioUrl && !timestamps && (
          <span className="pl-hint">Lägg till tidsstämplar för att hoppa till enskilda stycken</span>
        )}
      </div>

      {/* Paragraph list */}
      <div className="pl-sentences">
        <p className="pl-sentences-label">Stycken</p>
        <div className="pl-sentence-list">
          {article.content.map((para, idx) => {
            const isCurrent = audioUrl
              ? currentParaIdx === idx
              : playingId === para.id
            const hasTimestamp = timestamps?.[idx] != null

            return (
              <div
                key={para.id}
                className={`pl-sentence ${isCurrent ? 'speaking' : ''} ${showText ? 'revealed' : ''}`}
              >
                <div className="pl-sentence-row">
                  <button
                    className={`pl-sentence-btn ${isCurrent ? 'active' : ''} ${!audioUrl || hasTimestamp ? '' : 'disabled'}`}
                    onClick={() => {
                      if (audioUrl && hasTimestamp) {
                        seekToParagraph(idx)
                      } else if (!audioUrl) {
                        playParagraph(para)
                      }
                    }}
                    title={audioUrl ? (hasTimestamp ? 'Hoppa till stycket' : 'Inga tidsstämplar') : (isCurrent ? 'Stoppa' : 'Spela stycket')}
                    disabled={audioUrl && !hasTimestamp}
                  >
                    {isCurrent ? '⏸' : '▶'}
                  </button>
                  <span className="pl-sentence-num">{idx + 1}</span>
                  {showText
                    ? <p className="pl-sentence-text">{para.text}</p>
                    : <p className="pl-sentence-placeholder">Stycke {idx + 1}</p>
                  }
                </div>
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
