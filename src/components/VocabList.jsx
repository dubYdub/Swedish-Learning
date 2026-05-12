import { useState } from 'react'
import { getKey, setKey } from '../utils/deepseek'
import './VocabList.css'

function formatAdded(iso) {
  return new Date(iso).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
}

export default function VocabList({ vocab, onRemove, onUpdateVocab }) {
  const [search, setSearch]         = useState('')
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [keyDraft, setKeyDraft]     = useState('')
  const hasKey = !!getKey()

  const filtered = vocab.filter(v =>
    v.word.toLowerCase().includes(search.toLowerCase())
  )

  function saveKeyAndClose() {
    const k = keyDraft.trim()
    if (!k) return
    setKey(k)
    setShowKeyForm(false)
    setKeyDraft('')
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
          <div className="vl-header-right">
            <button
              className={`vl-key-toggle ${hasKey ? 'active' : ''}`}
              title={hasKey ? 'DeepSeek aktiv – klicka för att ändra nyckel' : 'Ange DeepSeek API-nyckel'}
              onClick={() => { setShowKeyForm(s => !s); setKeyDraft('') }}
            >🔑</button>
            <span className="vl-count">{vocab.length}</span>
          </div>
        </div>

        {showKeyForm && (
          <div className="vl-key-form">
            <input
              className="vl-key-input"
              type="password"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              placeholder="sk-..."
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && keyDraft.trim()) saveKeyAndClose()
                if (e.key === 'Escape') setShowKeyForm(false)
              }}
            />
            <div className="vl-key-actions">
              <button className="vl-key-btn ghost" onClick={() => setShowKeyForm(false)}>Avbryt</button>
              <button className="vl-key-btn primary" onClick={saveKeyAndClose} disabled={!keyDraft.trim()}>Spara</button>
            </div>
          </div>
        )}

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
                  <button className="vl-remove" onClick={() => onRemove(entry.id)} title="Ta bort">×</button>
                </div>
                {entry.context && <p className="vl-context">{entry.context}</p>}
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
