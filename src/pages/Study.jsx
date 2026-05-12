import { useState, useEffect, useCallback } from 'react'
import { DIFFICULTY } from '../data/articles'
import { getArticleProgress, markPhase, addStudyTime, PHASES, PHASE_LABELS } from '../utils/progress'
import { countRecordings } from '../utils/db'
import * as tts from '../utils/tts'
import PhaseListen from '../components/PhaseListen'
import PhaseRead from '../components/PhaseRead'
import PhaseShadow from '../components/PhaseShadow'
import PhaseRecord from '../components/PhaseRecord'
import VoicePicker from '../components/VoicePicker'
import VocabList from '../components/VocabList'
import './Study.css'

const CHAPTERS = {
  listen: 'I',
  read:   'II',
  shadow: 'III',
  record: 'IV',
}

export default function Study({ article, progress, updateProgress, vocab, addToVocab, removeFromVocab, updateVocabContext, updateVocabMnemonic, onBack }) {
  const [activePhase, setActivePhase] = useState('read')
  const studyStartRef = useState(() => ({ start: Date.now() }))[0]

  const articleProgress = getArticleProgress(progress, article.id)
  const diff = DIFFICULTY[article.difficulty]

  // Stop TTS when leaving / unmounting / changing article
  useEffect(() => {
    return () => tts.stop()
  }, [article.id])

  // Record study time when leaving
  useEffect(() => {
    return () => {
      const seconds = Math.round((Date.now() - studyStartRef.start) / 1000)
      if (seconds > 5) {
        updateProgress(prev => addStudyTime(prev, article.id, seconds))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const togglePhaseDone = useCallback((phase) => {
    const current = !!articleProgress.phases[phase]
    updateProgress(prev => markPhase(prev, article.id, phase, !current))
  }, [article.id, articleProgress.phases, updateProgress])

  function handleBack() {
    tts.stop()
    onBack()
  }

  return (
    <div className="study">
      {/* ── Header ── */}
      <header className="st-header">
        <div className="st-header-top">
          <button className="st-back-btn" onClick={handleBack}>
            ← Tillbaka till biblioteket
          </button>
          <span className="metadata st-issue-meta">Svenska Dagligen · Artikel</span>
          <VoicePicker />
        </div>

        <div className="st-article-meta">
          <span className="st-meta-item">{article.topicEmoji} {article.topicLabel}</span>
          <span className="st-meta-sep">·</span>
          <span className="st-meta-item" style={{ color: diff.color }}>
            {diff.emoji} {article.difficulty} — {diff.label}
          </span>
        </div>

        <h1 className="st-title">{article.title}</h1>

        {/* ── Phase tabs as chapters ── */}
        <nav className="st-phases">
          {PHASES.map(p => {
            const isActive = activePhase === p
            const isDone = articleProgress.phases[p]
            return (
              <button
                key={p}
                className={`st-phase-btn ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                onClick={() => setActivePhase(p)}
              >
                <span className="st-phase-chapter">Kapitel {CHAPTERS[p]}</span>
                <span className="st-phase-name">
                  <span className="st-phase-emoji">{PHASE_LABELS[p].emoji}</span>
                  {PHASE_LABELS[p].label}
                  {isDone && <span className="st-phase-check">✓</span>}
                </span>
              </button>
            )
          })}
        </nav>
      </header>

      {/* ── Body ── */}
      <div className="st-body">
        <main className="st-main">
          {activePhase === 'listen' && (
            <PhaseListen
              article={article}
              isDone={articleProgress.phases.listen}
              onMarkDone={() => togglePhaseDone('listen')}
            />
          )}
          {activePhase === 'read' && (
            <PhaseRead
              article={article}
              addToVocab={addToVocab}
              onUpdateVocab={updateVocabContext}
              onUpdateMnemonic={updateVocabMnemonic}
              addedWords={new Set(vocab.map(v => v.word.toLowerCase()))}
              isDone={articleProgress.phases.read}
              onMarkDone={() => togglePhaseDone('read')}
            />
          )}
          {activePhase === 'shadow' && (
            <PhaseShadow
              article={article}
              isDone={articleProgress.phases.shadow}
              onMarkDone={() => togglePhaseDone('shadow')}
            />
          )}
          {activePhase === 'record' && (
            <PhaseRecord
              article={article}
              updateProgress={updateProgress}
              isDone={articleProgress.phases.record}
              onMarkDone={() => togglePhaseDone('record')}
            />
          )}
        </main>

        <aside className="st-sidebar">
          <VocabList vocab={vocab} onRemove={removeFromVocab} onUpdateVocab={updateVocabContext} />
        </aside>
      </div>
    </div>
  )
}
