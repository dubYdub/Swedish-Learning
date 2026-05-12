import { useState, useEffect, useCallback } from 'react'
import Library from './pages/Library'
import Study from './pages/Study'
import { loadVocab, saveVocab } from './utils/storage'
import { loadProgress, saveProgress } from './utils/progress'
import { articles } from './data/articles'
import './App.css'

export default function App() {
  // Router state: 'library' | 'study'
  const [view, setView]             = useState('library')
  const [studyId, setStudyId]       = useState(null)

  // Persisted global state
  const [progress, setProgress]     = useState(() => loadProgress())
  const [vocab, setVocab]           = useState(() => loadVocab())

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

  const addToVocab = useCallback((word, context) => {
    setVocab(prev => {
      if (prev.find(v => v.word.toLowerCase() === word.toLowerCase())) return prev
      const updated = [{ id: Date.now(), word, context, addedAt: new Date().toISOString() }, ...prev]
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
          onBack={goLibrary}
        />
      )}
    </div>
  )
}
