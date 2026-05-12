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
