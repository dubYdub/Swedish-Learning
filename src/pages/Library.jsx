import { useState, useEffect, useRef, useMemo } from 'react'
import { DIFFICULTY, estimateReadMinutes } from '../data/articles'
import { getArticleProgress, computeStats, computeStreak, PHASE_LABELS, PHASES } from '../utils/progress'
import { countAllRecordings } from '../utils/db'
import { loadToken, saveToken } from '../utils/timestamps'
import * as ds from '../utils/deepseek'
import * as srs from '../utils/srs'
import VocabList from '../components/VocabList'
import Flashcards from '../components/Flashcards'
import ArticleUploader from '../components/ArticleUploader'
import './Library.css'

const INFLECTION_RE = /\b(form of|degree of|inflection of|definite|plural|superlative|comparative|genitive|past tense|present tense)\b/i
const RING_COLORS = ['var(--text-dim)', 'var(--butter)', 'var(--blue)', 'var(--accent)', 'var(--pink)', 'var(--sage)']
const LEVEL_BG    = ['var(--bg-elevated)', 'var(--butter-bg)', 'var(--blue-bg)', 'var(--accent-bg)', 'var(--pink-bg)', 'var(--sage-bg)']

function RingChart({ counts, total }) {
  const R = 60, CX = 84, CY = 84
  const circ = 2 * Math.PI * R
  const nonEmpty = counts.filter(c => c > 0).length
  const GAP_DEG = nonEmpty > 1 ? 5 : 0
  const usableDeg = 360 - GAP_DEG * nonEmpty
  let startDeg = 0
  const arcs = []
  for (let l = 0; l <= 5; l++) {
    if (counts[l] === 0) continue
    const deg = (counts[l] / total) * usableDeg
    arcs.push({ level: l, arcLen: (deg / 360) * circ, startDeg })
    startDeg += deg + GAP_DEG
  }
  return (
    <svg viewBox="0 0 168 168" className="lib-ring-svg">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border-soft)" strokeWidth="14" />
      {total === 0
        ? <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border-soft)" strokeWidth="14" />
        : arcs.map(arc => (
          <circle
            key={arc.level}
            cx={CX} cy={CY} r={R}
            fill="none" stroke={RING_COLORS[arc.level]}
            strokeWidth="14"
            strokeDasharray={`${arc.arcLen} ${circ}`}
            transform={`rotate(${arc.startDeg - 90}, ${CX}, ${CY})`}
            strokeLinecap="butt"
          />
        ))
      }
      <text x={CX} y={CY - 5} textAnchor="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: '700', fill: 'var(--text-h)' }}>
        {total}
      </text>
      <text x={CX} y={CY + 20} textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', fill: 'var(--text-dim)' }}>
        ORD
      </text>
    </svg>
  )
}

function DictSidebar({ vocab, onStart }) {
  const counts = useMemo(() => {
    const c = Array(6).fill(0)
    vocab.forEach(v => c[Math.min(5, v.level ?? 0)]++)
    return c
  }, [vocab])
  const dueCount = useMemo(() => vocab.filter(v => srs.isDue(v)).length, [vocab])
  const total = vocab.length

  return (
    <div className="lib-dict-aside">
      <p className="lib-dict-aside-eyebrow">Minnesstatus</p>
      <div className="lib-ring-wrap">
        {total === 0
          ? <div className="lib-ring-empty"><p>Lägg till ord för att se statistik</p></div>
          : <RingChart counts={counts} total={total} />
        }
      </div>
      {total > 0 && (
        <div className="lib-ring-legend">
          {[0,1,2,3,4,5].map(l => counts[l] > 0 && (
            <div key={l} className="lib-ring-leg-row">
              <span className="lib-ring-dot" style={{ background: RING_COLORS[l] }} />
              <span className="lib-ring-count">{counts[l]}</span>
              <span className="lib-ring-label">{srs.LABELS[l]}</span>
            </div>
          ))}
        </div>
      )}
      <button
        className={`lib-dict-start-btn${dueCount === 0 && total > 0 ? ' done' : ''}`}
        onClick={onStart}
        disabled={total === 0}
      >
        {total === 0 ? 'Inga ord att öva'
          : dueCount > 0 ? `▶ Öva ${dueCount} ord`
          : 'Allt klart idag ✓'}
      </button>
    </div>
  )
}

