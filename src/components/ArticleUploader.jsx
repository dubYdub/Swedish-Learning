import { useState, useRef, useCallback } from 'react'
import * as ds from '../utils/deepseek'
import './ArticleUploader.css'

export default function ArticleUploader({ onAdd }) {
  const [rawText, setRawText]     = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [dragOver, setDragOver]   = useState(false)
  const [status, setStatus]       = useState('idle') // idle | parsing | confirming | submitting | done
  const [parsed, setParsed]       = useState(null)   // full article structure from AI
  const [parseError, setParseError] = useState('')
  const audioInputRef = useRef(null)
  const hasDS = !!ds.getKey()

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file && /\.(mp3|m4a|wav|ogg|aac)$/i.test(file.name)) setAudioFile(file)
  }, [])

  function handleAudioChange(e) {
    const file = e.target.files?.[0]
    if (file) setAudioFile(file)
  }

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

  async function handleSubmit() {
    if (!parsed) return
    setStatus('submitting')
    const slug = 'custom-' + Date.now()
    const article = {
      id: slug,
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
    await onAdd(article, audioFile ?? null)
    setStatus('done')
    setTimeout(() => {
      setStatus('idle')
      setRawText('')
      setAudioFile(null)
      setParsed(null)
    }, 2000)
  }

  // Manual submit (no DeepSeek key) — split paragraphs, no translations
  function handleManualSubmit(e) {
    e.preventDefault()
    if (!rawText.trim()) return
    setStatus('submitting')
    const slug = 'custom-' + Date.now()
    const paragraphs = rawText.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    const article = {
      id:         slug,
      topic:      'other',
      topicLabel: 'Övrigt',
      topicEmoji: '📄',
      difficulty: 'B1',
      title:      paragraphs[0]?.slice(0, 60) || 'Ny artikel',
      summary:    '',
      content:    paragraphs.map((text, i) => ({ id: `${slug}-${i + 1}`, text, translation: '' })),
      keyVocab:   [],
      isCustom:   true,
    }
    onAdd(article, audioFile ?? null).then(() => {
      setStatus('done')
      setTimeout(() => { setStatus('idle'); setRawText(''); setAudioFile(null) }, 2000)
    })
  }

  return (
    <div className="au-form">
      {/* Audio dropzone */}
      <div
        className={`au-dropzone ${dragOver ? 'drag-over' : ''} ${audioFile ? 'has-file' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => audioInputRef.current?.click()}
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
            Lägg till ljudfil (valfritt) — <span>klicka eller dra hit</span>
            <br /><span className="au-dropzone-sub">.mp3 · .m4a · .wav</span>
          </p>
        )}
      </div>

      {/* Text area (shown until AI generates) */}
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

      {/* Confirming — show AI-generated preview */}
      {status === 'confirming' && parsed && (
        <div className="au-parsed">
          <div className="au-parsed-header">
            <div className="au-parsed-meta">
              <span className="au-parsed-emoji">{parsed.topicEmoji}</span>
              <span className="au-parsed-topic">{parsed.topicLabel}</span>
              <span className="au-parsed-diff" data-level={parsed.difficulty}>{parsed.difficulty}</span>
            </div>
            <button className="au-parsed-reset" onClick={handleReset} title="Börja om">↺ Ändra text</button>
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

      {/* Action buttons */}
      <div className="au-actions">
        {status === 'confirming' ? (
          <button
            className={`au-submit ${status === 'done' ? 'done' : ''}`}
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
