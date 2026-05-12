const key = (articleId) => `sv_ts_${articleId}`
const TOKEN_KEY = 'sv_gh_token'
const REPO = 'dubydub/Swedish-Learning'

export function loadToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function saveToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function publishToGitHub(articleId, timestamps, token) {
  const path = `public/audio/${articleId}.json`
  const content = JSON.stringify(timestamps, null, 2)
  const b64 = btoa(unescape(encodeURIComponent(content)))
  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${path}`
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }

  let sha
  try {
    const getRes = await fetch(apiUrl, { headers })
    if (getRes.ok) { sha = (await getRes.json()).sha }
  } catch {}

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Update timestamps for ${articleId}`,
      content: b64,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!putRes.ok) {
    let msg = `HTTP ${putRes.status}`
    try { msg = (await putRes.json()).message || msg } catch {}
    throw new Error(msg)
  }
  return putRes.json()
}

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
