// Voice scoring + persisted user choice
import { load, save } from './storage'

const PREMIUM_NAMES = /Neural|Natural|Online|Wavenet|Premium|Enhanced/i
const KNOWN_GOOD    = /Hedda|Mattias|Sofie|Astrid|Bengt|Lisa/i

export function scoreVoice(v) {
  let score = 0

  // Has to handle Swedish in some form
  if (!v.lang) return -100
  if (v.lang === 'sv-SE') score += 5
  else if (v.lang.startsWith('sv')) score += 3
  else if (v.lang.startsWith('nb') || v.lang.startsWith('no') || v.lang.startsWith('da')) score += 0
  else return -100  // not a Scandinavian voice, skip

  // High-quality voice names get a big boost
  if (PREMIUM_NAMES.test(v.name)) score += 10

  // Cloud voices on Edge/Chrome are usually neural
  if (v.localService === false) score += 3

  // Known good Swedish voice identifiers
  if (KNOWN_GOOD.test(v.name)) score += 2

  // Microsoft / Google branded voices tend to be higher quality
  if (/Microsoft|Google/i.test(v.name)) score += 1

  return score
}

export function loadVoices() {
  return new Promise(resolve => {
    const existing = window.speechSynthesis?.getVoices() || []
    if (existing.length) { resolve(existing); return }
    if (!window.speechSynthesis) { resolve([]); return }
    let resolved = false
    const handler = () => {
      if (resolved) return
      resolved = true
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true })
    // Fallback in case the event never fires
    setTimeout(handler, 1000)
  })
}

export async function listSwedishVoices() {
  const all = await loadVoices()
  return all
    .filter(v => scoreVoice(v) > -100)
    .map(v => ({ voice: v, score: scoreVoice(v) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.voice)
}

export async function pickBestVoice() {
  const preferredName = load('preferredVoice', null)
  const all = await loadVoices()

  if (preferredName) {
    const match = all.find(v => v.name === preferredName)
    if (match) return match
  }

  const sv = await listSwedishVoices()
  return sv[0] || null
}

export function setPreferredVoice(name) {
  save('preferredVoice', name)
}

export function getPreferredVoiceName() {
  return load('preferredVoice', null)
}
