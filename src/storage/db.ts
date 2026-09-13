import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { createInitialData } from '../data/defaultPlan'
import type {
  AppData,
  AppSettings,
  BodyEntry,
  NutritionLog,
  WorkoutLog,
} from '../types/domain'

interface RitmoDatabase extends DBSchema {
  settings: {
    key: string
    value: AppSettings
  }
  bodyEntries: {
    key: string
    value: BodyEntry
  }
  nutritionLogs: {
    key: string
    value: NutritionLog
  }
  workoutLogs: {
    key: string
    value: WorkoutLog
  }
  metadata: {
    key: string
    value: { key: string; value: number | string }
  }
}

const DB_NAME = 'ritmo-saude'
const DB_VERSION = 1
let databasePromise: Promise<IDBPDatabase<RitmoDatabase>> | undefined

const database = () => {
  databasePromise ??= openDB<RitmoDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings')
      if (!db.objectStoreNames.contains('bodyEntries')) db.createObjectStore('bodyEntries', { keyPath: 'date' })
      if (!db.objectStoreNames.contains('nutritionLogs')) db.createObjectStore('nutritionLogs', { keyPath: 'date' })
      if (!db.objectStoreNames.contains('workoutLogs')) db.createObjectStore('workoutLogs', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata', { keyPath: 'key' })
    },
  })
  return databasePromise
}

export const initializeDatabase = async (): Promise<void> => {
  const db = await database()
  const initialized = await db.get('metadata', 'initialized')
  if (initialized) return
  const initial = createInitialData()
  const transaction = db.transaction(
    ['settings', 'bodyEntries', 'nutritionLogs', 'workoutLogs', 'metadata'],
    'readwrite',
  )
  await transaction.objectStore('settings').put(initial.settings, 'current')
  for (const entry of initial.bodyEntries) await transaction.objectStore('bodyEntries').put(entry)
  await transaction.objectStore('metadata').put({ key: 'initialized', value: new Date().toISOString() })
  await transaction.done
}

export const loadAppData = async (): Promise<AppData> => {
  await initializeDatabase()
  const db = await database()
  const [settings, bodyEntries, nutritionLogs, workoutLogs] = await Promise.all([
    db.get('settings', 'current'),
    db.getAll('bodyEntries'),
    db.getAll('nutritionLogs'),
    db.getAll('workoutLogs'),
  ])
  if (!settings) throw new Error('As configurações locais não foram encontradas.')
  return {
    settings,
    bodyEntries: bodyEntries.sort((a, b) => a.date.localeCompare(b.date)),
    nutritionLogs: nutritionLogs.sort((a, b) => a.date.localeCompare(b.date)),
    workoutLogs: workoutLogs.sort((a, b) => a.date.localeCompare(b.date)),
  }
}

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  const db = await database()
  await db.put('settings', settings, 'current')
}

export const saveBodyEntry = async (entry: BodyEntry): Promise<void> => {
  const db = await database()
  await db.put('bodyEntries', entry)
}

export const deleteBodyEntry = async (date: string): Promise<void> => {
  const db = await database()
  await db.delete('bodyEntries', date)
}

export const saveNutritionLog = async (log: NutritionLog): Promise<void> => {
  const db = await database()
  await db.put('nutritionLogs', log)
}

export const saveWorkoutLog = async (log: WorkoutLog): Promise<void> => {
  const db = await database()
  await db.put('workoutLogs', log)
}

export const replaceAllData = async (data: AppData): Promise<void> => {
  const db = await database()
  const transaction = db.transaction(
    ['settings', 'bodyEntries', 'nutritionLogs', 'workoutLogs', 'metadata'],
    'readwrite',
  )
  await Promise.all([
    transaction.objectStore('settings').clear(),
    transaction.objectStore('bodyEntries').clear(),
    transaction.objectStore('nutritionLogs').clear(),
    transaction.objectStore('workoutLogs').clear(),
  ])
  await transaction.objectStore('settings').put(data.settings, 'current')
  for (const entry of data.bodyEntries) await transaction.objectStore('bodyEntries').put(entry)
  for (const log of data.nutritionLogs) await transaction.objectStore('nutritionLogs').put(log)
  for (const log of data.workoutLogs) await transaction.objectStore('workoutLogs').put(log)
  await transaction.objectStore('metadata').put({ key: 'initialized', value: new Date().toISOString() })
  await transaction.done
}

export const resetDatabase = async (): Promise<AppData> => {
  const data = createInitialData()
  await replaceAllData(data)
  return data
}

