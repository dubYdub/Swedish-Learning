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

export function loadCardProgress() {
  return load('cards', {})
}

export function saveCardProgress(progress) {
  save('cards', progress)
}

export function loadGrammarProgress() {
  return load('grammar', {})
}

export function saveGrammarProgress(progress) {
  save('grammar', progress)
}

export function loadReadingProgress() {
  return load('reading', {})
}

export function saveReadingProgress(progress) {
  save('reading', progress)
}
