import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import './WaveformPlayer.css'

export default function WaveformPlayer({ blob, color = '#C25B5B', height = 64, compact = false }) {
  const containerRef = useRef(null)
  const wsRef        = useRef(null)
  const [playing, setPlaying]   = useState(false)
  const [ready, setReady]       = useState(false)
  const [error, setError]       = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent]   = useState(0)

  useEffect(() => {
    if (!containerRef.current || !blob) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: 'rgba(26, 22, 18, 0.22)',
      progressColor: color,
      cursorColor: 'rgba(26, 22, 18, 0.5)',
      cursorWidth: 1,
      barWidth: 2,
      barGap: 1,
      barRadius: 0,
      normalize: true,
    })
    wsRef.current = ws

    const url = URL.createObjectURL(blob)
    ws.load(url).catch(() => setError(true))

    ws.on('ready', () => { setReady(true); setDuration(ws.getDuration()) })
    ws.on('play', () => setPlaying(true))
    ws.on('pause', () => setPlaying(false))
    ws.on('finish', () => setPlaying(false))
    ws.on('timeupdate', t => setCurrent(t))
    ws.on('error', () => setError(true))

    return () => {
      ws.destroy()
      URL.revokeObjectURL(url)
    }
  }, [blob, color, height])

  function toggle() {
    wsRef.current?.playPause()
  }

  function fmt(s) {
    if (!isFinite(s)) return '0:00'
    const total = Math.floor(s)
    const m = Math.floor(total / 60)
    const sec = total % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className={`wave-player ${compact ? 'compact' : ''}`}>
      <button
        className={`wp-play-btn ${playing ? 'playing' : ''}`}
        onClick={toggle}
        disabled={!ready || error}
        title={playing ? 'Pausa' : 'Spela'}
      >
        {error ? '⚠' : playing ? '⏸' : '▶'}
      </button>
      <div className="wp-waveform" ref={containerRef} />
      <span className="wp-time">{fmt(current)} / {fmt(duration)}</span>
    </div>
  )
}
