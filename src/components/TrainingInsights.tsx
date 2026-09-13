import { useMemo, useState } from 'react'
import type { AppSettings, WorkoutLog } from '../types/domain'
import { todayIso } from '../utils/date'
import { exerciseHistory, muscleGroupLabels, weeklyTrainingSummary } from '../utils/training'

const compactDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export const TrainingInsights = ({ settings, workoutLogs }: { settings: AppSettings; workoutLogs: WorkoutLog[] }) => {
  const exercises = useMemo(() => settings.workoutTemplates.flatMap((workout) => workout.exercises).filter((exercise) => exercise.kind === 'strength' || exercise.kind === 'power'), [settings.workoutTemplates])
  const [selectedId, setSelectedId] = useState(exercises[0]?.id ?? '')
  const selected = exercises.find((exercise) => exercise.id === selectedId) ?? exercises[0]
  const history = selected ? exerciseHistory(workoutLogs, selected.id) : []
  const latest = history.at(-1)
  const best = history.reduce((record, item) => Math.max(record, item.topLoadKg ?? 0), 0)
  const summary = weeklyTrainingSummary(workoutLogs, settings.workoutTemplates, todayIso())
  const maxLoad = Math.max(1, ...history.map((item) => item.topLoadKg ?? 0))
  const groupVolumes = Object.entries(summary.volumeByMuscleGroup).sort(([, left], [, right]) => (right ?? 0) - (left ?? 0)).slice(0, 5)

  return <>
    <section className="card training-insights">
      <div className="card__heading"><div><p className="eyebrow">Força</p><h2>Progressão de carga</h2></div></div>
      {exercises.length ? <>
        <div className="exercise-picker" role="tablist" aria-label="Exercício para histórico">{exercises.map((exercise) => <button key={exercise.id} type="button" role="tab" aria-selected={selected?.id === exercise.id} className={selected?.id === exercise.id ? 'is-active' : ''} onClick={() => setSelectedId(exercise.id)}>{exercise.name}</button>)}</div>
        {history.length ? <>
          <div className="strength-stats"><div><span>Última</span><strong>{latest?.topLoadKg ? `${latest.topLoadKg.toFixed(1)} kg` : 'Sem carga'}</strong><small>{latest ? compactDate(latest.date) : ''}</small></div><div><span>Melhor carga</span><strong>{best ? `${best.toFixed(1)} kg` : '—'}</strong><small>{history.length} sessão{history.length > 1 ? 'ões' : ''}</small></div><div><span>Volume recente</span><strong>{latest?.volumeKg ? `${Math.round(latest.volumeKg)} kg` : '—'}</strong><small>séries registradas</small></div></div>
          <div className="load-chart" aria-label={`Histórico de carga de ${selected?.name}`}>{history.slice(-8).map((item) => <div className="load-chart__bar" key={item.date}><div style={{ height: `${Math.max(8, ((item.topLoadKg ?? 0) / maxLoad) * 100)}%` }} title={`${item.topLoadKg ?? 0} kg`} /><span>{compactDate(item.date)}</span></div>)}</div>
        </> : <p className="inline-note">Conclua uma sessão com carga registrada para ver o histórico de {selected?.name}.</p>}
      </> : <p className="inline-note">Adicione exercícios de força ou potência ao plano para acompanhar carga.</p>}
    </section>

    <section className="card weekly-load">
      <div className="card__heading"><div><p className="eyebrow">Últimos 7 dias</p><h2>Carga semanal</h2></div></div>
      <div className="summary-grid"><div><strong>{summary.completedSessions}</strong><span>sessões</span></div><div><strong>{summary.completedSets}</strong><span>séries</span></div><div><strong>{Math.round(summary.volumeKg)}</strong><span>kg de volume</span></div></div>
      <div className="activity-split"><span>Musculação <strong>{summary.strengthSessions}</strong></span><span>Luta <strong>{summary.martialSessions}</strong></span><span>Condicionamento <strong>{summary.conditioningSessions}</strong></span></div>
      {groupVolumes.length ? <div className="muscle-volume">{groupVolumes.map(([group, volume]) => <div key={group}><span>{muscleGroupLabels[group as keyof typeof muscleGroupLabels]}</span><strong>{Math.round(volume ?? 0)} kg</strong></div>)}</div> : <p className="inline-note">O volume por grupo aparece quando as séries tiverem carga e reps registradas.</p>}
    </section>
  </>
}
