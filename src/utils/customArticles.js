const KEY = 'sv_custom_articles'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr))
}

export function loadCustomArticles() { return load() }

export function saveCustomArticles(arr) { save(arr) }

export function addCustomArticle(obj) {
  const arr = [...load(), obj]
  save(arr)
  return arr
}

export function removeCustomArticle(id) {
  const arr = load().filter(a => a.id !== id)
  save(arr)
  return arr
}
