import { useState, useRef, useEffect, useCallback } from 'react'
import * as tts from '../utils/tts'
import * as ds from '../utils/deepseek'
import './PhaseRead.css'

export default function PhaseRead({ article, addToVocab, onUpdateVocab, onUpdateMnemonic, addedWords, isDone, onMarkDone }) {
  const [playingId, setPlayingId]         = useState(null)
  const [tooltip, setTooltip]             = useState(null)
  const [adding, setAdding]               = useState(false)
  const [justAdded, setJustAdded]         = useState(null)
  const [showTranslations, setShowTranslations] = useState(false)
  const contentRef = useRef(null)
  const hasTranslations = article.content.some(p => p.translation)

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

  const handleMouseUp = useCallback((e) => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (!text || text.length < 2 || text.length > 80) { setTooltip(null); return }
    if (!contentRef.current?.contains(selection.anchorNode)) { setTooltip(null); return }

    setTooltip({ text, x: e.clientX, y: e.clientY + 12 })
  }, [])

  async function handleAddToVocab() {
    if (!tooltip || adding) return
    setAdding(true)
    const word = tooltip.text
    const id = Date.now()

    // Add immediately with a quick Wiktionary/MyMemory result
    let translation = ''
    const INFLECTION_PATTERN = /\b(form of|degree of|inflection of|definite|plural|superlative|comparative|genitive|past tense|present tense)\b/i
    try {
      const wikiRes = await fetch(
        `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`
      )
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json()
        const firstDef = (wikiData['sv'] || [])[0]?.definitions?.[0]?.definition
        if (firstDef) {
          const clean = firstDef.replace(/<[^>]+>/g, '').trim()
          if (!INFLECTION_PATTERN.test(clean)) translation = clean
        }
      }
    } catch {}
    if (!translation) {
      try {
        const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=sv|en`)
        translation = (await r.json())?.responseData?.translatedText || ''
      } catch {}
    }

    addToVocab(word, translation, id)
    setJustAdded(word)
    setTimeout(() => setJustAdded(null), 1800)
    setTooltip(null)
    setAdding(false)
    window.getSelection()?.removeAllRanges()

    // Silently upgrade definition + generate mnemonic in background
    if (ds.getKey()) {
      ds.fetchDefinition(word)
        .then(def => {
          if (def) {
            onUpdateVocab?.(id, def)
            ds.fetchMnemonic(word, def)
              .then(m => { if (m) onUpdateMnemonic?.(id, m) })
              .catch(() => {})
          }
        })
        .catch(() => {})
    }
  }

  function handleAddKeyVocab(word, def) {
    const id = Date.now()
    addToVocab(word, def, id)
    if (ds.getKey() && onUpdateMnemonic) {
      ds.fetchMnemonic(word, def)
        .then(m => { if (m) onUpdateMnemonic(id, m) })
        .catch(() => {})
    }
  }

  async function handleGrammar() {
    if (!tooltip || tooltip.grammarLoading) return
    const phrase = tooltip.text
    const context = article.content.find(p => p.text.includes(phrase))?.text || phrase
    setTooltip(t => ({ ...t, grammarLoading: true, grammarExpl: null }))
    try {
      const expl = await ds.fetchGrammarExplanation(phrase, context)
      setTooltip(t => t ? { ...t, grammarLoading: false, grammarExpl: expl || 'Ingen förklaring hittades.' } : null)
    } catch {
      setTooltip(t => t ? { ...t, grammarLoading: false } : null)
    }
  }

  const alreadyInVocab = tooltip && addedWords.has(tooltip.text.toLowerCase())

  return (
    <div className="phase-read" onMouseUp={handleMouseUp}>
      <div className="pr-top-bar">
        <p className="pr-instructions">
          Läs igenom artikeln. Markera ett ord eller en fras för att lägga till det i din ordlista.
        </p>
        {hasTranslations && (
          <button
            className={`pr-translation-toggle ${showTranslations ? 'active' : ''}`}
            onClick={() => setShowTranslations(s => !s)}
          >
            {showTranslations ? '🇸🇪 Dölj översättning' : '🇬🇧 Visa översättning'}
          </button>
        )}
      </div>

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
            <div className="pr-para-body">
              <p className="pr-para-text">{para.text}</p>
              {showTranslations && para.translation && (
                <p className="pr-para-translation">{para.translation}</p>
              )}
            </div>
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
                      onClick={() => handleAddKeyVocab(item.word, item.def)}
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
          className={`pr-tooltip ${tooltip.grammarExpl ? 'has-expl' : ''}`}
          style={{ left: tooltip.x, top: tooltip.y + 8, transform: 'translate(-50%, 0)' }}
        >
          <div className="pr-tooltip-row">
            <span className="pr-tooltip-word">{tooltip.text}</span>
            {alreadyInVocab ? (
              <span className="pr-tooltip-exists">Redan tillagd</span>
            ) : (
              <button className="pr-tooltip-add" onClick={handleAddToVocab} disabled={adding}>
                {adding ? '…' : '+ Ordlista'}
              </button>
            )}
            {ds.getKey() && (
              <button
                className={`pr-tooltip-grammar ${tooltip.grammarLoading ? 'loading' : ''}`}
                onClick={handleGrammar}
                disabled={tooltip.grammarLoading}
              >
                {tooltip.grammarLoading ? '⏳' : '🧠 Grammatik'}
              </button>
            )}
          </div>
          {tooltip.grammarExpl && (
            <p className="pr-tooltip-expl">{tooltip.grammarExpl}</p>
          )}
        </div>
      )}

      {justAdded && (
        <div className="pr-added-flash">{justAdded} tillagd</div>
      )}
    </div>
  )
}