function MiniQuickAdd({ vocab, onAdd, onUpdateContext, onUpdateMnemonic }) {
  const [word, setWord] = useState('')
  const [status, setStatus] = useState('idle')
  const hasDS = !!ds.getKey()

  async function handleAdd(e) {
    e?.preventDefault()
    const w = word.trim()
    if (!w || status === 'loading') return

    if (vocab.find(v => v.word.toLowerCase() === w.toLowerCase())) {
      setStatus('exists')
      setTimeout(() => setStatus('idle'), 2000)
      return
    }

    setStatus('loading')
    const id = Date.now()
    let definition = ''

    try {
      const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w.toLowerCase())}`)
      if (r.ok) {
        const d = await r.json()
        const raw = (d['sv'] || [])[0]?.definitions?.[0]?.definition
        if (raw) {
          const clean = raw.replace(/<[^>]+>/g, '').trim()
          if (!INFLECTION_RE.test(clean)) definition = clean
        }
      }
    } catch {}

    if (!definition) {
      try {
        const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(w)}&langpair=sv|en`)
        definition = (await r.json())?.responseData?.translatedText || ''
      } catch {}
    }

    onAdd(w, definition, id)
    setWord('')
    setStatus('added')
    setTimeout(() => setStatus('idle'), 1800)

    if (hasDS) {
      ds.fetchDefinition(w).then(def => {
        const best = def || definition
        if (def) onUpdateContext(id, def)
        if (best) ds.fetchMnemonic(w, best).then(m => { if (m) onUpdateMnemonic(id, m) }).catch(() => {})
      }).catch(() => {})
    }
  }

  return (
    <form className="mqa-form" onSubmit={handleAdd} noValidate>
      <p className="mqa-label">Lägg till ord</p>
      <div className="mqa-row">
        <input
          className="mqa-input"
          type="text"
          value={word}
          onChange={e => setWord(e.target.value)}
          placeholder="ett ord…"
          autoComplete="off"
          spellCheck={false}
          disabled={status === 'loading'}
        />
        <button
          className={`mqa-btn ${status === 'added' ? 'success' : ''} ${status === 'loading' ? 'loading' : ''}`}
          type="submit"
          disabled={!word.trim() || status === 'loading'}
        >
          {status === 'loading' ? '…' : status === 'added' ? '✓' : '+'}
        </button>
      </div>
      {status === 'exists' && <p className="mqa-exists">Finns redan</p>}
    </form>
  )
}

function QuickAdd({ vocab, onAdd, onUpdateContext, onUpdateMnemonic }) {
  const [word, setWord]       = useState('')
  const [context, setContext] = useState('')
  const [status, setStatus]   = useState('idle')
  const wordRef = useRef(null)
  const hasDS   = !!ds.getKey()

  async function handleSubmit(e) {
    e?.preventDefault()
    const w = word.trim()
    if (!w || status === 'loading') return

    if (vocab.find(v => v.word.toLowerCase() === w.toLowerCase())) {
      setStatus('exists')
      setTimeout(() => setStatus('idle'), 2200)
      return
    }

    setStatus('loading')
    const id = Date.now()
    let definition = context.trim()

    if (!definition) {
      try {
        const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w.toLowerCase())}`)
        if (r.ok) {
          const d = await r.json()
          const raw = (d['sv'] || [])[0]?.definitions?.[0]?.definition
          if (raw) {
            const clean = raw.replace(/<[^>]+>/g, '').trim()
            if (!INFLECTION_RE.test(clean)) definition = clean
          }
        }
      } catch {}
      if (!definition) {
        try {
          const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(w)}&langpair=sv|en`)
          definition = (await r.json())?.responseData?.translatedText || ''
        } catch {}
      }
    }

    onAdd(w, definition, id)
    setWord('')
    setContext('')
    setStatus('added')
    setTimeout(() => { setStatus('idle'); wordRef.current?.focus() }, 1800)

    if (hasDS) {
      ds.fetchDefinition(w).then(def => {
        const best = def || definition
        if (def) onUpdateContext(id, def)
        if (best) ds.fetchMnemonic(w, best).then(m => { if (m) onUpdateMnemonic(id, m) }).catch(() => {})
      }).catch(() => {})
    }
  }

  return (
    <form className="qa-form" onSubmit={handleSubmit} noValidate>
      <div className="qa-header">
        <p className="qa-title">Lägg till ord</p>
        {hasDS && <span className="qa-ai-badge">✦ AI-definition</span>}
      </div>
      <div className="qa-row">
        <div className="qa-word-wrap">
          <input
            ref={wordRef}
            className="qa-word"
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="ett ord…"
            autoComplete="off"
            spellCheck={false}
            disabled={status === 'loading'}
          />
        </div>
        <input
          className="qa-context"
          type="text"
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="kontext eller källa (valfritt)"
          disabled={status === 'loading'}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button
          className={`qa-submit${status === 'added' ? ' success' : ''}${status === 'loading' ? ' loading' : ''}`}
          type="submit"
          disabled={!word.trim() || status === 'loading'}
        >
          {status === 'loading' ? '…' : status === 'added' ? '✓ Tillagd' : '+ Lägg till'}
        </button>
      </div>
      {status === 'exists' && (
        <p className="qa-feedback qa-exists">Ordet finns redan i ordlistan.</p>
      )}
    </form>
  )
}

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ISSUE_NO = 4

