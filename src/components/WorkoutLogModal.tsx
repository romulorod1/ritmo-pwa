import { useMemo, useState } from 'react'
import type { ConditioningMetrics, ExercisePerformance, MartialMetrics, Readiness, SetKind, WorkoutLog, WorkoutSet, WorkoutTemplate } from '../types/domain'
import { defaultRestSeconds, performanceForExercise } from '../utils/training'
import { Modal } from './Modal'
import { NumberField } from './NumberField'

const readinessOptions: { id: Readiness; label: string; helper: string }[] = [
  { id: 'green', label: 'Verde', helper: 'Plano normal' },
  { id: 'yellow', label: 'Amarelo', helper: 'Menos séries' },
  { id: 'red', label: 'Vermelho', helper: 'Leve/mobilidade' },
]

const setLabels: Record<SetKind, string> = { warmup: 'Aquecimento', work: 'Trabalho', drop: 'Drop set' }

const isLoadable = (kind: string) => kind === 'strength' || kind === 'power'

const WorkoutSetFields = ({
  set,
  loadable,
  onChange,
  onRemove,
}: {
  set: WorkoutSet
  loadable: boolean
  onChange: (patch: Partial<WorkoutSet>) => void
  onRemove?: () => void
}) => (
  <div className={`set-row ${set.completed ? 'is-complete' : ''}`}>
    <div className="set-row__top">
      <label className="set-kind"><span>Tipo</span><select value={set.kind} onChange={(event) => onChange({ kind: event.target.value as SetKind })}>{Object.entries(setLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <button className={`set-check ${set.completed ? 'is-complete' : ''}`} type="button" onClick={() => onChange({ completed: !set.completed })}>{set.completed ? 'Feita' : 'Marcar'}</button>
      {onRemove && <button className="set-remove" type="button" aria-label="Remover série" onClick={onRemove}>×</button>}
    </div>
    <div className="set-row__fields">
      {loadable && <NumberField label="Carga" value={set.loadKg} suffix="kg" min={0} step={0.5} onChange={(value) => onChange({ loadKg: value })} />}
      <NumberField label="Reps" value={set.reps} min={0} max={100} onChange={(value) => onChange({ reps: value })} />
      {loadable && <NumberField label="RIR" value={set.rir} min={0} max={6} onChange={(value) => onChange({ rir: value })} />}
    </div>
  </div>
)

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
    () => workout.exercises.map((item) => performanceForExercise(item, existing?.performances.find((performance) => performance.exerciseId === item.id))),
    [existing, workout.exercises],
  )
  const hasConditioning = workout.exercises.some((item) => item.kind === 'conditioning')
  const isMartial = workout.kind === 'boxing' || workout.kind === 'hybrid'
  const [readiness, setReadiness] = useState<Readiness>(existing?.readiness ?? 'green')
  const [duration, setDuration] = useState<number | undefined>(existing?.durationMinutes ?? workout.durationMinutes)
  const [rpe, setRpe] = useState<number | undefined>(existing?.rpe)
  const [variant, setVariant] = useState(existing?.variant ?? (workout.kind === 'hybrid' ? 'Boxe' : ''))
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [performances, setPerformances] = useState<ExercisePerformance[]>(initialPerformances)
  const [conditioning, setConditioning] = useState<ConditioningMetrics>(existing?.conditioning ?? { activity: 'Zona 2' })
  const [martial, setMartial] = useState<MartialMetrics>(existing?.martial ?? {})
  const [submitting, setSubmitting] = useState(false)

  const updateSet = (exerciseId: string, setId: string, patch: Partial<WorkoutSet>) => {
    setPerformances((current) => current.map((performance) => {
      if (performance.exerciseId !== exerciseId) return performance
      const exercise = workout.exercises.find((item) => item.id === exerciseId)
      if (!exercise) return performance
      return performanceForExercise(exercise, { ...performance, sets: performance.sets?.map((item) => item.id === setId ? { ...item, ...patch } : item) })
    }))
  }

  const addSet = (exerciseId: string) => {
    setPerformances((current) => current.map((performance) => {
      if (performance.exerciseId !== exerciseId) return performance
      const exercise = workout.exercises.find((item) => item.id === exerciseId)
      if (!exercise) return performance
      const next: WorkoutSet = { id: crypto.randomUUID(), kind: 'work', completed: false, restSeconds: defaultRestSeconds(exercise) }
      return performanceForExercise(exercise, { ...performance, sets: [...(performance.sets ?? []), next] })
    }))
  }

  const removeSet = (exerciseId: string, setId: string) => {
    setPerformances((current) => current.map((performance) => {
      if (performance.exerciseId !== exerciseId || (performance.sets?.length ?? 0) <= 1) return performance
      const exercise = workout.exercises.find((item) => item.id === exerciseId)
      if (!exercise) return performance
      return performanceForExercise(exercise, { ...performance, sets: performance.sets?.filter((item) => item.id !== setId) })
    }))
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
        conditioning: hasConditioning ? conditioning : undefined,
        martial: isMartial ? martial : undefined,
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
          {readinessOptions.map((option) => <button key={option.id} type="button" className={`readiness readiness--${option.id} ${readiness === option.id ? 'is-selected' : ''}`} onClick={() => setReadiness(option.id)}><strong>{option.label}</strong><small>{option.helper}</small></button>)}
        </div>
      </div>

      {workout.kind === 'hybrid' && <label className="field sheet-section"><span className="field__label">Sessão realizada</span><select value={variant} onChange={(event) => setVariant(event.target.value)}><option>Boxe</option><option>Técnica leve + zona 2</option></select></label>}

      <div className="performance-list sheet-section">
        {workout.exercises.map((exercise) => {
          const performance = performances.find((entry) => entry.exerciseId === exercise.id)
          return <div className="performance-row" key={exercise.id}>
            <div className="performance-row__title"><strong>{exercise.name}</strong><span>{exercise.sets} × {exercise.reps} · RIR {exercise.rir}</span></div>
            <div className="set-list">{performance?.sets?.map((set) => <WorkoutSetFields key={set.id} set={set} loadable={isLoadable(exercise.kind)} onChange={(patch) => updateSet(exercise.id, set.id, patch)} onRemove={() => removeSet(exercise.id, set.id)} />)}</div>
            <button className="text-button" type="button" onClick={() => addSet(exercise.id)}>+ Adicionar série</button>
          </div>
        })}
      </div>

      {hasConditioning && <section className="sheet-section tracking-card"><p className="eyebrow">Condicionamento</p><div className="form-grid form-grid--2"><label className="field field--wide"><span className="field__label">Modalidade</span><input value={conditioning.activity} placeholder="Corrida, bike, remo..." onChange={(event) => setConditioning({ ...conditioning, activity: event.target.value })} /></label><NumberField label="Distância" value={conditioning.distanceKm} suffix="km" min={0} step={0.1} onChange={(value) => setConditioning({ ...conditioning, distanceKm: value })} /><NumberField label="FC média" value={conditioning.averageHeartRate} suffix="bpm" min={0} onChange={(value) => setConditioning({ ...conditioning, averageHeartRate: value })} /><NumberField label="FC máxima" value={conditioning.maxHeartRate} suffix="bpm" min={0} onChange={(value) => setConditioning({ ...conditioning, maxHeartRate: value })} /><label className="field"><span className="field__label">Zona</span><input value={conditioning.zone ?? ''} placeholder="Zona 2" onChange={(event) => setConditioning({ ...conditioning, zone: event.target.value })} /></label></div></section>}

      {isMartial && <section className="sheet-section tracking-card"><p className="eyebrow">Artes marciais</p><div className="form-grid form-grid--2"><NumberField label="Rounds concluídos" value={martial.roundsCompleted} min={0} max={30} onChange={(value) => setMartial({ ...martial, roundsCompleted: value })} /><NumberField label="Rounds de sparring" value={martial.sparringRounds} min={0} max={30} onChange={(value) => setMartial({ ...martial, sparringRounds: value })} /><label className="field field--wide"><span className="field__label">Foco técnico</span><input value={martial.techniqueFocus ?? ''} placeholder="Base, defesa, combinações..." onChange={(event) => setMartial({ ...martial, techniqueFocus: event.target.value })} /></label></div></section>}

      <div className="form-grid form-grid--2 sheet-section"><NumberField label="Duração" value={duration} suffix="min" min={1} max={240} onChange={setDuration} /><NumberField label="Esforço" value={rpe} suffix="RPE" min={1} max={10} onChange={setRpe} /></div>
      <label className="field sheet-section"><span className="field__label">Observações</span><textarea value={notes} rows={3} placeholder="Dor, desempenho, técnica..." onChange={(event) => setNotes(event.target.value)} /></label>
      <div className="sheet-actions"><button className="button button--secondary" type="button" disabled={submitting} onClick={() => void submit(false)}>Salvar rascunho</button><button className="button button--primary" type="button" disabled={submitting} onClick={() => void submit(true)}>Concluir treino</button></div>
    </Modal>
  )
}
