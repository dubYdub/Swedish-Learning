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

// Parse a block of raw Swedish text into a structured article entry.
// Returns { title, summary, content: [{ id, text, translation }] }
export async function fetchArticleParse(rawText) {
  const slug = 'custom-' + Date.now()
  const result = await callDS([
    {
      role: 'system',
      content: `You are a Swedish language teacher preparing reading material. Given raw Swedish text, output a JSON object with exactly these fields:
{
  "title": "<Swedish title for this text, ≤80 chars>",
  "summary": "<1-2 sentence English description of what the text is about>",
  "content": [
    { "id": "<slug>-1", "text": "<first paragraph in Swedish>", "translation": "<English translation>" },
    ...one object per paragraph...
  ]
}
Split at natural paragraph breaks. Keep each paragraph as one chunk. Return ONLY valid JSON, no other text.`,
    },
    {
      role: 'user',
      content: `Article slug: "${slug}"\n\nText:\n${rawText}`,
    },
  ], 2000, 0.25, true)

  if (!result) return null
  try {
    const parsed = JSON.parse(result)
    if (!Array.isArray(parsed.content)) return null
    parsed.content = parsed.content.map((p, i) => ({
      id: p.id || `${slug}-${i + 1}`,
      text: p.text || '',
      translation: p.translation || '',
    }))
    return parsed
  } catch {
    return null
  }
}
