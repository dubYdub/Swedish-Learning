let activeUtterance = null

// Wait for voices to load (needed in Chrome)
export function loadVoices() {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length) { resolve(voices); return }
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(window.speechSynthesis.getVoices())
    }, { once: true })
  })
}

export async function getSwedishVoice() {
  const voices = await loadVoices()
  // Prefer local Swedish voices for better quality
  return (
    voices.find(v => v.lang === 'sv-SE' && v.localService) ||
    voices.find(v => v.lang === 'sv-SE') ||
    voices.find(v => v.lang.startsWith('sv')) ||
    null
  )
}

export function speak(text, { rate = 0.82, onStart, onEnd, onBoundary } = {}) {
  stop()

  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'sv-SE'
  utt.rate = rate
  utt.pitch = 1.0

  // Attach voice asynchronously — speak() must be called synchronously
  // so we set voice if already loaded, otherwise browser will use its default
  const voices = window.speechSynthesis.getVoices()
  const svVoice =
    voices.find(v => v.lang === 'sv-SE' && v.localService) ||
    voices.find(v => v.lang === 'sv-SE') ||
    voices.find(v => v.lang.startsWith('sv'))
  if (svVoice) utt.voice = svVoice

  if (onStart)    utt.onstart    = onStart
  if (onEnd)      utt.onend      = onEnd
  if (onBoundary) utt.onboundary = onBoundary
  utt.onerror = () => onEnd?.()

  activeUtterance = utt
  window.speechSynthesis.speak(utt)
  return utt
}

export function stop() {
  window.speechSynthesis.cancel()
  activeUtterance = null
}

export function isSupported() {
  return 'speechSynthesis' in window
}

// Split article text into paragraphs for word-boundary tracking
export function sentencesOf(text) {
  return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) ?? [text]
}
