// Singleton HTML5 audio element — shared across phases
let _el = null

function el() {
  if (!_el) _el = document.createElement('audio')
  return _el
}

function clearListeners() {
  const a = el()
  a.onended = null
  a.ontimeupdate = null
  a.onerror = null
}

// Build a URL for an audio file in public/audio/
export function audioFileUrl(audioFile) {
  return `${import.meta.env.BASE_URL}audio/${audioFile}`
}

// --- Timestamps ---

const _tsCache = {}

// Expects public/audio/{articleId}.json → [{id, start, end}, ...]
export async function loadTimestamps(articleId) {
  if (_tsCache[articleId] !== undefined) return _tsCache[articleId]
  const base = import.meta.env.BASE_URL
  try {
    const res = await fetch(`${base}audio/${articleId}.json`)
    if (!res.ok) { _tsCache[articleId] = null; return null }
    const data = await res.json()
    const arr = Array.isArray(data) ? data : (data.paragraphs ?? null)
    _tsCache[articleId] = arr
    return arr
  } catch {
    _tsCache[articleId] = null
    return null
  }
}

export function findParagraphAtTime(timestamps, t) {
  if (!timestamps) return -1
  for (let i = 0; i < timestamps.length; i++) {
    if (t >= timestamps[i].start && t < timestamps[i].end) return i
  }
  return -1
}

// --- Playback ---

export function loadSrc(url) {
  const a = el()
  const abs = new URL(url, location.href).href
  if (a.src !== abs) {
    a.pause()
    a.src = url
    a.load()
  }
}

export function play(url, { start = null, end = null, rate = 1.0, onEnd, onTime } = {}) {
  loadSrc(url)
  clearListeners()
  const a = el()
  a.playbackRate = rate
  if (start != null) a.currentTime = start

  a.onended = () => { clearListeners(); onEnd?.() }
  a.ontimeupdate = () => {
    const t = a.currentTime
    onTime?.(t)
    if (end != null && t >= end) { a.pause(); clearListeners(); onEnd?.() }
  }
  a.onerror = () => clearListeners()
  return a.play().catch(() => {})
}

export function pause() { el().pause() }

export function resume(url) {
  loadSrc(url)
  el().play().catch(() => {})
}

export function stop() {
  clearListeners()
  const a = el()
  a.pause()
  a.currentTime = 0
}

export function seek(t) { el().currentTime = t }
export function setRate(r) { el().playbackRate = r }
export function getTime() { return _el?.currentTime ?? 0 }
export function getDuration() { const d = _el?.duration; return isFinite(d) ? d : 0 }
export function isPaused() { return _el?.paused ?? true }
