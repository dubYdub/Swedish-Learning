import { useState, useEffect } from 'react'
import { listSwedishVoices, getPreferredVoiceName, setPreferredVoice } from '../utils/voice'
import { resetVoice } from '../utils/tts'
import './VoicePicker.css'

export default function VoicePicker() {
  const [voices, setVoices]     = useState([])
  const [selected, setSelected] = useState(null)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    listSwedishVoices().then(vs => {
      setVoices(vs)
      const preferred = getPreferredVoiceName()
      const match = vs.find(v => v.name === preferred)
      setSelected(match?.name || vs[0]?.name || null)
    })
  }, [])

  function handleSelect(name) {
    setSelected(name)
    setPreferredVoice(name)
    resetVoice()
    setOpen(false)
  }

  if (voices.length === 0) {
    return <div className="vp-empty">Inget svenskt röststöd</div>
  }

  const current = voices.find(v => v.name === selected) || voices[0]
  const displayName = current?.name || 'Standard röst'
  const isNeural = /Neural|Natural|Online|Wavenet|Premium/i.test(displayName)

  return (
    <div className="voice-picker">
      <button
        className={`vp-button ${isNeural ? 'neural' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={`Röst: ${displayName}`}
      >
        <span className="vp-icon">🔊</span>
        <span className="vp-name">{displayName.split(' - ')[0].slice(0, 22)}</span>
        {isNeural && <span className="vp-badge">HD</span>}
        <span className="vp-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="vp-dropdown">
          <p className="vp-label">Välj röst</p>
          {voices.map(v => {
            const neural = /Neural|Natural|Online|Wavenet|Premium/i.test(v.name)
            return (
              <button
                key={v.name}
                className={`vp-option ${selected === v.name ? 'selected' : ''}`}
                onClick={() => handleSelect(v.name)}
              >
                <span className="vp-option-name">{v.name}</span>
                <span className="vp-option-meta">
                  {neural && <span className="vp-tag-hd">HD</span>}
                  <span className="vp-tag-lang">{v.lang}</span>
                </span>
              </button>
            )
          })}
          {voices.length < 2 && (
            <p className="vp-hint">Bara en röst tillgänglig. Prova Edge eller Chrome för fler.</p>
          )}
        </div>
      )}
    </div>
  )
}
