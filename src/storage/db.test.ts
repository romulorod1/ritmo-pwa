import { describe, expect, it } from 'vitest'
import { loadAppData, replaceAllData, saveBodyEntry } from './db'

describe('IndexedDB', () => {
  it('mantém registros após uma nova leitura e restaura um conjunto completo', async () => {
    const initial = await loadAppData()
    await saveBodyEntry({
      date: '2026-09-12',
      weightKg: 65.2,
      notes: 'persistência',
      updatedAt: new Date().toISOString(),
    })
    const reloaded = await loadAppData()
    expect(reloaded.bodyEntries.find((item) => item.date === '2026-09-12')?.weightKg).toBe(65.2)

    const replacement = structuredClone(initial)
    replacement.settings.caloriesTarget = 2100
    await replaceAllData(replacement)
    const restored = await loadAppData()
    expect(restored.settings.caloriesTarget).toBe(2100)
    expect(restored.bodyEntries).toHaveLength(initial.bodyEntries.length)
  })
})

