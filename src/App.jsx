import { useState, useCallback } from 'react'
import TopicPicker from './components/TopicPicker'
import ArticleReader from './components/ArticleReader'
import DateHistory from './components/DateHistory'
import VocabList from './components/VocabList'
import { loadHistory, saveHistory, loadVocab, saveVocab } from './utils/storage'
import { articles, getArticlesForDate } from './data/articles'
import './App.css'

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function App() {
  const today = localToday()

  const [history, setHistory]         = useState(() => loadHistory())
  const [vocab, setVocab]             = useState(() => loadVocab())
  const [currentArticle, setCurrent]  = useState(() => {
    const todayEntry = loadHistory().find(h => h.date === today)
    return todayEntry ? articles.find(a => a.id === todayEntry.articleId) ?? null : null
  })
  const [viewingDate, setViewingDate] = useState(null)

  const todayEntry   = history.find(h => h.date === today)
  const topicsToday  = getArticlesForDate(today)

  function selectArticle(article) {
    const entry = { date: today, articleId: article.id, title: article.title }
    const updated = [...history.filter(h => h.date !== today), entry]
    setHistory(updated)
    saveHistory(updated)
    setCurrent(article)
    setViewingDate(null)
  }

  function viewHistoryEntry(entry) {
    const article = articles.find(a => a.id === entry.articleId)
    if (article) { setCurrent(article); setViewingDate(entry.date) }
  }

  function goToToday() {
    if (todayEntry) {
      const article = articles.find(a => a.id === todayEntry.articleId)
      setCurrent(article ?? null)
    } else {
      setCurrent(null)
    }
    setViewingDate(null)
  }

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

  const showPicker = !currentArticle

  return (
    <div className="app">
      <header className="app-header">
        <button className="app-title-btn" onClick={goToToday}>
          <h1>Svenska Dagligen</h1>
          <p className="app-tagline">Läs · Lyssna · Lär</p>
        </button>
        <div className="app-header-date">
          {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </header>

      <div className="app-body">
        <aside className="panel-left">
          <DateHistory
            history={history}
            today={today}
            viewingDate={viewingDate}
            onSelectEntry={viewHistoryEntry}
            onToday={goToToday}
          />
        </aside>

        <main className="panel-center">
          {showPicker ? (
            <TopicPicker topics={topicsToday} onSelect={selectArticle} date={today} />
          ) : (
            <ArticleReader
              article={currentArticle}
              onAddToVocab={addToVocab}
              addedWords={new Set(vocab.map(v => v.word.toLowerCase()))}
            />
          )}
        </main>

        <aside className="panel-right">
          <VocabList vocab={vocab} onRemove={removeFromVocab} />
        </aside>
      </div>
    </div>
  )
}
