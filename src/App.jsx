import { useState, useEffect, useCallback } from 'react'
import Library from './pages/Library'
import Study from './pages/Study'
import { loadVocab, saveVocab } from './utils/storage'
import { loadProgress, saveProgress } from './utils/progress'
import * as srs from './utils/srs'
import * as sync from './utils/sync'
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

  // On mount: silently merge remote vocab into local
  useEffect(() => {
    sync.fetchRemoteVocab().then(remote => {
      if (!remote || !Array.isArray(remote) || remote.length === 0) return
      setVocab(prev => {
        const merged = sync.mergeVocab(prev, remote)
        if (merged.length !== prev.length) saveVocab(merged)
        return merged.length !== prev.length ? merged : prev
      })
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
      await sync.publishVocab(vocab)
      setSyncStatus('ok')
      setTimeout(() => setSyncStatus(null), 3000)
    } catch (err) {
      setSyncStatus('error')
      setSyncError(err.message)
    }
  }, [vocab])

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
          onBack={goLibrary}
        />
      )}
    </div>
  )
}
