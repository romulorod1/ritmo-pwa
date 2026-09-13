import type { BodyEntry, Milestone } from '../types/domain'

export interface WeightAverage {
  date: string
  average: number
  count: number
}

export const rollingWeightAverages = (entries: BodyEntry[], window = 7): WeightAverage[] => {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((entry, index) => {
    const slice = sorted.slice(Math.max(0, index - window + 1), index + 1)
    const average = slice.reduce((sum, item) => sum + item.weightKg, 0) / slice.length
    return { date: entry.date, average: Number(average.toFixed(2)), count: slice.length }
  })
}

export const latestWeightAverage = (entries: BodyEntry[]): WeightAverage | undefined =>
  rollingWeightAverages(entries).at(-1)

export const weeklyRate = (entries: BodyEntry[]): number | undefined => {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return undefined
  const latest = sorted.at(-1)
  if (!latest) return undefined
  const comparisonDate = new Date(`${latest.date}T12:00:00`)
  comparisonDate.setDate(comparisonDate.getDate() - 7)
  const target = comparisonDate.toLocaleDateString('sv-SE')
  const previous = [...sorted].reverse().find((item) => item.date <= target)
  if (!previous) return undefined
  const elapsedDays = Math.max(
    1,
    Math.round(
      (new Date(`${latest.date}T12:00:00`).getTime() - new Date(`${previous.date}T12:00:00`).getTime()) /
        86_400_000,
    ),
  )
  return Number((((latest.weightKg - previous.weightKg) / elapsedDays) * 7).toFixed(2))
}

export const nextMilestone = (milestones: Milestone[], date: string): Milestone | undefined =>
  [...milestones].sort((a, b) => a.date.localeCompare(b.date)).find((item) => item.date >= date)

export const adjustmentMessage = (rate: number | undefined): string => {
  if (rate === undefined) return 'Registre pelo menos uma semana para estimar a velocidade.'
  const loss = -rate
  if (loss >= 0.35 && loss <= 0.55) return 'Ritmo dentro da faixa: mantenha alimentação e atividade.'
  if (loss < 0.25) return 'Se a aderência estiver alta por duas semanas, ajuste 100–150 kcal ou +1.500 passos.'
  if (loss > 0.6) return 'Ritmo acelerado: considere acrescentar 100–150 kcal.'
  return 'Observe mais uma semana antes de ajustar.'
}
