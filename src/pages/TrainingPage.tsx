import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { NumberField } from '../components/NumberField'
import type { AppSettings, ExerciseKind, MuscleGroup, WorkoutExercise, WorkoutKind, WorkoutTemplate } from '../types/domain'
import { muscleGroupLabels } from '../utils/training'

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const newExercise = (): WorkoutExercise => ({
  id: `exercise-${crypto.randomUUID()}`,
  name: 'Novo exercício',
  sets: 3,
  reps: '8–12',
  rir: '2',
  note: '',
  kind: 'strength',
  restSeconds: 120,
  muscleGroup: 'outros',
})

const exerciseKinds: { id: ExerciseKind; label: string }[] = [
  { id: 'strength', label: 'Musculação' },
  { id: 'power', label: 'Potência' },
  { id: 'conditioning', label: 'Condicionamento / rounds' },
  { id: 'mobility', label: 'Mobilidade' },
]

const workoutKinds: { id: WorkoutKind; label: string }[] = [
  { id: 'strength', label: 'Musculação' },
  { id: 'boxing', label: 'Artes marciais' },
  { id: 'hybrid', label: 'Híbrido' },
  { id: 'recovery', label: 'Recuperação' },
]

const newWorkout = (): WorkoutTemplate => ({
  id: `workout-${crypto.randomUUID()}`,
  dayOfWeek: 1,
  title: 'Nova sessão',
  shortTitle: 'Nova sessão',
  time: '07:00',
  durationMinutes: 60,
  intensity: 'Moderada',
  focus: '',
  kind: 'strength',
  exercises: [newExercise()],
})

const WorkoutEditor = ({ workout, onSave, onClose }: { workout: WorkoutTemplate; onSave: (value: WorkoutTemplate) => Promise<void>; onClose: () => void }) => {
  const [draft, setDraft] = useState<WorkoutTemplate>(structuredClone(workout))
  const [saving, setSaving] = useState(false)
  const updateExercise = (id: string, patch: Partial<WorkoutExercise>) => setDraft((current) => ({ ...current, exercises: current.exercises.map((item) => item.id === id ? { ...item, ...patch } : item) }))
  const submit = async () => {
    if (!draft.title.trim() || !draft.time || draft.exercises.some((item) => !item.name.trim())) return
    setSaving(true)
    try { await onSave(draft); onClose() } finally { setSaving(false) }
  }
  return (
    <Modal title="Editar sessão" onClose={onClose}>
      <div className="form-grid form-grid--2 sheet-section">
        <label className="field field--wide"><span className="field__label">Nome</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value, shortTitle: event.target.value })} /></label>
        <label className="field"><span className="field__label">Dia</span><select value={draft.dayOfWeek} onChange={(event) => setDraft({ ...draft, dayOfWeek: Number(event.target.value) })}>{dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
        <label className="field"><span className="field__label">Horário</span><input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label>
        <label className="field"><span className="field__label">Tipo de sessão</span><select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as WorkoutKind })}>{workoutKinds.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}</select></label>
        <NumberField label="Duração" value={draft.durationMinutes} suffix="min" min={10} max={240} onChange={(value) => setDraft({ ...draft, durationMinutes: value ?? 60 })} />
        <label className="field"><span className="field__label">Intensidade</span><input value={draft.intensity} onChange={(event) => setDraft({ ...draft, intensity: event.target.value })} /></label>
        <label className="field field--wide"><span className="field__label">Foco</span><textarea rows={2} value={draft.focus} onChange={(event) => setDraft({ ...draft, focus: event.target.value })} /></label>
        {(draft.kind === 'hybrid' || draft.kind === 'recovery') && <label className="field field--wide"><span className="field__label">Alternativa</span><textarea rows={2} value={draft.fallback ?? ''} onChange={(event) => setDraft({ ...draft, fallback: event.target.value || undefined })} /></label>}
      </div>
      <div className="editor-list sheet-section">
        <div className="section-title"><h3>Exercícios</h3><button type="button" className="text-button" onClick={() => setDraft((current) => ({ ...current, exercises: [...current.exercises, newExercise()] }))}><Icon name="plus" size={17} />Adicionar</button></div>
        {draft.exercises.map((item) => (
          <div className="editor-item" key={item.id}>
            <div className="editor-item__top"><input aria-label="Nome do exercício" value={item.name} onChange={(event) => updateExercise(item.id, { name: event.target.value })} /><button type="button" className="icon-button icon-button--danger" aria-label="Remover exercício" onClick={() => setDraft((current) => ({ ...current, exercises: current.exercises.filter((exercise) => exercise.id !== item.id) }))}><Icon name="trash" size={18} /></button></div>
            <div className="form-grid form-grid--3">
              <NumberField label="Séries" value={item.sets} min={1} max={20} onChange={(value) => updateExercise(item.id, { sets: value ?? 1 })} />
              <label className="field"><span className="field__label">Reps</span><input value={item.reps} onChange={(event) => updateExercise(item.id, { reps: event.target.value })} /></label>
              <label className="field"><span className="field__label">RIR/RPE</span><input value={item.rir} onChange={(event) => updateExercise(item.id, { rir: event.target.value })} /></label>
              <label className="field"><span className="field__label">Tipo</span><select value={item.kind} onChange={(event) => updateExercise(item.id, { kind: event.target.value as ExerciseKind })}>{exerciseKinds.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}</select></label>
              <label className="field"><span className="field__label">Grupo muscular</span><select value={item.muscleGroup ?? 'outros'} onChange={(event) => updateExercise(item.id, { muscleGroup: event.target.value as MuscleGroup })}>{Object.entries(muscleGroupLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
              <NumberField label="Pausa" value={item.restSeconds} suffix="s" min={0} max={900} step={5} onChange={(value) => updateExercise(item.id, { restSeconds: value })} />
            </div>
            <label className="field"><span className="field__label">Observação</span><input value={item.note} onChange={(event) => updateExercise(item.id, { note: event.target.value })} /></label>
          </div>
        ))}
      </div>
      <div className="sheet-actions"><button type="button" className="button button--primary button--full" disabled={saving} onClick={() => void submit()}>Salvar sessão</button></div>
    </Modal>
  )
}

