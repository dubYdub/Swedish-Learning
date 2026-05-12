export const DIFFICULTY = {
  A1: { label: 'Nybörjare',      emoji: '🌱', color: '#7BAE86' },
  A2: { label: 'Grundläggande',  emoji: '🌿', color: '#5B9EA0' },
  B1: { label: 'Medelnivå',      emoji: '📖', color: '#C4873A' },
  B2: { label: 'Övre medelnivå', emoji: '🎓', color: '#9B7FC4' },
}

export const articles = [
  // Add your articles here. Example shape:
  // {
  //   id: 'my-article',          // used for audio file matching: public/audio/my-article.mp3
  //   topic: 'kultur',
  //   topicLabel: 'Kultur',
  //   topicEmoji: '🎭',
  //   difficulty: 'A2',          // A1 | A2 | B1 | B2
  //   title: 'Artikelns titel',
  //   summary: 'Short English description shown in the library.',
  //   content: [
  //     { id: 'my-article-1', text: 'Första stycket...' },
  //     { id: 'my-article-2', text: 'Andra stycket...' },
  //   ],
  //   keyVocab: [
  //     { word: 'exempelord', def: 'example word' },
  //   ],
  // },
]

export function estimateReadMinutes(article) {
  const words = article.content.reduce((n, p) => n + p.text.split(/\s+/).length, 0)
  return Math.max(1, Math.round(words / 120))
}

// Deterministically pick 4 articles for a given date string (YYYY-MM-DD)
export function getArticlesForDate(dateStr) {
  const seed = dateStr.split('-').reduce((acc, n) => acc + parseInt(n), 0)
  const shuffled = [...articles].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) * 17 + a.id.length) % 1000
    const hb = ((seed * 31 + b.id.charCodeAt(0)) * 17 + b.id.length) % 1000
    return ha - hb
  })
  return shuffled.slice(0, 4)
}

// Split paragraph text into sentences (for sentence-level highlighting)
export function sentencesOf(text) {
  return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) ?? [text]
}
