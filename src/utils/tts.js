// Text-to-speech with smart voice selection
import { pickBestVoice, loadVoices as loadAllVoices } from './voice'

let activeUtterance = null
let resolvedVoice   = null  // cached best voice

export async function ensureVoiceReady() {
  if (resolvedVoice) return resolvedVoice
  resolvedVoice = await pickBestVoice()
  return resolvedVoice
}

export function resetVoice() {
  resolvedVoice = null
}

// Speak text. If voice isn't loaded yet, this becomes async; otherwise it speaks immediately.
export function speak(text, { rate = 0.82, pitch = 1.0, onStart, onEnd, onBoundary } = {}) {
  stop()

  const utt = new SpeechSynthesisUtterance(text)
  utt.lang  = 'sv-SE'
  utt.rate  = rate
  utt.pitch = pitch

  if (onStart)    utt.onstart    = onStart
  if (onEnd)      utt.onend      = onEnd
  if (onBoundary) utt.onboundary = onBoundary
  utt.onerror = () => onEnd?.()

  activeUtterance = utt

  // If we already have a cached best voice, attach it synchronously
  if (resolvedVoice) {
    utt.voice = resolvedVoice
    window.speechSynthesis.speak(utt)
  } else {
    // Resolve voice first, then speak — avoids the cold-start "default OS voice" issue
    ensureVoiceReady().then(voice => {
      if (utt !== activeUtterance) return // cancelled
      if (voice) utt.voice = voice
      window.speechSynthesis.speak(utt)
    })
  }

  return utt
}

export function stop() {
  window.speechSynthesis?.cancel()
  activeUtterance = null
}

export function isSupported() {
  return 'speechSynthesis' in window
}

export const loadVoices = loadAllVoices
