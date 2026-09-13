import { describe, expect, it } from 'vitest'
import { createInitialData } from '../data/defaultPlan'
import { createBackup, parseBackup } from './backup'

describe('backup', () => {
  it('exporta e valida todos os dados do app', () => {
    const source = createBackup(createInitialData())
    const restored = parseBackup(JSON.stringify(source))
    expect(restored.app).toBe('Ritmo')
    expect(restored.data.settings.workoutTemplates).toHaveLength(7)
    expect(restored.data.bodyEntries[0].weightKg).toBe(65.55)
  })

  it('recusa JSON inválido e estrutura incompatível', () => {
    expect(() => parseBackup('{')).toThrow('JSON válido')
    expect(() => parseBackup(JSON.stringify({ app: 'Outro', version: 1, data: {} }))).toThrow('compatível')
  })
})

