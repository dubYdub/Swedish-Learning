// SM-2 spaced repetition algorithm
// quality: 0 = total blackout, 1 = wrong, 2 = wrong but remembered, 3 = hard, 4 = good, 5 = easy
export function sm2(card, quality) {
  let { repetitions = 0, easeFactor = 2.5, interval = 1 } = card

  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000

  return { repetitions, easeFactor, interval, nextReview }
}

export function isDue(card) {
  return !card.nextReview || Date.now() >= card.nextReview
}
