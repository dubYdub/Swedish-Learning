import { useState } from 'react'
import './VocabList.css'

const DS_KEY = 'sv_deepseek_key'

function formatAdded(iso) {
  return new Date(iso).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
}

async function fetchDeepSeekDefinition(word, key) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a concise Swedish-English dictionary. Reply with a short English definition only — no Swedish, no intro, no punctuation at the end.' },
        { role: 'user', content: `Define the Swedish word "${word}"` },
      ],
      max_tokens: 60,
      temperature: 0.2,
    }),
  })
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('empty response')
  return text
}

export default function VocabList({ vocab, onRemove, onUpdateVocab }) {
  const [search, setSearch]           = useState('')
  const [translating, setTranslating] = useState(null)  // entry id in flight
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [keyDraft, setKeyDraft]       = useState('')
  const [pendingEntry, setPendingEntry] = useState(null) // entry waiting for key

  const filtered = vocab.filter(v =>
    v.word.toLowerCase().includes(search.toLowerCase())
  )

  async function translate(entry) {
    const key = localStorage.getItem(DS_KEY)
    if (!key) {
      setPendingEntry(entry)
      setKeyDraft('')
      setShowKeyInput(true)
      return
    }
    await runTranslation(entry, key)
  }

  async function runTranslation(entry, key) {
    setTranslating(entry.id)
    try {
      const definition = await fetchDeepSeekDefinition(entry.word, key)
      onUpdateVocab?.(entry.id, definition)
    } catch {}
    setTranslating(null)
  }

  function confirmKey() {
    const key = keyDraft.trim()
    if (!key) return
    localStorage.setItem(DS_KEY, key)
    setShowKeyInput(false)
    if (pendingEntry) { runTranslation(pendingEntry, key); setPendingEntry(null) }
  }

  function exportVocab() {
    const text = vocab.map(v => `${v.word}\n  ${v.context}`).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'svenska-ord.txt' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="vocab-list">
      <div className="vl-header">
        <div className="vl-header-top">
          <p className="vl-label">Min ordlista</p>
          <span className="vl-count">{vocab.length}</span>
        </div>
        {vocab.length > 3 && (
          <input
            className="vl-search"
            type="text"
            placeholder="Sök ord…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}
      </div>

      {showKeyInput && (
        <div className="vl-key-form">
          <p className="vl-key-label">DeepSeek API-nyckel</p>
          <input
            className="vl-key-input"
            type="password"
            value={keyDraft}
            onChange={e => setKeyDraft(e.target.value)}
            placeholder="sk-..."
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && keyDraft.trim()) confirmKey()
              if (e.key === 'Escape') setShowKeyInput(false)
            }}
          />
          <div className="vl-key-actions">
            <button className="vl-key-btn ghost" onClick={() => setShowKeyInput(false)}>Avbryt</button>
            <button className="vl-key-btn primary" onClick={confirmKey} disabled={!keyDraft.trim()}>Spara</button>
          </div>
        </div>
      )}

      {vocab.length === 0 ? (
        <div className="vl-empty">
          <p>Markera ett ord i texten och klicka <strong>+ Ordlista</strong> för att spara det här.</p>
        </div>
      ) : (
        <div className="vl-entries">
          {filtered.length === 0 ? (
            <p className="vl-no-results">Inga träffar.</p>
          ) : (
            filtered.map(entry => (
              <div key={entry.id} className="vl-entry">
                <div className="vl-entry-top">
                  <span className="vl-word">{entry.word}</span>
                  <div className="vl-entry-actions">
                    <button
                      className="vl-translate"
                      onClick={() => translate(entry)}
                      disabled={translating === entry.id}
                      title="Översätt med DeepSeek"
                    >
                      {translating === entry.id ? '⏳' : '✨'}
                    </button>
                    <button className="vl-remove" onClick={() => onRemove(entry.id)} title="Ta bort">×</button>
                  </div>
                </div>
                {entry.context && (
                  <p className="vl-context">{entry.context}</p>
                )}
                <span className="vl-date">{formatAdded(entry.addedAt)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {vocab.length > 0 && (
        <div className="vl-footer">
          <button className="vl-export" onClick={exportVocab}>↓ Exportera</button>
        </div>
      )}
    </div>
  )
}
