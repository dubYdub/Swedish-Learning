// MediaRecorder wrapper + live VU meter via AnalyserNode

function pickMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const t of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported?.(t)) return t
  }
  return ''
}

export async function startRecording({ onLevel } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('MediaDevices API not available')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100,
    },
  })

  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

  // VU meter via Web Audio
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const source   = audioCtx.createMediaStreamSource(stream)
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  const buf = new Uint8Array(analyser.frequencyBinCount)

  let levelRaf = 0
  function tickLevel() {
    if (!onLevel) return
    analyser.getByteTimeDomainData(buf)
    // RMS
    let sum = 0
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / buf.length)
    onLevel(Math.min(1, rms * 3)) // amplify a bit
    levelRaf = requestAnimationFrame(tickLevel)
  }
  tickLevel()

  const startTime = Date.now()
  recorder.start(100) // collect 100ms chunks

  return {
    stop() {
      return new Promise(resolve => {
        recorder.onstop = () => {
          cancelAnimationFrame(levelRaf)
          stream.getTracks().forEach(t => t.stop())
          audioCtx.close().catch(() => {})
          const blob = new Blob(chunks, { type: mimeType || 'audio/webm' })
          const durationMs = Date.now() - startTime
          resolve({ blob, durationMs })
        }
        recorder.stop()
      })
    },
    cancel() {
      try { recorder.stop() } catch {}
      cancelAnimationFrame(levelRaf)
      stream.getTracks().forEach(t => t.stop())
      audioCtx.close().catch(() => {})
    },
  }
}

export function formatDuration(ms) {
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function isRecordingSupported() {
  return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder)
}
