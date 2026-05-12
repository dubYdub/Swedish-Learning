import { loadToken } from './timestamps'

const REPO      = 'dubydub/Swedish-Learning'
const VOCAB_PATH = 'public/vocab.json'

// Fetch vocab from the live deployed site (cache-busted)
export async function fetchRemoteVocab() {
  const base = import.meta.env.BASE_URL
  const res  = await fetch(`${base}vocab.json?_=${Date.now()}`)
  if (!res.ok) return null
  return res.json()
}

// Union merge: keep all words from both sides.
// When the same word exists on both, prefer the entry with a higher SRS level.
export function mergeVocab(local, remote) {
  const map = new Map()
  local.forEach(v  => map.set(v.word.toLowerCase(), v))
  remote.forEach(r => {
    const key = r.word.toLowerCase()
    const existing = map.get(key)
    if (!existing || (r.level ?? 0) > (existing.level ?? 0)) map.set(key, r)
  })
  return Array.from(map.values()).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
}

// Push the full vocab array to GitHub as public/vocab.json
export async function publishVocab(vocab) {
  const token = loadToken()
  if (!token) throw new Error('no-token')

  const content = JSON.stringify(vocab, null, 2)
  const b64     = btoa(unescape(encodeURIComponent(content)))
  const apiUrl  = `https://api.github.com/repos/${REPO}/contents/${VOCAB_PATH}`
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
      message: 'Sync vocabulary',
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
