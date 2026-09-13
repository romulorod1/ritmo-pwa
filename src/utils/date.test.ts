import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../data/defaultPlan'
import { addDays, daysBetween, workoutForDate } from './date'

describe('regras de agenda', () => {
  it('usa as sessões especiais na entrada e na avaliação', () => {
    expect(workoutForDate(defaultSettings, '2026-09-11')?.id).toBe('ponte-11-09')
    expect(workoutForDate(defaultSettings, '2026-10-30')?.id).toBe('leve-30-10')
  })

  it('mantém inferiores A na terça-feira', () => {
    expect(workoutForDate(defaultSettings, '2026-09-15')?.id).toBe('inferiores-a')
  })

  it('cobre cinquenta datas inclusivas até a consulta', () => {
    expect(daysBetween('2026-09-11', '2026-10-30') + 1).toBe(50)
    expect(addDays('2026-09-11', 49)).toBe('2026-10-30')
  })
})

