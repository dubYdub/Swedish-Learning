import { loadToken } from './timestamps'

const REPO      = 'dubydub/Swedish-Learning'
const SYNC_PATH = 'public/sync.json'

// ── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchRemote() {
  const base = import.meta.env.BASE_URL
  const res  = await fetch(`${base}sync.json?_=${Date.now()}`)
  if (!res.ok) return null
  return res.json()  // { vocab, progress, syncedAt }
}

// ── Merge ────────────────────────────────────────────────────────────────────

// Union vocab by word; prefer the entry with a higher SRS level.
export function mergeVocab(local, remote) {
  const map = new Map()
  local.forEach(v  => map.set(v.word.toLowerCase(), v))
  remote.forEach(r => {
    const key = r.word.toLowerCase()
    const ex  = map.get(key)
    if (!ex || (r.level ?? 0) > (ex.level ?? 0)) map.set(key, r)
  })
  return Array.from(map.values()).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
}

// Per-article: union phases (OR), keep max studyTime, earliest firstStarted, latest lastStudied.
export function mergeProgress(local, remote) {
  const merged = { ...local }
  Object.entries(remote).forEach(([id, r]) => {
    const l = local[id]
    if (!l) { merged[id] = r; return }
    const phases = {}
    for (const p of ['listen', 'read', 'shadow', 'record']) {
      phases[p] = !!(l.phases?.[p] || r.phases?.[p])
    }
    const allDone = Object.values(phases).every(Boolean)
    merged[id] = {
      ...l,
      phases,
      status:       allDone ? 'completed' : (Object.values(phases).some(Boolean) ? 'in-progress' : 'not-started'),
      studyTimeSec: Math.max(l.studyTimeSec || 0, r.studyTimeSec || 0),
      lastStudied:  later(l.lastStudied, r.lastStudied),
      firstStarted: earlier(l.firstStarted, r.firstStarted),
      recordingCount: l.recordingCount || 0,  // recordings stay local
    }
  })
  return merged
}

function later(a, b)   { if (!a) return b; if (!b) return a; return a > b ? a : b }
function earlier(a, b) { if (!a) return b; if (!b) return a; return a < b ? a : b }

// ── Publish ──────────────────────────────────────────────────────────────────

export async function publishAll(vocab, progress) {
  const token = loadToken()
  if (!token) throw new Error('no-token')

  const payload = { vocab, progress, syncedAt: new Date().toISOString() }
  const content = JSON.stringify(payload, null, 2)
  const b64     = btoa(unescape(encodeURIComponent(content)))
  const apiUrl  = `https://api.github.com/repos/${REPO}/contents/${SYNC_PATH}`
  const headers = {
    'Authorization': `token ${token}`,
    'Accept':        'application/vnd.github+json',
    'Content-Type':  'application/json',
  }

  let sha
  try {
    const r = await fetch(apiUrl, { headers })
    if (r.ok) sha = (await r.json()).sha
  } catch {}

  const put = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'Sync app data',
      content: b64,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!put.ok) {
    let msg = `HTTP ${put.status}`
    try { msg = (await put.json()).message || msg } catch {}
    throw new Error(msg)
  }
  return put.json()
}
