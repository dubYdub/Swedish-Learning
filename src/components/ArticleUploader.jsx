import { useState, useRef, useCallback } from 'react'
import * as ds from '../utils/deepseek'
import './ArticleUploader.css'

function buildArticle(parsed, slug) {
  return {
    id:         slug,
    topic:      parsed.topic,
    topicLabel: parsed.topicLabel,
    topicEmoji: parsed.topicEmoji,
    difficulty: parsed.difficulty,
    title:      parsed.title,
    summary:    parsed.summary,
    content:    parsed.content,
    keyVocab:   [],
    isCustom:   true,
  }
}

export default function ArticleUploader({ onAdd }) {
  const [rawText, setRawText]   = useState('')
  const [audioUrl, setAudioUrl] = useState('')   // remote URL
  const [audioFile, setAudioFile] = useState(null) // local file
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus]     = useState('idle') // idle | parsing | confirming | submitting | done
  const [parsed, setParsed]     = useState(null)
  const [parseError, setParseError] = useState('')
  const audioInputRef = useRef(null)
  const hasDS = !!ds.getKey()

  // URL input clears file and vice-versa so only one audio source is active
  function handleUrlChange(e) {
    setAudioUrl(e.target.value)
    if (e.target.value.trim()) setAudioFile(null)
  }

  function handleAudioChange(e) {
    const file = e.target.files?.[0]
    if (file) { setAudioFile(file); setAudioUrl('') }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file && /\.(mp3|m4a|wav|ogg|aac)$/i.test(file.name)) {
      setAudioFile(file)
      setAudioUrl('')
    }
  }, [])

  async function handleGenerate() {
    if (!rawText.trim()) return
    setStatus('parsing')
    setParseError('')
    setParsed(null)
    try {
      const result = await ds.fetchArticleParse(rawText)
      if (!result) {
        setParseError('Parsning misslyckades. Kontrollera din DeepSeek-nyckel och försök igen.')
        setStatus('idle')
        return
      }
      setParsed(result)
      setStatus('confirming')
    } catch (err) {
      setParseError(err.message || 'Okänt fel')
      setStatus('idle')
    }
  }

  function handleReset() {
    setParsed(null)
    setStatus('idle')
    setParseError('')
  }

  function reset() {
    setStatus('idle')
    setRawText('')
    setAudioUrl('')
    setAudioFile(null)
    setParsed(null)
  }

  async function handleSubmit() {
    if (!parsed) return
    setStatus('submitting')
    const slug = 'custom-' + Date.now()
    const article = buildArticle(parsed, slug)
    if (audioUrl.trim()) article.audioUrl = audioUrl.trim()
    await onAdd(article, audioFile ?? null)
    setStatus('done')
    setTimeout(reset, 2000)
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (!rawText.trim()) return
    setStatus('submitting')
    const slug = 'custom-' + Date.now()
    const paragraphs = rawText.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    const article = {
      id: slug, topic: 'other', topicLabel: 'Övrigt', topicEmoji: '📄',
      difficulty: 'B1', title: paragraphs[0]?.slice(0, 60) || 'Ny artikel',
      summary: '', keyVocab: [], isCustom: true,
      content: paragraphs.map((text, i) => ({ id: `${slug}-${i + 1}`, text, translation: '' })),
    }
    if (audioUrl.trim()) article.audioUrl = audioUrl.trim()
    onAdd(article, audioFile ?? null).then(() => {
      setStatus('done')
      setTimeout(reset, 2000)
    })
  }

  const activeAudioSrc = audioUrl.trim() || (audioFile ? audioFile.name : null)

  return (
    <div className="au-form">

      {/* ── Audio source ── */}
      <div className="au-audio-section">
        {/* URL input */}
        <div className="au-field">
          <label className="au-label">Länk till ljud (URL)</label>
          <div className="au-url-row">
            <input
              className="au-url-input"
              type="url"
              value={audioUrl}
              onChange={handleUrlChange}
              placeholder="https://…"
              spellCheck={false}
            />
            {audioUrl && (
              <button className="au-url-clear" type="button" onClick={() => setAudioUrl('')}>×</button>
            )}
          </div>
        </div>

        {/* OR divider */}
        <div className="au-or-divider"><span>eller</span></div>

        {/* File dropzone */}
        <div
          className={`au-dropzone ${dragOver ? 'drag-over' : ''} ${audioFile ? 'has-file' : ''} ${audioUrl ? 'disabled' : ''}`}
          onDragOver={e => { if (!audioUrl) { e.preventDefault(); setDragOver(true) } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => { if (!audioUrl) audioInputRef.current?.click() }}
        >
          <input
            ref={audioInputRef}
            type="file"
            accept=".mp3,.m4a,.wav,.ogg,.aac"
            className="au-file-input"
            onChange={handleAudioChange}
          />
          {audioFile ? (
            <div className="au-file-preview">
              <span className="au-file-icon">🎵</span>
              <span className="au-file-name">{audioFile.name}</span>
              <button
                type="button" className="au-file-clear"
                onClick={e => { e.stopPropagation(); setAudioFile(null) }}
              >×</button>
            </div>
          ) : (
            <p className="au-dropzone-hint">
              {audioUrl ? 'URL angiven ovan' : <><span>Klicka eller dra</span> en ljudfil hit</>}
              <br /><span className="au-dropzone-sub">.mp3 · .m4a · .wav</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Text ── */}
      {status !== 'confirming' && (
        <div className="au-field">
          <label className="au-label">Svenska stycken</label>
          <textarea
            className="au-textarea"
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Klistra in den svenska texten här. Separera stycken med en tom rad."
            rows={7}
            disabled={status === 'parsing' || status === 'submitting'}
          />
        </div>
      )}

      {parseError && <p className="au-error">{parseError}</p>}

      {/* ── AI preview ── */}
      {status === 'confirming' && parsed && (
        <div className="au-parsed">
          <div className="au-parsed-header">
            <div className="au-parsed-meta">
              <span className="au-parsed-emoji">{parsed.topicEmoji}</span>
              <span className="au-parsed-topic">{parsed.topicLabel}</span>
              <span className="au-parsed-diff" data-level={parsed.difficulty}>{parsed.difficulty}</span>
            </div>
            <div className="au-parsed-right">
              {activeAudioSrc && (
                <span className="au-parsed-audio-hint">🎵 {audioUrl ? 'URL' : audioFile?.name}</span>
              )}
              <button className="au-parsed-reset" onClick={handleReset}>↺ Ändra text</button>
            </div>
          </div>
          <p className="au-parsed-title-text">{parsed.title}</p>
          {parsed.summary && <p className="au-parsed-summary">{parsed.summary}</p>}
          <div className="au-paragraphs">
            {parsed.content.map(p => (
              <div key={p.id} className="au-para-row">
                <p className="au-para-sv">{p.text}</p>
                {p.translation && <p className="au-para-tr-read">{p.translation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="au-actions">
        {status === 'confirming' ? (
          <button
            className="au-submit"
            onClick={handleSubmit}
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? '…' : '+ Lägg till artikel'}
          </button>
        ) : hasDS ? (
          <button
            className={`au-parse-btn ${status === 'parsing' ? 'loading' : ''} ${status === 'done' ? 'done' : ''}`}
            onClick={handleGenerate}
            disabled={!rawText.trim() || status === 'parsing' || status === 'submitting'}
          >
            {status === 'done' ? '✓ Tillagd!' : status === 'parsing' ? '✦ Analyserar…' : '✦ Generera med AI'}
          </button>
        ) : (
          <button
            className={`au-submit ${status === 'done' ? 'done' : ''}`}
            onClick={handleManualSubmit}
            disabled={!rawText.trim() || status === 'submitting'}
          >
            {status === 'done' ? '✓ Tillagd!' : status === 'submitting' ? '…' : '+ Lägg till artikel'}
          </button>
        )}
      </div>
    </div>
  )
}
