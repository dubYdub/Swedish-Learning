import { useState, useRef, useCallback } from 'react'
import * as ds from '../utils/deepseek'
import './ArticleUploader.css'

const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2']
const TOPIC_PRESETS = [
  { emoji: '📊', label: 'Samhälle',  topic: 'samhälle' },
  { emoji: '🎭', label: 'Kultur',    topic: 'kultur' },
  { emoji: '⚽', label: 'Sport',     topic: 'sport' },
  { emoji: '🔬', label: 'Vetenskap', topic: 'vetenskap' },
  { emoji: '🌍', label: 'Världen',   topic: 'världen' },
  { emoji: '💼', label: 'Ekonomi',   topic: 'ekonomi' },
]

export default function ArticleUploader({ onAdd }) {
  const [title, setTitle]           = useState('')
  const [difficulty, setDifficulty] = useState('A2')
  const [topicIdx, setTopicIdx]     = useState(0)
  const [rawText, setRawText]       = useState('')
  const [audioFile, setAudioFile]   = useState(null)
  const [dragOver, setDragOver]     = useState(false)
  const [parsing, setParsing]       = useState(false)
  const [parsed, setParsed]         = useState(null)   // { title, summary, content }
  const [parseError, setParseError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
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

  async function handleParse() {
    if (!rawText.trim()) return
    setParsing(true)
    setParseError('')
    try {
      const result = await ds.fetchArticleParse(rawText)
      if (!result) { setParseError('Parsning misslyckades. Kontrollera din DeepSeek-nyckel.'); return }
      setParsed(result)
      if (result.title && !title) setTitle(result.title)
    } catch (err) {
      setParseError(err.message || 'Okänt fel')
    } finally {
      setParsing(false)
    }
  }

  function updateParagraphTranslation(idx, val) {
    setParsed(prev => ({
      ...prev,
      content: prev.content.map((p, i) => i === idx ? { ...p, translation: val } : p),
    }))
  }

  function buildContentFromRaw() {
    const paragraphs = rawText.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    const slug = 'custom-' + Date.now()
    return paragraphs.map((text, i) => ({ id: `${slug}-${i + 1}`, text, translation: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rawText.trim() && !parsed) return
    setSubmitting(true)
    const topic = TOPIC_PRESETS[topicIdx]
    const content = parsed?.content ?? buildContentFromRaw()
    const slug = 'custom-' + Date.now()
    const article = {
      id: slug,
      topic: topic.topic,
      topicLabel: topic.label,
      topicEmoji: topic.emoji,
      difficulty,
      title: title.trim() || parsed?.title || 'Utan titel',
      summary: parsed?.summary || '',
      content,
      keyVocab: [],
      isCustom: true,
    }
    await onAdd(article, audioFile ?? null)
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setTitle(''); setRawText(''); setAudioFile(null); setParsed(null)
      setDifficulty('A2'); setTopicIdx(0); setSubmitting(false)
    }, 2000)
  }

  return (
    <form className="au-form" onSubmit={handleSubmit} noValidate>
      {/* Row 1: meta */}
      <div className="au-meta-row">
        <div className="au-field au-field-title">
          <label className="au-label">Titel</label>
          <input
            className="au-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Artikelns rubrik…"
          />
        </div>
        <div className="au-field au-field-diff">
          <label className="au-label">Nivå</label>
          <div className="au-diff-pills">
            {DIFFICULTIES.map(d => (
              <button
                key={d} type="button"
                className={`au-diff-pill ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
              >{d}</button>
            ))}
          </div>
        </div>
        <div className="au-field au-field-topic">
          <label className="au-label">Ämne</label>
          <div className="au-topic-pills">
            {TOPIC_PRESETS.map((t, i) => (
              <button
                key={t.topic} type="button"
                className={`au-topic-pill ${topicIdx === i ? 'active' : ''}`}
                onClick={() => setTopicIdx(i)}
                title={t.label}
              >{t.emoji}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: audio dropzone */}
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
            Dra och släpp ljudfil här eller <span>klicka för att välja</span>
            <br /><span className="au-dropzone-sub">.mp3 · .m4a · .wav</span>
          </p>
        )}
      </div>

      {/* Row 3: text */}
      <div className="au-field">
        <label className="au-label">Svenska stycken</label>
        <textarea
          className="au-textarea"
          value={rawText}
          onChange={e => { setRawText(e.target.value); setParsed(null) }}
          placeholder="Klistra in svenska stycken här. Separera stycken med en tom rad."
          rows={6}
        />
      </div>

      {/* AI parse */}
      {hasDS && rawText.trim() && !parsed && (
        <button
          type="button"
          className={`au-parse-btn ${parsing ? 'loading' : ''}`}
          onClick={handleParse}
          disabled={parsing}
        >
          {parsing ? '⏳ Analyserar…' : '✦ Generera med AI'}
        </button>
      )}
      {parseError && <p className="au-error">{parseError}</p>}

      {/* Parsed preview */}
      {parsed && (
        <div className="au-parsed">
          <p className="au-parsed-title">Förhandsgranskning</p>
          {parsed.summary && <p className="au-parsed-summary">{parsed.summary}</p>}
          <div className="au-paragraphs">
            {parsed.content.map((p, i) => (
              <div key={p.id} className="au-para-row">
                <p className="au-para-sv">{p.text}</p>
                <textarea
                  className="au-para-tr"
                  value={p.translation}
                  onChange={e => updateParagraphTranslation(i, e.target.value)}
                  placeholder="English translation…"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className={`au-submit ${done ? 'done' : ''}`}
        disabled={(!rawText.trim() && !parsed) || submitting}
      >
        {done ? '✓ Tillagd!' : submitting ? '…' : '+ Lägg till artikel'}
      </button>
    </form>
  )
}
