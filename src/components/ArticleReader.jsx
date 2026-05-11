import { useState, useRef, useEffect, useCallback } from 'react'
import { DIFFICULTY } from '../data/articles'
import * as tts from '../utils/tts'
import './ArticleReader.css'

const RATES = [
  { value: 0.65, label: 'Sakta' },
  { value: 0.82, label: 'Normal' },
  { value: 1.0,  label: 'Snabb' },
]

export default function ArticleReader({ article, onAddToVocab, addedWords }) {
  const [playingId, setPlayingId]     = useState(null)  // paragraph id, 'all', or null
  const [rate, setRate]               = useState(0.82)
  const [tooltip, setTooltip]         = useState(null)
  const [justAdded, setJustAdded]     = useState(null)  // word just added (flash feedback)
  const contentRef = useRef(null)

  // Stop audio when article changes
  useEffect(() => {
    tts.stop()
    setPlayingId(null)
    setTooltip(null)
  }, [article?.id])

  // Cleanup on unmount
  useEffect(() => () => tts.stop(), [])

  // Close tooltip on outside click
  useEffect(() => {
    function onDown(e) {
      if (!e.target.closest('.ar-tooltip')) setTooltip(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function playParagraph(para) {
    if (playingId === para.id) { tts.stop(); setPlayingId(null); return }
    setPlayingId(para.id)
    tts.speak(para.text, { rate, onEnd: () => setPlayingId(null) })
  }

  function playAll() {
    if (playingId === 'all') { tts.stop(); setPlayingId(null); return }
    const fullText = article.content.map(p => p.text).join('  ')
    setPlayingId('all')
    tts.speak(fullText, { rate, onEnd: () => setPlayingId(null) })
  }

  function changeRate(r) {
    setRate(r)
    // If currently playing, restart with new rate
    if (playingId) { tts.stop(); setPlayingId(null) }
  }

  // Word selection → floating tooltip
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (!text || text.length < 1 || text.length > 80) { setTooltip(null); return }
    if (!contentRef.current?.contains(selection.anchorNode)) { setTooltip(null); return }

    const range = selection.getRangeAt(0)
    const rect  = range.getBoundingClientRect()

    // Find containing sentence for context
    const allText = article.content.map(p => p.text).join(' ')
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const sentenceMatch = allText.match(new RegExp('[^.!?]*' + escaped + '[^.!?]*[.!?]?'))
    const context = sentenceMatch?.[0]?.trim() ?? ''

    setTooltip({
      text,
      context,
      // Fixed viewport coords
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }, [article])

  function handleAddToVocab() {
    if (!tooltip) return
    onAddToVocab(tooltip.text, tooltip.context)
    setJustAdded(tooltip.text)
    setTimeout(() => setJustAdded(null), 1800)
    setTooltip(null)
    window.getSelection()?.removeAllRanges()
  }

  if (!article) return null

  const diff = DIFFICULTY[article.difficulty]
  const alreadyInVocab = tooltip && addedWords.has(tooltip.text.toLowerCase())

  return (
    <article className="article-reader" onMouseUp={handleMouseUp}>

      {/* ── Header ── */}
      <header className="ar-header">
        <div className="ar-meta-row">
          <span className="ar-topic">{article.topicEmoji} {article.topicLabel}</span>
          <span className="ar-diff-badge" style={{ color: diff.color }}>
            {diff.emoji} {article.difficulty} · {diff.label}
          </span>
        </div>
        <h1 className="ar-title">{article.title}</h1>

        {/* Audio controls */}
        <div className="ar-controls">
          <button
            className={`ar-play-btn ${playingId === 'all' ? 'active' : ''}`}
            onClick={playAll}
            title={playingId === 'all' ? 'Stoppa' : 'Spela hela artikeln'}
          >
            {playingId === 'all' ? '⏹ Stoppa' : '▶ Spela allt'}
          </button>
          <div className="ar-rates">
            {RATES.map(r => (
              <button
                key={r.value}
                className={`ar-rate-btn ${rate === r.value ? 'active' : ''}`}
                onClick={() => changeRate(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          {!tts.isSupported() && (
            <span className="ar-tts-warn">⚠ Ljud stöds ej i den här webbläsaren</span>
          )}
        </div>

        <p className="ar-hint">Markera ett ord eller en fras för att lägga till det i din ordlista →</p>
      </header>

      {/* ── Article content ── */}
      <div className="ar-content" ref={contentRef}>
        {article.content.map(para => {
          const isSpeaking = playingId === para.id || playingId === 'all'
          return (
            <div key={para.id} className={`ar-para ${isSpeaking ? 'speaking' : ''}`}>
              <button
                className={`ar-para-btn ${playingId === para.id ? 'active' : ''}`}
                onClick={() => playParagraph(para)}
                title={playingId === para.id ? 'Stoppa' : 'Lyssna på detta stycke'}
              >
                {playingId === para.id ? '⏹' : '🔊'}
              </button>
              <p className="ar-para-text">{para.text}</p>
            </div>
          )
        })}
      </div>

      {/* ── Key vocabulary ── */}
      <section className="ar-vocab-section">
        <h2 className="ar-vocab-title">Nyckelord</h2>
        <div className="ar-vocab-grid">
          {article.keyVocab.map(item => {
            const added = addedWords.has(item.word.toLowerCase())
            return (
              <div key={item.word} className={`ar-vocab-item ${added ? 'added' : ''}`}>
                <div className="ar-vocab-row">
                  <span className="ar-vocab-word">{item.word}</span>
                  {!added ? (
                    <button
                      className="ar-vocab-add"
                      onClick={() => onAddToVocab(item.word, item.def)}
                      title="Lägg till i ordlistan"
                    >+</button>
                  ) : (
                    <span className="ar-vocab-check">✓</span>
                  )}
                </div>
                <p className="ar-vocab-def">{item.def}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Word selection tooltip ── */}
      {tooltip && (
        <div
          className="ar-tooltip"
          style={{ left: tooltip.x, top: tooltip.y - 10, transform: 'translate(-50%, -100%)' }}
        >
          <span className="ar-tooltip-word">„{tooltip.text}"</span>
          {alreadyInVocab ? (
            <span className="ar-tooltip-exists">Redan tillagd</span>
          ) : (
            <button className="ar-tooltip-add" onClick={handleAddToVocab}>
              + Ordlista
            </button>
          )}
        </div>
      )}

      {/* ── Just-added flash ── */}
      {justAdded && (
        <div className="ar-added-flash">
          „{justAdded}" tillagd i ordlistan
        </div>
      )}
    </article>
  )
}