export const TrainingPage = ({ settings, onSave }: { settings: AppSettings; onSave: (settings: AppSettings) => Promise<void> }) => {
  const ordered = useMemo(() => [...settings.workoutTemplates].sort((a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7)), [settings.workoutTemplates])
  const [selectedId, setSelectedId] = useState(() => settings.workoutTemplates.find((item) => item.dayOfWeek === new Date().getDay())?.id ?? ordered[0]?.id)
  const [editing, setEditing] = useState(false)
  const selected = settings.workoutTemplates.find((item) => item.id === selectedId) ?? ordered[0]
  const saveWorkout = async (workout: WorkoutTemplate) => {
    await onSave({ ...settings, workoutTemplates: settings.workoutTemplates.map((item) => item.id === workout.id ? workout : item) })
  }
  const createWorkout = async () => {
    const workout = newWorkout()
    await onSave({ ...settings, workoutTemplates: [...settings.workoutTemplates, workout] })
    setSelectedId(workout.id)
    setEditing(true)
  }
  const removeWorkout = async () => {
    if (!selected || settings.workoutTemplates.length <= 1 || !window.confirm(`Excluir “${selected.title}” do plano?`)) return
    const remaining = settings.workoutTemplates.filter((item) => item.id !== selected.id)
    await onSave({ ...settings, workoutTemplates: remaining })
    setSelectedId(remaining[0]?.id)
  }
  return (
    <main className="page">
      <header className="page-heading"><div><p className="eyebrow">Plano semanal</p><h1>Treinos</h1></div><button className="text-button" type="button" onClick={() => void createWorkout()}><Icon name="plus" size={18} />Nova</button></header>
      <div className="week-strip" role="tablist" aria-label="Dias da semana">
        {ordered.map((workout) => <button key={workout.id} type="button" role="tab" aria-selected={selected?.id === workout.id} className={selected?.id === workout.id ? 'week-day is-active' : 'week-day'} onClick={() => setSelectedId(workout.id)}><span>{dayNames[workout.dayOfWeek]}</span><strong>{workout.time}</strong></button>)}
      </div>
      {selected && (
        <section className="card session-detail">
          <div className="card__heading"><div><p className="eyebrow">{dayNames[selected.dayOfWeek]} · {selected.time}</p><h2>{selected.title}</h2></div><div className="session-actions"><button className="icon-button" type="button" aria-label="Editar sessão" onClick={() => setEditing(true)}><Icon name="edit" /></button><button className="icon-button icon-button--danger" type="button" aria-label="Excluir sessão" disabled={settings.workoutTemplates.length <= 1} onClick={() => void removeWorkout()}><Icon name="trash" /></button></div></div>
          <div className="meta-row"><span><Icon name="clock" size={17} />{selected.durationMinutes} min</span><span>{selected.intensity}</span></div>
          <p className="card-copy">{selected.focus}</p>
          {selected.fallback && <p className="inline-note">Alternativa: {selected.fallback}</p>}
          <div className="exercise-list">
            {selected.exercises.map((item, index) => <div className="exercise-row" key={item.id}><span className="exercise-row__number">{String(index + 1).padStart(2, '0')}</span><div><strong>{item.name}</strong><small>{item.note}</small></div><div className="exercise-row__prescription"><strong>{item.sets} × {item.reps}</strong><span>RIR {item.rir}</span></div></div>)}
          </div>
        </section>
      )}
      <section className="card compact-guide"><p className="eyebrow">Regras do bloco</p><div className="guide-grid"><div><strong>Compostos</strong><span>1–3 RIR</span></div><div><strong>Isoladores</strong><span>1–2 RIR</span></div><div><strong>Potência</strong><span>Parar se perder velocidade</span></div><div><strong>Progressão</strong><span>Topo da faixa → +2–5%</span></div></div></section>
      {selected && editing && <WorkoutEditor workout={selected} onSave={saveWorkout} onClose={() => setEditing(false)} />}
    </main>
  )
}
