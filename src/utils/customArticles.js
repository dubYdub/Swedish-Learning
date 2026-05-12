const KEY = 'sv_custom_articles'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr))
}

export function loadCustomArticles() {
  const arr = load()
  // Deduplicate by id in case of prior corruption
  const seen = new Set()
  return arr.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true })
}

export function saveCustomArticles(arr) { save(arr) }

export function addCustomArticle(obj) {
  const arr = load()
  if (arr.some(a => a.id === obj.id)) return arr  // idempotent
  const next = [...arr, obj]
  save(next)
  return next
}

export function removeCustomArticle(id) {
  const arr = load().filter(a => a.id !== id)
  save(arr)
  return arr
}

export function updateCustomArticle(id, updates) {
  const arr = load().map(a => a.id === id ? { ...a, ...updates } : a)
  save(arr)
  return arr
}
