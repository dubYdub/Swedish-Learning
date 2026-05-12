import { useState, useEffect, useRef } from 'react'
import { startRecording, formatDuration, isRecordingSupported } from '../utils/recorder'
import './Recorder.css'

export default function Recorder({ onSave }) {
  const [state, setState]     = useState('idle')   // idle | recording | saving | error
  const [level, setLevel]     = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError]     = useState(null)
  const recorderRef           = useRef(null)
  const startTimeRef          = useRef(0)
  const timerRef              = useRef(0)

  useEffect(() => {
    return () => {
      // Cleanup if unmounted mid-recording
      recorderRef.current?.cancel()
      clearInterval(timerRef.current)
    }
  }, [])

  async function start() {
    if (!isRecordingSupported()) {
      setError('Inspelning stöds inte i den här webbläsaren')
      setState('error')
      return
    }
    setError(null)
    try {
      const rec = await startRecording({ onLevel: setLevel })
      recorderRef.current = rec
      startTimeRef.current = Date.now()
      setState('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current)
      }, 100)
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        setError('Mikrofontillgång nekades. Tillåt mikrofonen i din webbläsare.')
      } else {
        setError('Kunde inte starta inspelning: ' + e.message)
      }
      setState('error')
    }
  }

  async function stop() {
    if (!recorderRef.current) return
    setState('saving')
    clearInterval(timerRef.current)
    setLevel(0)
    const { blob, durationMs } = await recorderRef.current.stop()
    recorderRef.current = null
    try {
      await onSave({ blob, durationMs })
      setState('idle')
      setElapsed(0)
    } catch (e) {
      setError('Kunde inte spara: ' + e.message)
      setState('error')
    }
  }

  function cancel() {
    recorderRef.current?.cancel()
    recorderRef.current = null
    clearInterval(timerRef.current)
    setLevel(0)
    setElapsed(0)
    setState('idle')
  }

  return (
    <div className={`recorder state-${state}`}>
      {state === 'idle' && (
        <button className="rec-btn rec-start" onClick={start}>
          <span className="rec-dot" />
          <span>Spela in</span>
        </button>
      )}

      {state === 'recording' && (
        <div className="rec-active">
          <div className="rec-vu">
            <div className="rec-vu-bar" style={{ height: `${Math.min(100, level * 100)}%` }} />
          </div>
          <div className="rec-active-info">
            <span className="rec-active-status">
              <span className="rec-pulse" /> Spelar in…
            </span>
            <span className="rec-active-time">{formatDuration(elapsed)}</span>
          </div>
          <div className="rec-active-actions">
            <button className="rec-btn rec-stop" onClick={stop}>
              ⏹ Stoppa & spara
            </button>
            <button className="rec-btn rec-cancel" onClick={cancel}>
              Avbryt
            </button>
          </div>
        </div>
      )}

      {state === 'saving' && (
        <div className="rec-saving">
          <span className="rec-pulse" /> Sparar inspelning…
        </div>
      )}

      {state === 'error' && (
        <div className="rec-error">
          <p>{error}</p>
          <button className="rec-btn rec-retry" onClick={() => { setError(null); setState('idle') }}>
            Försök igen
          </button>
        </div>
      )}
    </div>
  )
}
