const KEY_STORAGE = 'sv_deepseek_key'

export function getKey()       { return localStorage.getItem(KEY_STORAGE) || '' }
export function setKey(k)      { if (k) localStorage.setItem(KEY_STORAGE, k); else localStorage.removeItem(KEY_STORAGE) }

export async function fetchDefinition(word) {
  const key = getKey()
  if (!key) return null
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a concise Swedish-English dictionary. Reply with a short English definition only — no Swedish, no intro, no extra punctuation.' },
        { role: 'user', content: `Define the Swedish word "${word}"` },
      ],
      max_tokens: 60,
      temperature: 0.2,
    }),
  })
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  return text || null
}

async function callDS(messages, maxTokens, temp = 0.2, json = false) {
  const key = getKey()
  if (!key) return null
  const body = { model: 'deepseek-chat', messages, max_tokens: maxTokens, temperature: temp }
  if (json) body.response_format = { type: 'json_object' }
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || null
}

export function fetchGrammarExplanation(phrase, context) {
  return callDS([
    { role: 'system', content: 'You are a Swedish grammar teacher. Given a Swedish phrase and its surrounding sentence, explain the grammar in 1–2 short English sentences. Name the grammatical form (tense, mood, case, word order rule, etc.) and what it means for a learner.' },
    { role: 'user', content: `Phrase: "${phrase}"\nSentence: "${context}"` },
  ], 120)
}

export function fetchMnemonic(word, definition) {
  return callDS([
    { role: 'system', content: 'You are a memory coach helping someone learn Swedish. Give one fun, vivid mnemonic or memory trick for a Swedish word. One sentence max. Be concrete and inventive.' },
    { role: 'user', content: `Swedish: "${word}" — English: "${definition}"` },
  ], 80, 0.8)
}

// Extract key vocabulary from a Swedish text.
// Returns [{ word, definition }]
export async function fetchKeyVocab(text) {
  const result = await callDS([
    {
      role: 'system',
      content: `You are a Swedish language teacher. Given Swedish text, extract 5–8 key vocabulary words a B1–B2 learner should know. Focus on content words (nouns, verbs, adjectives) that may be unfamiliar. Return ONLY valid JSON in this exact shape:
{"vocab":[{"word":"<Swedish word>","definition":"<short English definition, max 8 words>"}]}`,
    },
    { role: 'user', content: text.slice(0, 3000) },
  ], 500, 0.2, true)
  if (!result) return []
  try {
    const parsed = JSON.parse(result)
    return Array.isArray(parsed.vocab) ? parsed.vocab : []
  } catch { return [] }
}

// Parse a block of raw Swedish text into a fully structured article entry.
// Returns { title, summary, difficulty, topic, topicLabel, topicEmoji, content: [{ id, text, translation }] }
// Paragraphs are split locally so AI cannot merge or drop them.
export async function fetchArticleParse(rawText) {
  const slug = 'custom-' + Date.now()
  const paragraphs = rawText.split(/\n\n+/).map(p => p.trim()).filter(Boolean)

  const result = await callDS([
    {
      role: 'system',
      content: `You are a Swedish language teacher. Given numbered Swedish paragraphs, return a JSON object with EXACTLY these fields:
{
  "title": "<Swedish title, ≤80 chars>",
  "summary": "<1-2 sentence English description>",
  "difficulty": "<A1 | A2 | B1 | B2 — based on vocabulary and grammar>",
  "topic": "<one of: samhälle | kultur | sport | vetenskap | världen | ekonomi | hälsa | natur | other>",
  "topicLabel": "<topic in Swedish, capitalized, e.g. Samhälle>",
  "topicEmoji": "<one emoji for the topic>",
  "translations": ["<English translation of paragraph 1>", "<English translation of paragraph 2>", ...]
}
The "translations" array MUST contain exactly ${paragraphs.length} string(s), one per numbered paragraph in order. Return ONLY valid JSON, no other text.`,
    },
    {
      role: 'user',
      content: paragraphs.map((p, i) => `[${i + 1}] ${p}`).join('\n\n'),
    },
  ], 2000, 0.25, true)

  if (!result) return null
  try {
    const parsed = JSON.parse(result)
    const translations = Array.isArray(parsed.translations) ? parsed.translations : []
    parsed.content = paragraphs.map((text, i) => ({
      id: `${slug}-${i + 1}`,
      text,
      translation: translations[i] || '',
    }))
    parsed.difficulty = ['A1','A2','B1','B2'].includes(parsed.difficulty) ? parsed.difficulty : 'B1'
    parsed.topic      = parsed.topic || 'other'
    parsed.topicLabel = parsed.topicLabel || 'Övrigt'
    parsed.topicEmoji = parsed.topicEmoji || '📄'
    return parsed
  } catch {
    return null
  }
}
