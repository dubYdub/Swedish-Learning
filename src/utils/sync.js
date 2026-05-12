import { loadToken } from './timestamps'

const REPO      = 'dubydub/Swedish-Learning'
const SYNC_PATH = 'public/sync.json'

// ── Helpers ───────────────────────────────────────────────────────────────────

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function mimeToExt(type = '') {
  return (
    { 'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a',
      'audio/wav': '.wav', 'audio/ogg': '.ogg', 'audio/aac': '.aac' }[type] || '.audio'
  )
}

async function ghPut(path, b64, message, headers) {
  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${path}`
  let sha
  try {
    const r = await fetch(apiUrl, { headers })
    if (r.ok) sha = (await r.json()).sha
  } catch {}
  const put = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message, content: b64, ...(sha ? { sha } : {}) }),
  })
  if (!put.ok) {
    let msg = `HTTP ${put.status}`
    try { msg = (await put.json()).message || msg } catch {}
    throw new Error(msg)
  }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchRemote() {
  const base = import.meta.env.BASE_URL
  const res  = await fetch(`${base}sync.json?_=${Date.now()}`)
  if (!res.ok) return null
  return res.json()
}

// ── Merge ─────────────────────────────────────────────────────────────────────

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
      recordingCount: l.recordingCount || 0,
    }
  })
  return merged
}

function later(a, b)   { if (!a) return b; if (!b) return a; return a > b ? a : b }
function earlier(a, b) { if (!a) return b; if (!b) return a; return a < b ? a : b }

// Remote timestamps fill in articles where local has nothing.
export function mergeTimestamps(localMap, remoteMap) {
  const result = { ...localMap }
  for (const [id, ts] of Object.entries(remoteMap)) {
    if (!result[id]) result[id] = ts
  }
  return result
}

// Merge remote custom articles: add any not already present locally.
export function mergeCustomArticles(local, remote) {
  if (!Array.isArray(remote) || !remote.length) return local
  const localIds = new Set(local.map(a => a.id))
  const incoming = remote.filter(a => !localIds.has(a.id))
  return incoming.length ? [...local, ...incoming] : local
}

// Union hidden IDs.
export function mergeHiddenIds(local, remote) {
  if (!Array.isArray(remote) || !remote.length) return local
  const combined = new Set([...local, ...remote])
  return Array.from(combined)
}

// ── Publish ───────────────────────────────────────────────────────────────────

// customArticles entries may carry a `_audioBlob` Blob for file-upload audio.
// publishAll uploads those as static files and replaces the field with a URL.
export async function publishAll(vocab, progress, timestamps = {}, customArticles = [], hiddenIds = []) {
  const token = loadToken()
  if (!token) throw new Error('no-token')
  const headers = {
    'Authorization': `token ${token}`,
    'Accept':        'application/vnd.github+json',
    'Content-Type':  'application/json',
  }
  const BASE = import.meta.env.BASE_URL

  // Upload audio blobs and build a serialisable article list
  const syncedArticles = await Promise.all(
    customArticles.map(async article => {
      const { _audioBlob, audioBlobUrl, ...rest } = article
      if (_audioBlob instanceof Blob) {
        try {
          const ext      = mimeToExt(_audioBlob.type)
          const filePath = `public/custom-audio/${article.id}${ext}`
          const b64      = await blobToBase64(_audioBlob)
          await ghPut(filePath, b64, `Sync audio for ${article.id}`, headers)
          return { ...rest, audioUrl: `${BASE}custom-audio/${article.id}${ext}` }
        } catch {
          return rest // audio upload failed — sync metadata without it
        }
      }
      return rest
    })
  )

  const payload = {
    vocab,
    progress,
    timestamps,
    customArticles: syncedArticles,
    hiddenIds,
    syncedAt: new Date().toISOString(),
  }
  const content = JSON.stringify(payload, null, 2)
  const b64     = btoa(unescape(encodeURIComponent(content)))
  await ghPut(SYNC_PATH, b64, 'Sync app data', headers)
}
