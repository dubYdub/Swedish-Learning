// Ebbinghaus-based spaced repetition
// Level 0 = new/failed → due immediately
// Level 1-5 → intervals: 1, 3, 7, 14, 21 days
export const MAX_LEVEL  = 5
export const INTERVALS  = [0, 1, 3, 7, 14, 21]  // days until next review by level
export const LABELS     = ['Ny', 'Bekant', 'Inlärd', 'Säker', 'Stark', 'Memorerad']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function isDue(entry) {
  if (!entry.nextReview) return true
  return entry.nextReview <= todayStr()
}

export function advance(entry, correct) {
  const level = entry.level ?? 0
  const newLevel = correct ? Math.min(MAX_LEVEL, level + 1) : Math.max(0, level - 2)
  return {
    level:        newLevel,
    nextReview:   correct ? addDays(todayStr(), INTERVALS[newLevel]) : todayStr(),
    lastReviewed: new Date().toISOString(),
  }
}
