// Ebbinghaus-based spaced repetition
// Level 0 = new/failed → due immediately
// Level 1-5 → intervals double roughly: 1, 3, 7, 14, 30 days
export const MAX_LEVEL  = 5
export const INTERVALS  = [0, 1, 3, 7, 14, 30]  // days until next review by level
export const LABELS     = ['Ny', 'Bekant', 'Inlärd', 'Säker', 'Nästan klar', 'Memorerad']

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
  const level = entry.level ?? 0
  if (level >= MAX_LEVEL) return false         // memorized — never surfaces again
  if (!entry.nextReview)  return true          // never reviewed → always due
  return entry.nextReview <= todayStr()
}

export function advance(entry, correct) {
  const level = entry.level ?? 0
  const newLevel = correct ? Math.min(MAX_LEVEL, level + 1) : Math.max(0, level - 1)
  return {
    level:        newLevel,
    nextReview:   correct ? addDays(todayStr(), INTERVALS[newLevel]) : todayStr(),
    lastReviewed: new Date().toISOString(),
  }
}
