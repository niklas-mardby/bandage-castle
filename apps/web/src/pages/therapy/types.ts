export type Issue = 'ADVENTURER_TRAUMA' | 'FEAR_OF_TORCHES' | 'HOARDING_ANXIETY' | 'BRIDGE_TRAUMA' | 'FEAR_OF_SWORDS' | 'SEPARATION_ANXIETY' | 'OTHER'

export const ISSUE_LABEL: Record<Issue, string> = {
  ADVENTURER_TRAUMA: '⚔️ Adventurer trauma',
  FEAR_OF_TORCHES: '🔥 Fear of torches',
  HOARDING_ANXIETY: '💰 Hoarding anxiety',
  BRIDGE_TRAUMA: '🌉 Bridge trauma',
  FEAR_OF_SWORDS: '🗡️ Fear of swords',
  SEPARATION_ANXIETY: '🥺 Separation anxiety',
  OTHER: '🛋️ Other',
}

export type Progress = {
  sessions: number
  averageLift: number | null
  trend: 'improving' | 'steady' | 'worse' | 'unknown'
  latestMood: number | null
}

export type PlanSummary = {
  id: number
  issue: Issue
  goals: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  startedAt: string
  endedAt: string | null
  monster: { id: number; name: string; species: { name: string } | null }
  progress: Progress
  lastSessionDate: string | null
  nextSessionDate: string | null
}

export type Session = {
  id: number
  sessionDate: string
  durationMin: number
  moodBefore: number
  moodAfter: number
  notes: string
  homework: string | null
}

export type PlanDetail = Omit<PlanSummary, 'lastSessionDate' | 'nextSessionDate'> & {
  sessions: Session[]
  therapist: { id: number; displayName: string | null } | null
}

export const TREND_ICON: Record<Progress['trend'], string> = { improving: '📈', steady: '➖', worse: '📉', unknown: '❔' }
