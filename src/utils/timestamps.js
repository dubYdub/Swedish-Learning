const key = (articleId) => `sv_ts_${articleId}`

export function loadLocal(articleId) {
  try {
    const raw = localStorage.getItem(key(articleId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveLocal(articleId, timestamps) {
  localStorage.setItem(key(articleId), JSON.stringify(timestamps))
}

export function clearLocal(articleId) {
  localStorage.removeItem(key(articleId))
}

// Parse "m:ss", "m:ss.d", or plain seconds string → number | null
export function parseTimeStr(str) {
  const s = str.trim()
  if (!s) return null
  if (s.includes(':')) {
    const [mStr, secStr] = s.split(':')
    const m = parseInt(mStr) || 0
    const sec = parseFloat(secStr) || 0
    return parseFloat((m * 60 + sec).toFixed(2))
  }
  const n = parseFloat(s)
  return isNaN(n) ? null : parseFloat(n.toFixed(2))
}

// Format seconds → "m:ss.d" for editing inputs
export function fmtEdit(s) {
  if (s == null || !isFinite(s)) return ''
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1)
  return `${m}:${sec.padStart(4, '0')}`
}
