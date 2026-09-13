import { describe, expect, it } from 'vitest'
import type { WorkoutLog, WorkoutTemplate } from '../types/domain'
import { exerciseHistory, performanceForExercise, weeklyTrainingSummary, workSecondsFromPrescription } from './training'

const exercise = { id: 'supino', name: 'Supino', sets: 3, reps: '6–8', rir: '2', note: '', kind: 'strength' as const, muscleGroup: 'peito' as const }
const template: WorkoutTemplate = { id: 'superior', dayOfWeek: 1, title: 'Superior', shortTitle: 'Superior', time: '07:00', durationMinutes: 60, intensity: 'Alta', focus: '', kind: 'strength', exercises: [exercise] }

describe('dados de execução do treino', () => {
  it('cria séries de trabalho e mantém dados legados', () => {
    const performance = performanceForExercise(exercise, { exerciseId: 'supino', completedSets: 2, loadKg: 80, reps: '8', rir: 2 })
    expect(performance.sets).toHaveLength(3)
    expect(performance.completedSets).toBe(2)
    expect(performance.sets?.[0].loadKg).toBe(80)
  })

  it('calcula segundos de uma prescrição cronometrada', () => {
    expect(workSecondsFromPrescription('2 min')).toBe(120)
    expect(workSecondsFromPrescription('8–10')).toBeUndefined()
  })

  it('resume carga e volume por grupo na semana', () => {
    const log: WorkoutLog = {
      id: '2026-09-13:superior', date: '2026-09-13', templateId: 'superior', completed: true, readiness: 'green', notes: '', updatedAt: '',
      performances: [{ exerciseId: 'supino', completedSets: 2, sets: [
        { id: '1', kind: 'work', completed: true, loadKg: 80, reps: 8 },
        { id: '2', kind: 'work', completed: true, loadKg: 82.5, reps: 6 },
      ] }],
    }
    const summary = weeklyTrainingSummary([log], [template], '2026-09-13')
    expect(summary.volumeKg).toBe(1135)
    expect(summary.volumeByMuscleGroup.peito).toBe(1135)
    expect(summary.strengthSessions).toBe(1)
    expect(exerciseHistory([log], 'supino')[0].topLoadKg).toBe(82.5)
  })
})
