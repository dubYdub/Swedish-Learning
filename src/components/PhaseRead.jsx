import { useState, useRef, useEffect, useCallback } from 'react'
import * as tts from '../utils/tts'
import './PhaseRead.css'

export default function PhaseRead({ article, addToVocab, addedWords, isDone, onMarkDone }) {
  const [playingId, setPlayingId] = useState(null)
  const [tooltip, setTooltip]     = useState(null)
  const [justAdded, setJustAdded] = useState(null)
  const contentRef = useRef(null)

  useEffect(() => () => tts.stop(), [])

  useEffect(() => {
    function onDown(e) {
      if (!e.target.closest('.pr-tooltip')) setTooltip(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function playParagraph(para) {
    if (playingId === para.id) { tts.stop(); setPlayingId(null); return }
    setPlayingId(para.id)
    tts.speak(para.text, { onEnd: () => setPlayingId(null) })
  }

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (!text || text.length < 1 || text.length > 80) { setTooltip(null); return }
    if (!contentRef.current?.contains(selection.anchorNode)) { setTooltip(null); return }

    const range = selection.getRangeAt(0)
    const rect  = range.getBoundingClientRect()
    const allText = article.content.map(p => p.text).join(' ')
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const sentenceMatch = allText.match(new RegExp('[^.!?]*' + escaped + '[^.!?]*[.!?]?'))
    const context = sentenceMatch?.[0]?.trim() ?? ''

    setTooltip({
      text,
      context,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }, [article])

  function handleAddToVocab() {
    if (!tooltip) return
    addToVocab(tooltip.text, tooltip.context)
    setJustAdded(tooltip.text)
    setTimeout(() => setJustAdded(null), 1800)
    setTooltip(null)
    window.getSelection()?.removeAllRanges()
  }

  const alreadyInVocab = tooltip && addedWords.has(tooltip.text.toLowerCase())

  return (
    <div className="phase-read" onMouseUp={handleMouseUp}>
      <p className="pr-instructions">
        Läs igenom artikeln. Markera ett ord eller en fras för att lägga till det i din ordlista, eller använd nyckelorden nedan.
      </p>

      {/* Article content */}
      <div className="pr-content" ref={contentRef}>
        {article.content.map(para => (
          <div key={para.id} className={`pr-para ${playingId === para.id ? 'speaking' : ''}`}>
            <button
              className={`pr-para-btn ${playingId === para.id ? 'active' : ''}`}
              onClick={() => playParagraph(para)}
              title={playingId === para.id ? 'Stoppa' : 'Lyssna på stycket'}
            >
              {playingId === para.id ? '⏹' : '🔊'}
            </button>
            <p className="pr-para-text">{para.text}</p>
          </div>
        ))}
      </div>

      {/* Key vocabulary */}
      <section className="pr-vocab-section">
        <h2 className="pr-vocab-title">Nyckelord</h2>
        <div className="pr-vocab-grid">
          {article.keyVocab.map(item => {
            const added = addedWords.has(item.word.toLowerCase())
            return (
              <div key={item.word} className={`pr-vocab-item ${added ? 'added' : ''}`}>
                <div className="pr-vocab-row">
                  <span className="pr-vocab-word">{item.word}</span>
                  {!added ? (
                    <button
                      className="pr-vocab-add"
                      onClick={() => addToVocab(item.word, item.def)}
                      title="Lägg till"
                    >+</button>
                  ) : (
                    <span className="pr-vocab-check">✓</span>
                  )}
                </div>
                <p className="pr-vocab-def">{item.def}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Mark done */}
      <div className={`phase-done-bar ${isDone ? 'done' : ''}`}>
        <p>{isDone ? 'Du har markerat den här fasen som klar.' : 'Klar med läsningen?'}</p>
        <button className={`phase-done-btn ${isDone ? 'done' : ''}`} onClick={onMarkDone}>
          {isDone ? '✓ Klar' : 'Markera som klar'}
        </button>
      </div>

      {/* Word selection tooltip */}
      {tooltip && (
        <div
          className="pr-tooltip"
          style={{ left: tooltip.x, top: tooltip.y - 10, transform: 'translate(-50%, -100%)' }}
        >
          <span className="pr-tooltip-word">„{tooltip.text}"</span>
          {alreadyInVocab ? (
            <span className="pr-tooltip-exists">Redan tillagd</span>
          ) : (
            <button className="pr-tooltip-add" onClick={handleAddToVocab}>+ Ordlista</button>
          )}
        </div>
      )}

      {justAdded && (
        <div className="pr-added-flash">„{justAdded}" tillagd</div>
      )}
    </div>
  )
}
