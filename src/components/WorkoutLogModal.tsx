import { useMemo, useState } from 'react'
import type { ExercisePerformance, Readiness, WorkoutLog, WorkoutTemplate } from '../types/domain'
import { Modal } from './Modal'
import { NumberField } from './NumberField'

const readinessOptions: { id: Readiness; label: string; helper: string }[] = [
  { id: 'green', label: 'Verde', helper: 'Plano normal' },
  { id: 'yellow', label: 'Amarelo', helper: 'Menos séries' },
  { id: 'red', label: 'Vermelho', helper: 'Leve/mobilidade' },
]

export const WorkoutLogModal = ({
  date,
  workout,
  existing,
  onSave,
  onClose,
}: {
  date: string
  workout: WorkoutTemplate
  existing?: WorkoutLog
  onSave: (log: WorkoutLog) => Promise<void>
  onClose: () => void
}) => {
  const initialPerformances = useMemo(
    () =>
      workout.exercises.map((item) =>
        existing?.performances.find((performance) => performance.exerciseId === item.id) ?? {
          exerciseId: item.id,
          completedSets: 0,
        },
      ),
    [existing, workout.exercises],
  )
  const [readiness, setReadiness] = useState<Readiness>(existing?.readiness ?? 'green')
  const [duration, setDuration] = useState<number | undefined>(existing?.durationMinutes ?? workout.durationMinutes)
  const [rpe, setRpe] = useState<number | undefined>(existing?.rpe)
  const [variant, setVariant] = useState(existing?.variant ?? (workout.kind === 'hybrid' ? 'Boxe' : ''))
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [performances, setPerformances] = useState<ExercisePerformance[]>(initialPerformances)
  const [submitting, setSubmitting] = useState(false)

  const updatePerformance = (exerciseId: string, patch: Partial<ExercisePerformance>) => {
    setPerformances((current) =>
      current.map((item) => (item.exerciseId === exerciseId ? { ...item, ...patch } : item)),
    )
  }

  const submit = async (completed: boolean) => {
    setSubmitting(true)
    try {
      await onSave({
        id: `${date}:${workout.id}`,
        date,
        templateId: workout.id,
        completed,
        readiness,
        durationMinutes: duration,
        rpe,
        variant: variant || undefined,
        notes,
        performances,
        updatedAt: new Date().toISOString(),
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Registrar treino" onClose={onClose}>
      <div className="sheet-section">
        <p className="eyebrow">Prontidão de hoje</p>
        <div className="readiness-grid">
          {readinessOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`readiness readiness--${option.id} ${readiness === option.id ? 'is-selected' : ''}`}
              onClick={() => setReadiness(option.id)}
            >
              <strong>{option.label}</strong>
              <small>{option.helper}</small>
            </button>
          ))}
        </div>
        {readiness === 'yellow' && <p className="inline-note">Retire uma série por exercício e use 3–4 RIR.</p>}
        {readiness === 'red' && <p className="inline-note">Troque por caminhada leve e mobilidade. Não force com dor aguda ou febre.</p>}
      </div>

      {workout.kind === 'hybrid' && (
        <label className="field sheet-section">
          <span className="field__label">Sessão realizada</span>
          <select value={variant} onChange={(event) => setVariant(event.target.value)}>
            <option>Boxe</option>
            <option>Técnica leve + zona 2</option>
          </select>
        </label>
      )}

      <div className="performance-list sheet-section">
        {workout.exercises.map((item) => {
          const performance = performances.find((entry) => entry.exerciseId === item.id)
          return (
            <div className="performance-row" key={item.id}>
              <div className="performance-row__title">
                <strong>{item.name}</strong>
                <span>{item.sets} × {item.reps} · RIR {item.rir}</span>
              </div>
              <div className="performance-row__fields">
                <NumberField label="Séries" value={performance?.completedSets} min={0} max={20} onChange={(value) => updatePerformance(item.id, { completedSets: value ?? 0 })} />
                {item.kind === 'strength' || item.kind === 'power' ? (
                  <NumberField label="Carga" value={performance?.loadKg} suffix="kg" min={0} step={0.5} onChange={(value) => updatePerformance(item.id, { loadKg: value })} />
                ) : null}
                <label className="field">
                  <span className="field__label">Reps/tempo</span>
                  <input value={performance?.reps ?? ''} placeholder={item.reps} onChange={(event) => updatePerformance(item.id, { reps: event.target.value })} />
                </label>
                {item.kind === 'strength' && (
                  <NumberField label="RIR" value={performance?.rir} min={0} max={6} onChange={(value) => updatePerformance(item.id, { rir: value })} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="form-grid form-grid--2 sheet-section">
        <NumberField label="Duração" value={duration} suffix="min" min={1} max={240} onChange={setDuration} />
        <NumberField label="Esforço" value={rpe} suffix="RPE" min={1} max={10} onChange={setRpe} />
      </div>
      <label className="field sheet-section">
        <span className="field__label">Observações</span>
        <textarea value={notes} rows={3} placeholder="Dor, desempenho, técnica..." onChange={(event) => setNotes(event.target.value)} />
      </label>
      <div className="sheet-actions">
        <button className="button button--secondary" type="button" disabled={submitting} onClick={() => void submit(false)}>Salvar rascunho</button>
        <button className="button button--primary" type="button" disabled={submitting} onClick={() => void submit(true)}>Concluir treino</button>
      </div>
    </Modal>
  )
}

