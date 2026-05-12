// Per-article progress tracking
import { load, save } from './storage'

const KEY = 'progress'

export const PHASES = ['listen', 'read', 'shadow', 'record']

function emptyEntry() {
  return {
    status: 'not-started',
    phases: { listen: false, read: false, shadow: false, record: false },
    recordingCount: 0,
    lastStudied: null,
    firstStarted: null,
    studyTimeSec: 0,
  }
}

export function loadProgress() {
  return load(KEY, {})
}

export function saveProgress(p) {
  save(KEY, p)
}

export function getArticleProgress(progress, articleId) {
  return progress[articleId] || emptyEntry()
}

function statusFromPhases(phases) {
  const done = PHASES.filter(p => phases[p]).length
  if (done === 0) return 'not-started'
  if (done === PHASES.length) return 'completed'
  return 'in-progress'
}

export function markPhase(progress, articleId, phase, done = true) {
  const entry = { ...getArticleProgress(progress, articleId) }
  const now = new Date().toISOString()
  entry.phases = { ...entry.phases, [phase]: done }
  entry.status = statusFromPhases(entry.phases)
  entry.lastStudied = now
  if (!entry.firstStarted) entry.firstStarted = now
  return { ...progress, [articleId]: entry }
}

export function setRecordingCount(progress, articleId, count) {
  const entry = { ...getArticleProgress(progress, articleId) }
  entry.recordingCount = count
  if (!entry.firstStarted) entry.firstStarted = new Date().toISOString()
  entry.lastStudied = new Date().toISOString()
  if (count > 0 && !entry.phases.record) {
    entry.phases = { ...entry.phases, record: true }
    entry.status = statusFromPhases(entry.phases)
  }
  return { ...progress, [articleId]: entry }
}

export function addStudyTime(progress, articleId, seconds) {
  if (!seconds || seconds <= 0) return progress
  const entry = { ...getArticleProgress(progress, articleId) }
  entry.studyTimeSec += seconds
  entry.lastStudied = new Date().toISOString()
  if (!entry.firstStarted) entry.firstStarted = new Date().toISOString()
  return { ...progress, [articleId]: entry }
}

export function computeStats(progress) {
  const entries = Object.values(progress)
  return {
    started:    entries.filter(e => e.status !== 'not-started').length,
    completed:  entries.filter(e => e.status === 'completed').length,
    inProgress: entries.filter(e => e.status === 'in-progress').length,
    totalStudyMin: Math.round(entries.reduce((s, e) => s + e.studyTimeSec, 0) / 60),
  }
}

export function computeStreak(progress, today) {
  // streak based on lastStudied days
  const studyDays = new Set(
    Object.values(progress)
      .map(e => e.lastStudied?.slice(0, 10))
      .filter(Boolean)
  )
  if (!studyDays.has(today)) return 0
  let streak = 1
  const d = new Date(today + 'T12:00:00')
  while (true) {
    d.setDate(d.getDate() - 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (studyDays.has(key)) streak++
    else break
  }
  return streak
}

export const PHASE_LABELS = {
  listen: { emoji: '🎧', label: 'Lyssna' },
  read:   { emoji: '📖', label: 'Läs' },
  shadow: { emoji: '🗣️', label: 'Skugga' },
  record: { emoji: '🎙️', label: 'Spela in' },
}
