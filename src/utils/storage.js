const PREFIX = 'sv_'

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

// Vocabulary list: [{ id, word, context, addedAt }]
// Deduplicate IDs on load — older versions used Date.now() and rapid bulk-adds
// collided, which corrupts the flashcard deck's React keys and breaks click events.
export function loadVocab() {
  const arr = load('vocab', [])
  const seen = new Set()
  let mutated = false
  const out = arr.map(v => {
    if (seen.has(v.id)) {
      mutated = true
      let nid
      do { nid = Date.now() + Math.floor(Math.random() * 1e9) } while (seen.has(nid))
      seen.add(nid)
      return { ...v, id: nid }
    }
    seen.add(v.id)
    return v
  })
  if (mutated) save('vocab', out)
  return out
}
export function saveVocab(v) { save('vocab', v) }

// Hidden static article IDs
export function loadHiddenIds() { return load('hidden_articles', []) }
export function saveHiddenIds(ids) { save('hidden_articles', ids) }
