import { describe, expect, it } from 'vitest'
import type { BodyEntry } from '../types/domain'
import { adjustmentMessage, rollingWeightAverages, weeklyRate } from './progress'

const entry = (date: string, weightKg: number): BodyEntry => ({
  date,
  weightKg,
  notes: '',
  updatedAt: `${date}T12:00:00.000Z`,
})

describe('tendência de peso', () => {
  const entries = [
    entry('2026-09-11', 65.5),
    entry('2026-09-12', 65.4),
    entry('2026-09-13', 65.3),
    entry('2026-09-14', 65.2),
    entry('2026-09-15', 65.1),
    entry('2026-09-16', 65),
    entry('2026-09-17', 64.9),
    entry('2026-09-18', 64.8),
  ]

  it('calcula média móvel usando até sete registros', () => {
    const averages = rollingWeightAverages(entries)
    expect(averages.at(-1)?.count).toBe(7)
    expect(averages.at(-1)?.average).toBe(65.1)
  })

  it('calcula a velocidade semanal e orienta a faixa', () => {
    const rate = weeklyRate(entries)
    expect(rate).toBe(-0.7)
    expect(adjustmentMessage(rate)).toContain('acelerado')
  })
})

