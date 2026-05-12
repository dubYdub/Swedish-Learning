import { useState, useEffect, useCallback } from 'react'
import Library from './pages/Library'
import Study from './pages/Study'
import { loadVocab, saveVocab } from './utils/storage'
import { loadProgress, saveProgress } from './utils/progress'
import * as tsUtils from './utils/timestamps'
import * as srs from './utils/srs'
import * as sync from './utils/sync'
import * as ds from './utils/deepseek'
import { articles } from './data/articles'
import './App.css'

export default function App() {
  // Router state: 'library' | 'study'
  const [view, setView]             = useState('library')
  const [studyId, setStudyId]       = useState(null)

  // Persisted global state
  const [progress, setProgress]     = useState(() => loadProgress())
  const [vocab, setVocab]           = useState(() => loadVocab())

  // Sync status for publish button
  const [syncStatus, setSyncStatus] = useState(null)  // null | 'pending' | 'ok' | 'error'
  const [syncError, setSyncError]   = useState('')
  const [generatingMnemonics, setGeneratingMnemonics] = useState(false)

  // On mount: silently merge remote vocab + progress into local
  useEffect(() => {
    sync.fetchRemote().then(remote => {
      if (!remote) return
      if (Array.isArray(remote.vocab) && remote.vocab.length > 0) {
        setVocab(prev => {
          const merged = sync.mergeVocab(prev, remote.vocab)
          if (merged.length !== prev.length) saveVocab(merged)
          return merged.length !== prev.length ? merged : prev
        })
      }
      if (remote.progress && typeof remote.progress === 'object') {
        setProgress(prev => {
          const merged = sync.mergeProgress(prev, remote.progress)
          saveProgress(merged)
          return merged
        })
      }
      if (remote.timestamps && typeof remote.timestamps === 'object') {
        const articleIds = articles.map(a => a.id)
        const localMap = tsUtils.loadAll(articleIds)
        const merged = sync.mergeTimestamps(localMap, remote.timestamps)
        for (const [id, ts] of Object.entries(merged)) {
          if (!localMap[id]) tsUtils.saveLocal(id, ts)
        }
      }
    }).catch(() => {})
  }, [])

  function openStudy(articleId) {
    setStudyId(articleId)
    setView('study')
    window.scrollTo(0, 0)
  }

  function goLibrary() {
    setStudyId(null)
    setView('library')
    window.scrollTo(0, 0)
  }

  const updateProgress = useCallback((updater) => {
    setProgress(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveProgress(next)
      return next
    })
  }, [])

  const addToVocab = useCallback((word, context, id = Date.now()) => {
    setVocab(prev => {
      if (prev.find(v => v.word.toLowerCase() === word.toLowerCase())) return prev
      const updated = [{ id, word, context, addedAt: new Date().toISOString() }, ...prev]
      saveVocab(updated)
      return updated
    })
  }, [])

  const removeFromVocab = useCallback((id) => {
    setVocab(prev => {
      const updated = prev.filter(v => v.id !== id)
      saveVocab(updated)
      return updated
    })
  }, [])

  const publishVocab = useCallback(async () => {
    setSyncStatus('pending')
    setSyncError('')
    try {
      const timestamps = tsUtils.loadAll(articles.map(a => a.id))
      await sync.publishAll(vocab, progress, timestamps)
      setSyncStatus('ok')
      setTimeout(() => setSyncStatus(null), 3000)
    } catch (err) {
      setSyncStatus('error')
      setSyncError(err.message)
    }
  }, [vocab, progress])

  const updateVocabSRS = useCallback((id, correct) => {
    setVocab(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, ...srs.advance(v, correct) } : v)
      saveVocab(updated)
      return updated
    })
  }, [])

  const updateVocabContext = useCallback((id, context) => {
    setVocab(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, context } : v)
      saveVocab(updated)
      return updated
    })
  }, [])

  const updateVocabMnemonic = useCallback((id, mnemonic) => {
    setVocab(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, mnemonic } : v)
      saveVocab(updated)
      return updated
    })
  }, [])

  const generateMissingMnemonics = useCallback(async () => {
    if (!ds.getKey()) return
    setGeneratingMnemonics(true)
    // Snapshot missing at start to avoid re-reading stale closure
    const missing = vocab.filter(v => !v.mnemonic)
    for (const entry of missing) {
      const m = await ds.fetchMnemonic(entry.word, entry.context).catch(() => null)
      if (m) {
        setVocab(prev => {
          const updated = prev.map(v => v.id === entry.id ? { ...v, mnemonic: m } : v)
          saveVocab(updated)
          return updated
        })
      }
    }
    setGeneratingMnemonics(false)
  }, [vocab])

  const currentArticle = studyId ? articles.find(a => a.id === studyId) : null

  return (
    <div className="app">
      {view === 'library' && (
        <Library
          articles={articles}
          progress={progress}
          vocab={vocab}
          onOpenArticle={openStudy}
          onRemoveVocab={removeFromVocab}
          onUpdateVocab={updateVocabContext}
          onAnswerVocab={updateVocabSRS}
          onPublishVocab={publishVocab}
          syncStatus={syncStatus}
          syncError={syncError}
          onGenerateMnemonics={generateMissingMnemonics}
          generatingMnemonics={generatingMnemonics}
        />
      )}
      {view === 'study' && currentArticle && (
        <Study
          article={currentArticle}
          progress={progress}
          updateProgress={updateProgress}
          vocab={vocab}
          addToVocab={addToVocab}
          removeFromVocab={removeFromVocab}
          updateVocabContext={updateVocabContext}
          updateVocabMnemonic={updateVocabMnemonic}
          onBack={goLibrary}
        />
      )}
    </div>
  )
}
