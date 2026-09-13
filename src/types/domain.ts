export type WorkoutKind = 'boxing' | 'strength' | 'hybrid' | 'recovery'
export type Readiness = 'green' | 'yellow' | 'red'

export interface WorkoutExercise {
  id: string
  name: string
  sets: number
  reps: string
  rir: string
  note: string
  kind: 'strength' | 'power' | 'conditioning' | 'mobility'
}

export interface WorkoutTemplate {
  id: string
  dayOfWeek: number
  title: string
  shortTitle: string
  time: string
  durationMinutes: number
  intensity: string
  focus: string
  kind: WorkoutKind
  exercises: WorkoutExercise[]
  fallback?: string
}

export interface DateWorkoutOverride {
  date: string
  workout: WorkoutTemplate
}

export interface MealTemplate {
  id: string
  title: string
  time: string
  items: string[]
  note?: string
}

export interface Milestone {
  date: string
  minWeightKg: number
  maxWeightKg: number
}

export interface AppSettings {
  id: 'current'
  planName: string
  startDate: string
  endDate: string
  consultationDate: string
  targetBodyFatMin: number
  targetBodyFatMax: number
  targetWeightMinKg: number
  targetWeightMaxKg: number
  caloriesTarget: number
  proteinTargetG: number
  carbsTargetG: number
  fatTargetG: number
  waterTargetMl: number
  stepsMin: number
  stepsMax: number
  workoutTemplates: WorkoutTemplate[]
  dateOverrides: DateWorkoutOverride[]
  mealTemplates: MealTemplate[]
  milestones: Milestone[]
}

export interface ExercisePerformance {
  exerciseId: string
  completedSets: number
  loadKg?: number
  reps?: string
  rir?: number
}

export interface WorkoutLog {
  id: string
  date: string
  templateId: string
  completed: boolean
  readiness: Readiness
  durationMinutes?: number
  rpe?: number
  variant?: string
  notes: string
  performances: ExercisePerformance[]
  updatedAt: string
}

export interface NutritionLog {
  date: string
  completedMealIds: string[]
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  waterMl?: number
  steps?: number
  notes: string
  updatedAt: string
}

export interface BodyEntry {
  date: string
  weightKg: number
  waistCm?: number
  abdomenCm?: number
  bodyFatPct?: number
  armRelaxedCm?: number
  armFlexedCm?: number
  thighCm?: number
  calfCm?: number
  notes: string
  updatedAt: string
}

export interface AppData {
  settings: AppSettings
  workoutLogs: WorkoutLog[]
  nutritionLogs: NutritionLog[]
  bodyEntries: BodyEntry[]
}

export interface BackupFile {
  app: 'Ritmo'
  version: 1
  exportedAt: string
  data: AppData
}

