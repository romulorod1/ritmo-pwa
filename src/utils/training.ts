import type {
  ExercisePerformance,
  MuscleGroup,
  WorkoutExercise,
  WorkoutLog,
  WorkoutSet,
  WorkoutTemplate,
} from '../types/domain'

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  pernas: 'Pernas',
  posteriores: 'Posteriores',
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  panturrilhas: 'Panturrilhas',
  core: 'Core',
  potencia: 'Potência',
  outros: 'Outros',
}

export const defaultRestSeconds = (exercise: WorkoutExercise): number => {
  if (exercise.restSeconds) return exercise.restSeconds
  if (exercise.kind === 'strength' || exercise.kind === 'power') return 120
  if (exercise.kind === 'conditioning') return 60
  return 30
}

export const workSecondsFromPrescription = (value: string): number | undefined => {
  const minutes = value.match(/(\d+(?:[.,]\d+)?)\s*min/i)
  if (!minutes) return undefined
  return Math.round(Number(minutes[1].replace(',', '.')) * 60)
}

const inferredMuscleGroup = (exercise: WorkoutExercise): MuscleGroup => {
  if (exercise.muscleGroup) return exercise.muscleGroup
  const name = exercise.name.toLocaleLowerCase('pt-BR')
  if (/agach|hack squat|leg press|afundo/.test(name)) return 'pernas'
  if (/romeno|flexora|hip thrust/.test(name)) return 'posteriores'
  if (/panturrilha/.test(name)) return 'panturrilhas'
  if (/supino|crucifixo/.test(name)) return 'peito'
  if (/puxada|remada/.test(name)) return 'costas'
  if (/desenvolvimento|elevação lateral|crucifixo inverso|rotaç/.test(name)) return 'ombros'
  if (/rosca/.test(name)) return 'biceps'
  if (/tríceps/.test(name)) return 'triceps'
  if (/crunch|pallof|elevação de pernas/.test(name)) return 'core'
  if (/salto|landmine/.test(name)) return 'potencia'
  return 'outros'
}

export const muscleGroupForExercise = (exercise: WorkoutExercise): MuscleGroup => inferredMuscleGroup(exercise)

const legacySet = (performance: ExercisePerformance, index: number, exercise: WorkoutExercise): WorkoutSet => ({
  id: `legacy-${exercise.id}-${index + 1}`,
  kind: 'work',
  completed: true,
  loadKg: performance.loadKg,
  reps: performance.reps ? Number(performance.reps.match(/\d+/)?.[0]) : undefined,
  rir: performance.rir,
  restSeconds: defaultRestSeconds(exercise),
})

export const setsForPerformance = (exercise: WorkoutExercise, performance?: ExercisePerformance): WorkoutSet[] => {
  if (performance?.sets?.length) return performance.sets
  const completed = performance?.completedSets ?? 0
  return Array.from({ length: Math.max(exercise.sets, completed) }, (_, index) =>
    index < completed
      ? legacySet(performance!, index, exercise)
      : {
          id: `${exercise.id}-${index + 1}`,
          kind: 'work' as const,
          completed: false,
          restSeconds: defaultRestSeconds(exercise),
        },
  )
}

export const performanceForExercise = (exercise: WorkoutExercise, performance?: ExercisePerformance): ExercisePerformance => {
  const sets = setsForPerformance(exercise, performance)
  const completed = sets.filter((item) => item.completed)
  const last = completed.at(-1)
  return {
    exerciseId: exercise.id,
    completedSets: completed.length,
    loadKg: last?.loadKg,
    reps: last?.reps?.toString(),
    rir: last?.rir,
    sets,
  }
}

const setVolume = (set: WorkoutSet): number => (set.completed && set.loadKg && set.reps ? set.loadKg * set.reps : 0)

export interface ExerciseHistoryPoint {
  date: string
  topLoadKg?: number
  volumeKg: number
  completedSets: number
}

export const exerciseHistory = (logs: WorkoutLog[], exerciseId: string): ExerciseHistoryPoint[] =>
  logs
    .filter((log) => log.completed)
    .reduce<ExerciseHistoryPoint[]>((points, log) => {
      const performance = log.performances.find((item) => item.exerciseId === exerciseId)
      if (!performance) return points
      const sets = performance.sets ?? []
      const completed = sets.filter((item) => item.completed)
      const topLoadKg = completed.length ? Math.max(...completed.map((item) => item.loadKg ?? 0)) || undefined : performance.loadKg
      points.push({
        date: log.date,
        ...(topLoadKg === undefined ? {} : { topLoadKg }),
        volumeKg: completed.reduce((total, item) => total + setVolume(item), 0),
        completedSets: completed.length || performance.completedSets,
      })
      return points
    }, [])
    .sort((a, b) => a.date.localeCompare(b.date))

export interface WeeklyTrainingSummary {
  completedSessions: number
  strengthSessions: number
  martialSessions: number
  conditioningSessions: number
  completedSets: number
  volumeKg: number
  volumeByMuscleGroup: Partial<Record<MuscleGroup, number>>
}

const sevenDaysBefore = (date: string): string => {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() - 6)
  return value.toLocaleDateString('sv-SE')
}

export const weeklyTrainingSummary = (
  logs: WorkoutLog[],
  templates: WorkoutTemplate[],
  endingOn: string,
): WeeklyTrainingSummary => {
  const start = sevenDaysBefore(endingOn)
  const templateById = new Map(templates.map((item) => [item.id, item]))
  const summary: WeeklyTrainingSummary = {
    completedSessions: 0,
    strengthSessions: 0,
    martialSessions: 0,
    conditioningSessions: 0,
    completedSets: 0,
    volumeKg: 0,
    volumeByMuscleGroup: {},
  }
  logs.filter((log) => log.completed && log.date >= start && log.date <= endingOn).forEach((log) => {
    summary.completedSessions += 1
    const template = templateById.get(log.templateId)
    if (!template) return
    if (template.kind === 'strength') summary.strengthSessions += 1
    if (template.kind === 'boxing' || (template.kind === 'hybrid' && log.variant === 'Boxe')) summary.martialSessions += 1
    if (template.exercises.some((item) => item.kind === 'conditioning') || log.conditioning) summary.conditioningSessions += 1
    template.exercises.forEach((exercise) => {
      const performance = log.performances.find((item) => item.exerciseId === exercise.id)
      if (!performance) return
      const sets = performance.sets ?? []
      const completed = sets.filter((item) => item.completed)
      summary.completedSets += completed.length || performance.completedSets
      const volume = completed.reduce((total, item) => total + setVolume(item), 0)
      summary.volumeKg += volume
      if (volume) {
        const group = muscleGroupForExercise(exercise)
        summary.volumeByMuscleGroup[group] = (summary.volumeByMuscleGroup[group] ?? 0) + volume
      }
    })
  })
  return summary
}
