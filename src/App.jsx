import { useState, useEffect, useCallback, useMemo } from 'react'
import Library from './pages/Library'
import Study from './pages/Study'
import { loadVocab, saveVocab, loadHiddenIds, saveHiddenIds } from './utils/storage'
import { loadProgress, saveProgress } from './utils/progress'
import * as tsUtils from './utils/timestamps'
import * as srs from './utils/srs'
import * as sync from './utils/sync'
import * as ds from './utils/deepseek'
import { articles as staticArticles } from './data/articles'
import { loadCustomArticles, addCustomArticle, removeCustomArticle, updateCustomArticle } from './utils/customArticles'
import { saveCustomAudio, loadCustomAudio, deleteCustomAudio } from './utils/db'
import './App.css'

export default function App() {
  const [view, setView]             = useState('library')
  const [studyId, setStudyId]       = useState(null)

  const [progress, setProgress]     = useState(() => loadProgress())
  const [vocab, setVocab]           = useState(() => loadVocab())

  const [syncStatus, setSyncStatus] = useState(null)
  const [syncError, setSyncError]   = useState('')
  const [generatingMnemonics, setGeneratingMnemonics] = useState(false)

  const [customArticles, setCustomArticles] = useState([])
  const [hiddenIds, setHiddenIds] = useState(() => loadHiddenIds())

  // On mount: load custom articles + resolve their audio blob URLs
  useEffect(() => {
    const stored = loadCustomArticles()
    if (stored.length === 0) { setCustomArticles([]); return }
    Promise.all(
      stored.map(async a => {
        if (!a.audioBlobUrl && !a.audioUrl) {
          try {
            const blob = await loadCustomAudio(a.id)
            if (blob) return { ...a, audioBlobUrl: URL.createObjectURL(blob) }
          } catch {}
        }
        return a
      })
    ).then(resolved => setCustomArticles(resolved))
  }, [])

  const allArticles = useMemo(
    () => [...staticArticles, ...customArticles].filter(a => !hiddenIds.includes(a.id)),
    [customArticles, hiddenIds]
  )

  // On mount: silently merge remote vocab, progress, custom articles + hidden IDs
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
        const localMap = tsUtils.loadAll(Object.keys(remote.timestamps))
        const merged = sync.mergeTimestamps(localMap, remote.timestamps)
        for (const [id, ts] of Object.entries(merged)) {
          if (!localMap[id]) tsUtils.saveLocal(id, ts)
        }
      }

      if (Array.isArray(remote.customArticles) && remote.customArticles.length > 0) {
        setCustomArticles(prev => {
          const merged = sync.mergeCustomArticles(prev, remote.customArticles)
          if (merged.length !== prev.length) {
            // Persist newly arrived articles to localStorage
            const prevIds = new Set(prev.map(a => a.id))
            merged.filter(a => !prevIds.has(a.id)).forEach(a => addCustomArticle(a))
          }
          return merged
        })
      }

      if (Array.isArray(remote.hiddenIds) && remote.hiddenIds.length > 0) {
        setHiddenIds(prev => {
          const merged = sync.mergeHiddenIds(prev, remote.hiddenIds)
          if (merged.length !== prev.length) saveHiddenIds(merged)
          return merged.length !== prev.length ? merged : prev
        })
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
      const timestamps = tsUtils.loadAll(allArticles.map(a => a.id))

      // Attach IndexedDB audio blobs for file-uploaded articles so they get pushed to GitHub
      const articlesForSync = await Promise.all(
        customArticles.map(async a => {
          if (!a.audioUrl && a.audioBlobUrl) {
            try {
              const blob = await loadCustomAudio(a.id)
              if (blob) return { ...a, _audioBlob: blob }
            } catch {}
          }
          return a
        })
      )

      await sync.publishAll(vocab, progress, timestamps, articlesForSync, hiddenIds)
      setSyncStatus('ok')
      setTimeout(() => setSyncStatus(null), 3000)
    } catch (err) {
      setSyncStatus('error')
      setSyncError(err.message)
    }
  }, [vocab, progress, allArticles, customArticles, hiddenIds])

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

  const handleAddCustomArticle = useCallback(async (articleData, audioBlob) => {
    let audioBlobUrl = null
    if (audioBlob) {
      try {
        await saveCustomAudio(articleData.id, audioBlob)
        audioBlobUrl = URL.createObjectURL(audioBlob)
      } catch {}
    }
    const withUrl = audioBlobUrl ? { ...articleData, audioBlobUrl } : articleData
    addCustomArticle(articleData)
    setCustomArticles(prev => [...prev, withUrl])

    // Background vocab extraction — adds to global vocab AND patches article.keyVocab
    if (ds.getKey() && articleData.content?.length) {
      const fullText = articleData.content.map(p => p.text).join('\n\n')
      ds.fetchKeyVocab(fullText).then(words => {
        if (!words.length) return
        // 1. Add new words to the global vocab list
        setVocab(prev => {
          const set = new Set(prev.map(v => v.word.toLowerCase()))
          const toAdd = words
            .filter(w => w.word && !set.has(w.word.toLowerCase()))
            .map(w => ({ id: Date.now() + Math.random(), word: w.word, context: w.definition, addedAt: new Date().toISOString() }))
          if (!toAdd.length) return prev
          const updated = [...toAdd, ...prev]
          saveVocab(updated)
          return updated
        })
        // 2. Store words in the article's keyVocab so PhaseRead shows them
        const keyVocab = words.map(w => ({ word: w.word, def: w.definition }))
        updateCustomArticle(articleData.id, { keyVocab })
        setCustomArticles(prev =>
          prev.map(a => a.id === articleData.id ? { ...a, keyVocab } : a)
        )
      }).catch(() => {})
    }
  }, [])

  const handleRemoveArticle = useCallback(async (id) => {
    const isCustom = customArticles.some(a => a.id === id)
    if (isCustom) {
      try { await deleteCustomAudio(id) } catch {}
      removeCustomArticle(id)
      setCustomArticles(prev => prev.filter(a => a.id !== id))
    } else {
      setHiddenIds(prev => {
        const next = [...prev, id]
        saveHiddenIds(next)
        return next
      })
    }
  }, [customArticles])

  const currentArticle = studyId ? allArticles.find(a => a.id === studyId) : null

  return (
    <div className="app">
      {view === 'library' && (
        <Library
          articles={allArticles}
          progress={progress}
          vocab={vocab}
          onOpenArticle={openStudy}
          onAddVocab={addToVocab}
          onRemoveVocab={removeFromVocab}
          onUpdateVocab={updateVocabContext}
          onUpdateMnemonic={updateVocabMnemonic}
          onAnswerVocab={updateVocabSRS}
          onPublishVocab={publishVocab}
          syncStatus={syncStatus}
          syncError={syncError}
          onGenerateMnemonics={generateMissingMnemonics}
          generatingMnemonics={generatingMnemonics}
          onAddCustomArticle={handleAddCustomArticle}
          onRemoveArticle={handleRemoveArticle}
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
