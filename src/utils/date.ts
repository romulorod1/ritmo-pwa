import type { AppSettings, WorkoutTemplate } from '../types/domain'

export const todayIso = (): string => new Date().toLocaleDateString('sv-SE')

export const dateFromIso = (value: string): Date => new Date(`${value}T12:00:00`)

export const addDays = (value: string, amount: number): string => {
  const date = dateFromIso(value)
  date.setDate(date.getDate() + amount)
  return date.toLocaleDateString('sv-SE')
}

export const formatDateLong = (value: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateFromIso(value))

export const formatDateShort = (value: string): string =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(dateFromIso(value))

export const daysBetween = (from: string, to: string): number =>
  Math.round((dateFromIso(to).getTime() - dateFromIso(from).getTime()) / 86_400_000)

export const workoutForDate = (settings: AppSettings, date: string): WorkoutTemplate | undefined => {
  const override = settings.dateOverrides.find((item) => item.date === date)
  if (override) return override.workout
  const day = dateFromIso(date).getDay()
  return settings.workoutTemplates.find((item) => item.dayOfWeek === day)
}

export const phaseForDate = (date: string): { label: string; instruction: string } => {
  if (date >= '2026-10-26' && date <= '2026-10-30') {
    return { label: 'Semana final', instruction: 'Reduzir volume, evitar falha e preservar as medidas.' }
  }
  if (date >= '2026-10-05' && date <= '2026-10-11') {
    return { label: 'Descarga', instruction: 'Retirar 1 série por exercício e reduzir a fadiga em 25–35%.' }
  }
  if (date >= '2026-09-11' && date <= '2026-09-20') {
    return { label: 'Entrada', instruction: 'Usar 3 RIR nos compostos e evitar sparring duro.' }
  }
  return { label: 'Semana normal', instruction: 'Aplicar progressão dupla com técnica estável.' }
}

