import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteBodyEntry,
  loadAppData,
  replaceAllData,
  resetDatabase,
  saveBodyEntry,
  saveNutritionLog,
  saveSettings,
  saveWorkoutLog,
} from '../storage/db'
import type {
  AppData,
  AppSettings,
  BodyEntry,
  NutritionLog,
  WorkoutLog,
} from '../types/domain'

export interface AppDataController {
  data?: AppData
  loading: boolean
  error?: string
  saving: boolean
  updateSettings: (settings: AppSettings) => Promise<void>
  upsertBodyEntry: (entry: BodyEntry) => Promise<void>
  removeBodyEntry: (date: string) => Promise<void>
  upsertNutritionLog: (log: NutritionLog) => Promise<void>
  upsertWorkoutLog: (log: WorkoutLog) => Promise<void>
  restoreData: (data: AppData) => Promise<void>
  resetData: () => Promise<void>
}

export const useAppData = (): AppDataController => {
  const [data, setData] = useState<AppData>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    loadAppData()
      .then(setData)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Falha ao abrir os dados locais.'))
      .finally(() => setLoading(false))
  }, [])

  const runSave = useCallback(async (operation: () => Promise<void>) => {
    setSaving(true)
    setError(undefined)
    try {
      await operation()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.')
      throw reason
    } finally {
      setSaving(false)
    }
  }, [])

  const updateSettings = useCallback(
    async (settings: AppSettings) => {
      await runSave(() => saveSettings(settings))
      setData((current) => (current ? { ...current, settings } : current))
    },
    [runSave],
  )

  const upsertBodyEntry = useCallback(
    async (entry: BodyEntry) => {
      await runSave(() => saveBodyEntry(entry))
      setData((current) =>
        current
          ? {
              ...current,
              bodyEntries: [...current.bodyEntries.filter((item) => item.date !== entry.date), entry].sort((a, b) =>
                a.date.localeCompare(b.date),
              ),
            }
          : current,
      )
    },
    [runSave],
  )

  const removeBodyEntry = useCallback(
    async (date: string) => {
      await runSave(() => deleteBodyEntry(date))
      setData((current) =>
        current ? { ...current, bodyEntries: current.bodyEntries.filter((item) => item.date !== date) } : current,
      )
    },
    [runSave],
  )

  const upsertNutritionLog = useCallback(
    async (log: NutritionLog) => {
      await runSave(() => saveNutritionLog(log))
      setData((current) =>
        current
          ? {
              ...current,
              nutritionLogs: [...current.nutritionLogs.filter((item) => item.date !== log.date), log].sort((a, b) =>
                a.date.localeCompare(b.date),
              ),
            }
          : current,
      )
    },
    [runSave],
  )

  const upsertWorkoutLog = useCallback(
    async (log: WorkoutLog) => {
      await runSave(() => saveWorkoutLog(log))
      setData((current) =>
        current
          ? {
              ...current,
              workoutLogs: [...current.workoutLogs.filter((item) => item.id !== log.id), log].sort((a, b) =>
                a.date.localeCompare(b.date),
              ),
            }
          : current,
      )
    },
    [runSave],
  )

  const restoreData = useCallback(
    async (replacement: AppData) => {
      await runSave(() => replaceAllData(replacement))
      setData(replacement)
    },
    [runSave],
  )

  const resetData = useCallback(async () => {
    let replacement: AppData | undefined
    await runSave(async () => {
      replacement = await resetDatabase()
    })
    if (replacement) setData(replacement)
  }, [runSave])

  return useMemo(
    () => ({
      data,
      loading,
      error,
      saving,
      updateSettings,
      upsertBodyEntry,
      removeBodyEntry,
      upsertNutritionLog,
      upsertWorkoutLog,
      restoreData,
      resetData,
    }),
    [
      data,
      loading,
      error,
      saving,
      updateSettings,
      upsertBodyEntry,
      removeBodyEntry,
      upsertNutritionLog,
      upsertWorkoutLog,
      restoreData,
      resetData,
    ],
  )
}

