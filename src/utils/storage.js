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
export function loadVocab() { return load('vocab', []) }
export function saveVocab(v) { save('vocab', v) }

// Hidden static article IDs
export function loadHiddenIds() { return load('hidden_articles', []) }
export function saveHiddenIds(ids) { save('hidden_articles', ids) }