export default function Library({
  articles, progress, vocab,
  onOpenArticle, onAddVocab, onRemoveVocab, onUpdateVocab, onUpdateMnemonic,
  onAnswerVocab, onPublishVocab, syncStatus, syncError,
  onEnrichVocab, enrichProgress,
  onAddCustomArticle, onRemoveArticle, onReprocessArticle,
}) {
  const today = localToday()
  const stats = computeStats(progress)
  const streak = computeStreak(progress, today)
  const [recordingCount, setRecordingCount] = useState(0)
  const [filterStatus, setFilterStatus]     = useState('all')
  const [vocabFilter, setVocabFilter]       = useState('all')
  const [activeTab, setActiveTab]           = useState('articles')
  const [flashMode, setFlashMode]           = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [tokenDraft, setTokenDraft]         = useState('')
  const [showUploader, setShowUploader]     = useState(false)
  const [reprocessing, setReprocessing]     = useState(null) // articleId being reprocessed

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

  const filteredVocab = useMemo(() => {
    if (vocabFilter === 'all') return vocab
    return vocab.filter(v => (v.level ?? 0) === vocabFilter)
  }, [vocab, vocabFilter])

  const vocabLevelCounts = useMemo(() => {
    const c = Array(6).fill(0)
    vocab.forEach(v => c[Math.min(5, v.level ?? 0)]++)
    return c
  }, [vocab])

  async function handleAddCustom(articleData, audioBlob) {
    await onAddCustomArticle(articleData, audioBlob)
    setShowUploader(false)
  }

  async function handleReprocess(articleId) {
    setReprocessing(articleId)
    await onReprocessArticle(articleId)
    setReprocessing(null)
  }

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
                <button className="lib-sync-btn ok" onClick={confirmToken} disabled={!tokenDraft.trim()}>✓ Spara</button>
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

      <div className={`lib-body ${activeTab === 'dictionary' ? (flashMode ? 'dict-flash' : 'dict-active') : ''}`}>
        <main className="lib-main">
          {/* ── Dashboard ── */}
          {activeTab === 'articles' && (
            <section className="lib-dashboard">
              <p className="lib-section-eyebrow">— Studierapport —</p>
              <div className="lib-stats-row">
                <StatBlock value={streak} label="Streak" hot={streak >= 2} idx={0} />
                <StatBlock value={stats.completed} label="Klara" idx={1} />
                <StatBlock value={stats.inProgress} label="Pågående" accent="blue" idx={2} />
                <StatBlock value={recordingCount} label="Inspelningar" accent="pink" idx={3} />
                <StatBlock value={vocab.length} label="Ord" accent="butter" idx={4} />
                <StatBlock value={stats.totalStudyMin} label="Minuter" idx={5} />
              </div>
            </section>
          )}

          {/* ── Dictionary tab ── */}
          {activeTab === 'dictionary' && (
            flashMode ? (
              <Flashcards vocab={vocab} onAnswer={onAnswerVocab} onExit={() => setFlashMode(false)} />
            ) : (
              <section className="lib-dict">
                <QuickAdd
                  vocab={vocab}
                  onAdd={onAddVocab}
                  onUpdateContext={onUpdateVocab}
                  onUpdateMnemonic={onUpdateMnemonic}
                />
                <div className="lib-dict-head">
                  <h2 className="lib-toc-title">Ordlista</h2>
                  {vocab.length > 0 && ds.getKey() && (() => {
                    const missing = vocab.filter(v => !v.context || !v.mnemonic).length
                    return (
                      <button
                        className={`lib-enrich-btn${enrichProgress ? ' loading' : ''}`}
                        onClick={onEnrichVocab}
                        disabled={!!enrichProgress || missing === 0}
                        title={missing === 0 ? 'Alla ord har definitioner och minnestips' : `Berika ${missing} ord med AI`}
                      >
                        {enrichProgress
                          ? `✦ ${enrichProgress.done}/${enrichProgress.total}`
                          : missing === 0
                            ? '✦ Klart'
                            : `✦ Berika (${missing})`}
                      </button>
                    )
                  })()}
                </div>

                {/* Level filter chips */}
                {vocab.length > 0 && (
                  <div className="dict-vocab-filters">
                    <button
                      className={`dict-vocab-chip ${vocabFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setVocabFilter('all')}
                    >
                      Alla <span className="dict-chip-count">{vocab.length}</span>
                    </button>
                    {[0,1,2,3,4,5].map(l => vocabLevelCounts[l] > 0 && (
                      <button
                        key={l}
                        className={`dict-vocab-chip ${vocabFilter === l ? 'active' : ''}`}
                        style={{ '--chip-color': RING_COLORS[l], '--chip-bg': LEVEL_BG[l] }}
                        onClick={() => setVocabFilter(vocabFilter === l ? 'all' : l)}
                      >
                        <span className="dict-chip-dot" style={{ background: RING_COLORS[l] }} />
                        {srs.LABELS[l]}
                        <span className="dict-chip-count">{vocabLevelCounts[l]}</span>
                      </button>
                    ))}
                  </div>
                )}

                {vocab.length === 0 ? (
                  <p className="lib-empty">
                    Inga ord sparade än. Markera ett ord i läsfasen för att lägga till det här.
                  </p>
                ) : filteredVocab.length === 0 ? (
                  <p className="lib-empty">Inga ord på denna nivå.</p>
                ) : (
                  <div className="lib-dict-list" key={vocabFilter}>
                    {filteredVocab.map((item, idx) => (
                      <div
                        key={item.id}
                        className="lib-dict-row"
                        style={{ '--i': idx }}
                      >
                        <div className="lib-dict-word-wrap">
                          <span className="lib-dict-word">{item.word}</span>
                          <span
                            className="dict-level-badge"
                            data-level={item.level ?? 0}
                            style={{ '--badge-color': RING_COLORS[item.level ?? 0], '--badge-bg': LEVEL_BG[item.level ?? 0] }}
                          >
                            {srs.LABELS[item.level ?? 0]}
                          </span>
                        </div>
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
          {activeTab === 'articles' && (
            <section className="lib-toc">
              <div className="lib-toc-head">
                <h2 className="lib-toc-title">Innehåll</h2>
                <div className="lib-toc-actions">
                  <div className="lib-filters">
                    {[
                      { id: 'all',         label: 'Alla' },
                      { id: 'in-progress', label: 'Pågående' },
                      { id: 'completed',   label: 'Klara' },
                      { id: 'not-started', label: 'Ej startade' },
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
                  <button
                    className={`lib-new-article-btn ${showUploader ? 'active' : ''}`}
                    onClick={() => setShowUploader(v => !v)}
                  >
                    {showUploader ? '✕ Stäng' : '+ Ny Artikel'}
                  </button>
                </div>
              </div>

              {showUploader && (
                <div className="lib-uploader-wrap">
                  <ArticleUploader onAdd={handleAddCustom} />
                </div>
              )}

              <div className="lib-toc-list" key={filterStatus}>
                {filtered.length === 0 ? (
                  <p className="lib-empty">Inga artiklar matchar filtret.</p>
                ) : (
                  filtered.map((article, idx) => {
                    const prog = getArticleProgress(progress, article.id)
                    const diff = DIFFICULTY[article.difficulty]
                    const num = String(articles.findIndex(a => a.id === article.id) + 1).padStart(2, '0')
                    return (
                      <div key={article.id} className={`lib-toc-row status-${prog.status}`} style={{ '--i': idx }}>
                        <button
                          className="lib-toc-row-inner"
                          onClick={() => onOpenArticle(article.id)}
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
                              {article.isCustom && (
                                <span className="lib-custom-badge">Anpassad</span>
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
                        {article.isCustom && (
                          <button
                            className={`lib-article-reprocess ${reprocessing === article.id ? 'loading' : ''}`}
                            onClick={e => { e.stopPropagation(); handleReprocess(article.id) }}
                            title={ds.getKey() ? 'Analysera om med AI' : 'Ange DeepSeek-nyckel (🔑) för att analysera'}
                            aria-label="Analysera om med AI"
                            disabled={reprocessing === article.id}
                          >
                            {reprocessing === article.id ? '…' : '✦'}
                          </button>
                        )}
                        <button
                          className="lib-article-delete"
                          onClick={e => { e.stopPropagation(); onRemoveArticle(article.id) }}
                          title="Ta bort artikel"
                          aria-label="Ta bort artikel"
                        >×</button>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          )}

          <footer className="lib-footer">
            <span className="metadata">Continued on the next page →</span>
            <span className="metadata">{articles.length} artiklar i denna utgåva</span>
          </footer>
        </main>

        <aside className="lib-sidebar">
          {activeTab === 'dictionary' && !flashMode
            ? <DictSidebar
                vocab={vocab}
                onStart={() => setFlashMode(true)}
              />
            : (
              <div className="lib-sidebar-articles">
                <MiniQuickAdd
                  vocab={vocab}
                  onAdd={onAddVocab}
                  onUpdateContext={onUpdateVocab}
                  onUpdateMnemonic={onUpdateMnemonic}
                />
                <VocabList vocab={vocab} onRemove={onRemoveVocab} onUpdateVocab={onUpdateVocab} />
              </div>
            )
          }
        </aside>
      </div>
    </div>
  )
}

function StatBlock({ value, label, accent = 'accent', hot, idx = 0 }) {
  return (
    <div className={`lib-stat accent-${accent}`} style={{ '--i': idx }}>
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
