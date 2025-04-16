// How is therapy going? Small pure helpers so they are easy to test.

export type MoodPoint = { sessionDate: Date; moodBefore: number; moodAfter: number }

export type Progress = {
  sessions: number
  /** average of (after - before) across sessions */
  averageLift: number | null
  /** mood before the first session vs before the latest session */
  trend: 'improving' | 'steady' | 'worse' | 'unknown'
  latestMood: number | null
}

export function progressOf(sessions: MoodPoint[]): Progress {
  if (sessions.length === 0) return { sessions: 0, averageLift: null, trend: 'unknown', latestMood: null }
  const sorted = [...sessions].sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime())
  const lifts = sorted.map((s) => s.moodAfter - s.moodBefore)
  const averageLift = Math.round((lifts.reduce((a, b) => a + b, 0) / lifts.length) * 10) / 10
  const first = sorted[0].moodBefore
  const last = sorted[sorted.length - 1].moodBefore
  let trend: Progress['trend'] = 'steady'
  if (sorted.length < 2) trend = 'unknown'
  else if (last - first >= 2) trend = 'improving'
  else if (first - last >= 2) trend = 'worse'
  return { sessions: sorted.length, averageLift, trend, latestMood: sorted[sorted.length - 1].moodAfter }
}

/** Suggest the next session: weekly for active plans, sooner if the last one went badly. */
export function nextSessionDate(lastSession: MoodPoint | undefined, today: Date = new Date()): Date {
  const base = lastSession ? new Date(lastSession.sessionDate) : today
  const gapDays = lastSession && lastSession.moodAfter <= 3 ? 3 : 7
  const next = new Date(base.getTime() + gapDays * 24 * 60 * 60 * 1000)
  return next < today ? today : next
}
