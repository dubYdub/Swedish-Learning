// IndexedDB wrapper for audio recordings

const DB_NAME = 'sv-study'
const DB_VERSION = 1
const STORE = 'recordings'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('articleId', 'articleId', { unique: false })
        store.createIndex('recordedAt', 'recordedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function withStore(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    let result
    Promise.resolve(fn(store)).then(r => { result = r })
    tx.oncomplete = () => resolve(result)
    tx.onerror    = () => reject(tx.error)
    tx.onabort    = () => reject(tx.error)
  })
}

export async function addRecording({ articleId, blob, durationMs, notes = '' }) {
  return withStore('readwrite', store => {
    const entry = {
      articleId,
      blob,
      durationMs,
      notes,
      recordedAt: new Date().toISOString(),
    }
    return new Promise((resolve, reject) => {
      const req = store.add(entry)
      req.onsuccess = () => resolve({ ...entry, id: req.result })
      req.onerror   = () => reject(req.error)
    })
  })
}

export async function listRecordings(articleId) {
  return withStore('readonly', store => {
    return new Promise((resolve, reject) => {
      const idx = store.index('articleId')
      const req = idx.getAll(articleId)
      req.onsuccess = () => {
        // newest first
        const sorted = req.result.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
        resolve(sorted)
      }
      req.onerror = () => reject(req.error)
    })
  })
}

export async function countRecordings(articleId) {
  return withStore('readonly', store => {
    return new Promise((resolve, reject) => {
      const idx = store.index('articleId')
      const req = idx.count(articleId)
      req.onsuccess = () => resolve(req.result)
      req.onerror   = () => reject(req.error)
    })
  })
}

export async function countAllRecordings() {
  return withStore('readonly', store => {
    return new Promise((resolve, reject) => {
      const req = store.count()
      req.onsuccess = () => resolve(req.result)
      req.onerror   = () => reject(req.error)
    })
  })
}

export async function deleteRecording(id) {
  return withStore('readwrite', store => {
    return new Promise((resolve, reject) => {
      const req = store.delete(id)
      req.onsuccess = () => resolve()
      req.onerror   = () => reject(req.error)
    })
  })
}

export async function updateRecordingNotes(id, notes) {
  return withStore('readwrite', store => {
    return new Promise((resolve, reject) => {
      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const entry = getReq.result
        if (!entry) return reject(new Error('Not found'))
        entry.notes = notes
        const putReq = store.put(entry)
        putReq.onsuccess = () => resolve(entry)
        putReq.onerror   = () => reject(putReq.error)
      }
      getReq.onerror = () => reject(getReq.error)
    })
  })
}
