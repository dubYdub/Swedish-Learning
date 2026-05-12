import { useState, useEffect } from 'react'
import { DIFFICULTY, estimateReadMinutes } from '../data/articles'
import { getArticleProgress, computeStats, computeStreak, PHASE_LABELS, PHASES } from '../utils/progress'
import { countAllRecordings } from '../utils/db'
import { loadToken, saveToken } from '../utils/timestamps'
import { getKey as dsKeySet } from '../utils/deepseek'
import VocabList from '../components/VocabList'
import Flashcards from '../components/Flashcards'
import './Library.css'

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ISSUE_NO = 4 // editorial flair — could increment monthly

export default function Library({ articles, progress, vocab, onOpenArticle, onRemoveVocab, onUpdateVocab, onAnswerVocab, onPublishVocab, syncStatus, syncError, onGenerateMnemonics, generatingMnemonics }) {
  const today = localToday()
  const stats = computeStats(progress)
  const streak = computeStreak(progress, today)
  const [recordingCount, setRecordingCount] = useState(0)
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('articles')   // 'articles' | 'dictionary'
  const [flashMode, setFlashMode] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [tokenDraft, setTokenDraft] = useState('')

  function handleSyncClick() {
    if (!loadToken()) { setShowTokenInput(true); setTokenDraft(''); return }
    onPublishVocab()
  }

  function confirmToken() {
    const t = tokenDraft.trim()
    if (!t) return
    saveToken(t)
    setShowTokenInput(false)
    setTokenDraft('')
    onPublishVocab()
  }

  useEffect(() => {
    countAllRecordings().then(setRecordingCount).catch(() => setRecordingCount(0))
  }, [progress])

  const filtered = articles.filter(a => {
    if (filterStatus === 'all') return true
    return getArticleProgress(progress, a.id).status === filterStatus
  })

  return (
    <div className="library">
      {/* ── Masthead ── */}
      <header className="lib-masthead">
        <div className="lib-mast-top">
          <span className="metadata">No. {ISSUE_NO}</span>
          <span className="metadata">
            {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <div className="lib-sync-wrap">
            {showTokenInput ? (
              <>
                <input
                  className="lib-token-input"
                  type="password"
                  value={tokenDraft}
                  onChange={e => setTokenDraft(e.target.value)}
                  placeholder="GitHub token (ghp_...)"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && tokenDraft.trim()) confirmToken()
                    if (e.key === 'Escape') setShowTokenInput(false)
                  }}
                />
                <button className="lib-sync-btn ok" onClick={confirmToken} disabled={!tokenDraft.trim()}>
                  ✓ Spara
                </button>
                <button className="lib-sync-btn" onClick={() => setShowTokenInput(false)}>✕</button>
              </>
            ) : (
              <>
                {syncStatus === 'error' && (
                  <span className="lib-sync-error" title={syncError}>⚠ {syncError}</span>
                )}
                <button
                  className={`lib-sync-btn ${syncStatus === 'ok' ? 'ok' : ''}`}
                  onClick={handleSyncClick}
                  disabled={syncStatus === 'pending'}
                  title="Publicera ordlistan till GitHub så alla enheter synkas"
                >
                  {syncStatus === 'pending' ? '⏳ Synkar…'
                    : syncStatus === 'ok'   ? '✓ Synkad'
                    : '🌐 Synka ordlista'}
                </button>
              </>
            )}
          </div>
        </div>
        <h1 className="lib-title">Svenska Dagligen</h1>
        <p className="lib-tagline">A reader for students of the Swedish language · Issue {ISSUE_NO}</p>
        <div className="lib-mast-rule" />
      </header>

      {/* Tab bar */}
      <div className="lib-tabs">
        <span className="lib-tab-indicator" style={{ '--tab-i': activeTab === 'dictionary' ? 1 : 0 }} />
        <button
          className={`lib-tab ${activeTab === 'articles' ? 'active' : ''}`}
          onClick={() => { setActiveTab('articles'); setFlashMode(false) }}
        >
          <span className="lib-tab-icon">📰</span> Artiklar
        </button>
        <button
          className={`lib-tab ${activeTab === 'dictionary' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dictionary'); setFlashMode(false) }}
        >
          <span className="lib-tab-icon">📖</span> Ordlista {vocab.length > 0 && <span className="lib-tab-count">{vocab.length}</span>}
        </button>
      </div>

      <div className={`lib-body ${activeTab === 'dictionary' ? 'dict-active' : ''}`}>
        <main className="lib-main">
          {/* ── Dashboard ── */}
          <section className="lib-dashboard">
            <p className="lib-section-eyebrow">— Studierapport —</p>
            <div className="lib-stats-row">
              <StatBlock value={streak} label="Streak" hot={streak >= 2} />
              <StatBlock value={stats.completed} label="Klara" />
              <StatBlock value={stats.inProgress} label="Pågående" accent="blue" />
              <StatBlock value={recordingCount} label="Inspelningar" accent="pink" />
              <StatBlock value={vocab.length} label="Ord" accent="butter" />
              <StatBlock value={stats.totalStudyMin} label="Minuter" />
            </div>
          </section>

          {/* ── Dictionary tab ── */}
          {activeTab === 'dictionary' && (
            flashMode ? (
              <Flashcards vocab={vocab} onAnswer={onAnswerVocab} onExit={() => setFlashMode(false)} />
            ) : (
              <section className="lib-dict">
                <div className="lib-dict-head">
                  <h2 className="lib-toc-title">Ordlista</h2>
                  <div className="lib-dict-actions">
                    {vocab.length > 0 && dsKeySet() && (() => {
                      const missing = vocab.filter(v => !v.mnemonic).length
                      return missing > 0 ? (
                        <button
                          className="lib-mnemonic-btn"
                          onClick={onGenerateMnemonics}
                          disabled={generatingMnemonics}
                        >
                          {generatingMnemonics ? '⏳ Genererar…' : `🧠 Minnestips (${missing})`}
                        </button>
                      ) : null
                    })()}
                    {vocab.length > 0 && (
                      <button className="lib-flash-btn" onClick={() => setFlashMode(true)}>
                        ▶ Starta Flashcards ({vocab.length} ord)
                      </button>
                    )}
                  </div>
                </div>
                {vocab.length === 0 ? (
                  <p className="lib-empty">
                    Inga ord sparade än. Markera ett ord i läsfasen för att lägga till det här.
                  </p>
                ) : (
                  <div className="lib-dict-list">
                    {vocab.map(item => (
                      <div key={item.id} className="lib-dict-row">
                        <span className="lib-dict-word">{item.word}</span>
                        <span className="lib-dict-def">{item.context}</span>
                        <button
                          className="lib-dict-remove"
                          onClick={() => onRemoveVocab(item.id)}
                          title="Ta bort"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          )}

          {/* ── Table of contents ── */}
          {activeTab === 'articles' && <section className="lib-toc">
            <div className="lib-toc-head">
              <h2 className="lib-toc-title">Innehåll</h2>
              <div className="lib-filters">
                {[
                  { id: 'all',          label: 'Alla' },
                  { id: 'in-progress',  label: 'Pågående' },
                  { id: 'completed',    label: 'Klara' },
                  { id: 'not-started',  label: 'Ej startade' },
                ].map(f => (
                  <button
                    key={f.id}
                    className={`lib-filter ${filterStatus === f.id ? 'active' : ''}`}
                    onClick={() => setFilterStatus(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lib-toc-list" key={filterStatus}>
              {filtered.length === 0 ? (
                <p className="lib-empty">Inga artiklar matchar filtret.</p>
              ) : (
                filtered.map((article, idx) => {
                  const prog = getArticleProgress(progress, article.id)
                  const diff = DIFFICULTY[article.difficulty]
                  // Use article id hash so number is stable per article
                  const num = String(articles.findIndex(a => a.id === article.id) + 1).padStart(2, '0')
                  return (
                    <button
                      key={article.id}
                      className={`lib-toc-row status-${prog.status}`}
                      onClick={() => onOpenArticle(article.id)}
                      style={{ '--i': idx }}
                    >
                      <span className="lib-row-num">No. {num}</span>

                      <div className="lib-row-body">
                        <div className="lib-row-meta">
                          <span className="lib-row-topic">{article.topicEmoji} {article.topicLabel}</span>
                          <span className="lib-row-diff" data-level={article.difficulty}>
                            {diff.emoji} {article.difficulty} · {diff.label}
                          </span>
                          <span className="lib-row-time metadata">{estimateReadMinutes(article)} min</span>
                          {prog.recordingCount > 0 && (
                            <span className="lib-row-recs">🎙 ×{prog.recordingCount}</span>
                          )}
                        </div>

                        <h3 className="lib-row-title">{article.title}</h3>
                        <p className="lib-row-summary">{article.summary}</p>

                        <div className="lib-row-foot">
                          <div className="lib-row-phases">
                            {PHASES.map(p => (
                              <span
                                key={p}
                                className={`lib-phase-pip ${prog.phases[p] ? 'done' : ''}`}
                                title={PHASE_LABELS[p].label}
                              >
                                <span className="lib-phase-emoji">{PHASE_LABELS[p].emoji}</span>
                                <span className="lib-phase-name">{PHASE_LABELS[p].label}</span>
                              </span>
                            ))}
                          </div>
                          <StatusBadge status={prog.status} />
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </section>

          } {/* end activeTab === 'articles' */}

          <footer className="lib-footer">
            <span className="metadata">Continued on the next page →</span>
            <span className="metadata">{articles.length} artiklar i denna utgåva</span>
          </footer>
        </main>

        <aside className="lib-sidebar">
          <VocabList vocab={vocab} onRemove={onRemoveVocab} onUpdateVocab={onUpdateVocab} />
        </aside>
      </div>
    </div>
  )
}

function StatBlock({ value, label, accent = 'accent', hot }) {
  return (
    <div className={`lib-stat accent-${accent}`}>
      <span className="lib-stat-value">{value}</span>
      <span className="lib-stat-label">{hot && '🔥 '}{label}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'completed')   return <span className="lib-badge badge-completed">Klar</span>
  if (status === 'in-progress') return <span className="lib-badge badge-progress">Pågående</span>
  return <span className="lib-badge badge-new">Ny</span>
}
