import type { AppData, BackupFile } from '../types/domain'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const validateAppData = (value: unknown): value is AppData => {
  if (!isObject(value)) return false
  const settings = value.settings
  if (!isObject(settings)) return false
  const requiredSettings = [
    'planName',
    'startDate',
    'endDate',
    'consultationDate',
  ]
  if (!requiredSettings.every((key) => isString(settings[key]))) return false
  const numericSettings = [
    'targetBodyFatMin',
    'targetBodyFatMax',
    'targetWeightMinKg',
    'targetWeightMaxKg',
    'caloriesTarget',
    'proteinTargetG',
    'carbsTargetG',
    'fatTargetG',
    'waterTargetMl',
    'stepsMin',
    'stepsMax',
  ]
  if (!numericSettings.every((key) => isNumber(settings[key]))) return false
  if (!Array.isArray(settings.workoutTemplates)) return false
  if (!Array.isArray(settings.dateOverrides)) return false
  if (!Array.isArray(settings.mealTemplates)) return false
  if (!Array.isArray(settings.milestones)) return false
  if (!Array.isArray(value.bodyEntries)) return false
  if (!Array.isArray(value.nutritionLogs)) return false
  if (!Array.isArray(value.workoutLogs)) return false
  return value.bodyEntries.every(
    (entry) => isObject(entry) && isString(entry.date) && isNumber(entry.weightKg),
  )
}

export const createBackup = (data: AppData): BackupFile => ({
  app: 'Ritmo',
  version: 1,
  exportedAt: new Date().toISOString(),
  data,
})

export const backupFileName = (date = new Date()): string =>
  `backup-ritmo-${date.toLocaleDateString('sv-SE')}.json`

export const downloadBackup = (data: AppData): void => {
  const backup = createBackup(data)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = backupFileName()
  anchor.click()
  URL.revokeObjectURL(url)
}

export const parseBackup = (text: string): BackupFile => {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('O arquivo não contém JSON válido.')
  }
  if (!isObject(parsed) || parsed.app !== 'Ritmo' || parsed.version !== 1) {
    throw new Error('Este arquivo não é um backup compatível do Ritmo.')
  }
  if (!isString(parsed.exportedAt) || !validateAppData(parsed.data)) {
    throw new Error('O backup está incompleto ou possui dados inválidos.')
  }
  return parsed as unknown as BackupFile
}

