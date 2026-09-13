import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { NumberField } from '../components/NumberField'
import { WorkoutLogModal } from '../components/WorkoutLogModal'
import type { AppData, BodyEntry, NutritionLog, WorkoutLog } from '../types/domain'
import { addDays, daysBetween, formatDateLong, phaseForDate, todayIso, workoutForDate } from '../utils/date'
import { latestWeightAverage, nextMilestone } from '../utils/progress'

const emptyNutritionLog = (date: string): NutritionLog => ({
  date,
  completedMealIds: [],
  notes: '',
  updatedAt: new Date().toISOString(),
})

interface TodayPageProps {
  data: AppData
  onSaveWorkout: (log: WorkoutLog) => Promise<void>
  onSaveNutrition: (log: NutritionLog) => Promise<void>
  onSaveBody: (entry: BodyEntry) => Promise<void>
}

export const TodayPage = ({ data, onSaveWorkout, onSaveNutrition, onSaveBody }: TodayPageProps) => {
  const actualToday = todayIso()
  const [date, setDate] = useState(actualToday)
  const [workoutModal, setWorkoutModal] = useState(false)
  const [weight, setWeight] = useState<number | undefined>()
  const workout = workoutForDate(data.settings, date)
  const workoutLog = workout ? data.workoutLogs.find((log) => log.id === `${date}:${workout.id}`) : undefined
  const existingNutrition = data.nutritionLogs.find((log) => log.date === date)
  const [nutrition, setNutrition] = useState<NutritionLog>(existingNutrition ?? emptyNutritionLog(date))
  const weightEntry = data.bodyEntries.find((entry) => entry.date === date)
  const average = latestWeightAverage(data.bodyEntries)
  const milestone = nextMilestone(data.settings.milestones, date)
  const phase = phaseForDate(date)
  const planDaysLeft = daysBetween(date, data.settings.endDate)
  const mealCompletion = Math.round((nutrition.completedMealIds.length / data.settings.mealTemplates.length) * 100)

  useEffect(() => {
    const current = data.nutritionLogs.find((log) => log.date === date)
    // A troca de data carrega o rascunho persistido daquele dia.
    // oxlint-disable-next-line react/set-state-in-effect
    setNutrition(current ?? emptyNutritionLog(date))
  }, [data.nutritionLogs, date])

  useEffect(() => {
    // A troca de data carrega o peso persistido daquele dia.
    // oxlint-disable-next-line react/set-state-in-effect
    setWeight(data.bodyEntries.find((entry) => entry.date === date)?.weightKg)
  }, [data.bodyEntries, date])

  const persistNutrition = async (next: NutritionLog) => {
    const stamped = { ...next, date, updatedAt: new Date().toISOString() }
    setNutrition(stamped)
    await onSaveNutrition(stamped)
  }

  const toggleMeal = async (mealId: string) => {
    const completed = nutrition.completedMealIds.includes(mealId)
      ? nutrition.completedMealIds.filter((id) => id !== mealId)
      : [...nutrition.completedMealIds, mealId]
    await persistNutrition({ ...nutrition, completedMealIds: completed })
  }

  const saveWeight = async () => {
    if (!weight || weight < 30 || weight > 250) return
    await onSaveBody({
      ...(weightEntry ?? {
        date,
        notes: '',
        updatedAt: new Date().toISOString(),
      }),
      weightKg: weight,
      updatedAt: new Date().toISOString(),
    })
  }

  const planProgress = useMemo(() => {
    const elapsed = daysBetween(data.settings.startDate, date) + 1
    const total = daysBetween(data.settings.startDate, data.settings.endDate) + 1
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)))
  }, [data.settings.endDate, data.settings.startDate, date])

  return (
    <main className="page page--today">
      <header className="page-heading">
        <div>
          <p className="eyebrow">{date === actualToday ? 'Hoje' : 'Dia selecionado'}</p>
          <h1>{formatDateLong(date)}</h1>
        </div>
        <div className="date-controls">
          <button type="button" className="icon-button" onClick={() => setDate(addDays(date, -1))} aria-label="Dia anterior"><Icon name="chevron-left" /></button>
          <button type="button" className="date-today" onClick={() => setDate(actualToday)}>Hoje</button>
          <button type="button" className="icon-button" onClick={() => setDate(addDays(date, 1))} aria-label="Próximo dia"><Icon name="chevron-right" /></button>
        </div>
      </header>

      <section className="hero-card">
        <div className="hero-card__copy">
          <span className="phase-pill">{phase.label}</span>
          <h2>{data.settings.planName}</h2>
          <p>{planDaysLeft >= 0 ? `${planDaysLeft} dias até a reavaliação` : 'Período concluído — revise o plano'}</p>
        </div>
        <div className="progress-ring" style={{ '--progress': `${planProgress * 3.6}deg` } as React.CSSProperties}>
          <span>{planProgress}%</span>
        </div>
        <p className="hero-card__instruction">{phase.instruction}</p>
      </section>

      <section className={`card workout-card ${workoutLog?.completed ? 'is-complete' : ''}`}>
        <div className="card__heading">
          <div>
            <p className="eyebrow">Treino do dia</p>
            <h2>{workout?.title ?? 'Sem sessão definida'}</h2>
          </div>
          {workoutLog?.completed && <span className="complete-badge"><Icon name="check" size={16} /> Feito</span>}
        </div>
        {workout ? (
          <>
            <div className="meta-row">
              <span><Icon name="clock" size={17} /> {workout.time} · {workout.durationMinutes} min</span>
              <span>{workout.intensity}</span>
            </div>
            <p className="card-copy">{workout.focus}</p>
            <div className="exercise-preview">
              {workout.exercises.slice(0, 4).map((item) => (
                <div key={item.id}><span>{item.name}</span><strong>{item.sets} × {item.reps}</strong></div>
              ))}
              {workout.exercises.length > 4 && <small>+ {workout.exercises.length - 4} exercícios no registro</small>}
            </div>
            <button className={workoutLog?.completed ? 'button button--secondary button--full' : 'button button--primary button--full'} type="button" onClick={() => setWorkoutModal(true)}>
              {workoutLog ? 'Revisar registro' : 'Registrar treino'}
            </button>
          </>
        ) : (
          <div className="empty-state"><p>Abra Treinos para associar uma sessão a este dia da semana.</p></div>
        )}
      </section>

      <section className="card">
        <div className="card__heading">
          <div><p className="eyebrow">Alimentação</p><h2>{nutrition.completedMealIds.length}/{data.settings.mealTemplates.length} refeições</h2></div>
          <span className="metric-chip">{mealCompletion}%</span>
        </div>
        <div className="meal-list">
          {data.settings.mealTemplates.map((meal) => {
            const checked = nutrition.completedMealIds.includes(meal.id)
            return (
              <button type="button" className={`meal-row ${checked ? 'is-checked' : ''}`} key={meal.id} onClick={() => void toggleMeal(meal.id)}>
                <span className="check-circle">{checked && <Icon name="check" size={16} />}</span>
                <span><strong>{meal.title}</strong><small>{meal.time}</small></span>
              </button>
            )
          })}
        </div>
        <details className="details-panel">
          <summary>Registrar totais do dia</summary>
          <div className="form-grid form-grid--2 details-panel__body">
            <NumberField label="Calorias" value={nutrition.calories} suffix="kcal" min={0} onChange={(value) => setNutrition((current) => ({ ...current, calories: value }))} onBlur={() => void persistNutrition(nutrition)} />
            <NumberField label="Proteína" value={nutrition.proteinG} suffix="g" min={0} onChange={(value) => setNutrition((current) => ({ ...current, proteinG: value }))} onBlur={() => void persistNutrition(nutrition)} />
            <NumberField label="Carboidratos" value={nutrition.carbsG} suffix="g" min={0} onChange={(value) => setNutrition((current) => ({ ...current, carbsG: value }))} onBlur={() => void persistNutrition(nutrition)} />
            <NumberField label="Gorduras" value={nutrition.fatG} suffix="g" min={0} onChange={(value) => setNutrition((current) => ({ ...current, fatG: value }))} onBlur={() => void persistNutrition(nutrition)} />
            <NumberField label="Água" value={nutrition.waterMl} suffix="ml" min={0} step={100} onChange={(value) => setNutrition((current) => ({ ...current, waterMl: value }))} onBlur={() => void persistNutrition(nutrition)} />
            <NumberField label="Passos" value={nutrition.steps} min={0} step={100} onChange={(value) => setNutrition((current) => ({ ...current, steps: value }))} onBlur={() => void persistNutrition(nutrition)} />
          </div>
          <label className="field details-panel__body">
            <span className="field__label">Observações</span>
            <textarea rows={2} value={nutrition.notes} onChange={(event) => setNutrition((current) => ({ ...current, notes: event.target.value }))} onBlur={() => void persistNutrition(nutrition)} />
          </label>
        </details>
      </section>

      <section className="card quick-weight">
        <div className="card__heading">
          <div><p className="eyebrow">Peso ao acordar</p><h2>{average ? `Média ${average.average.toFixed(2)} kg` : 'Comece a tendência'}</h2></div>
          <Icon name="scale" />
        </div>
        <div className="inline-form">
          <NumberField label="Peso de hoje" value={weight} suffix="kg" min={30} max={250} step={0.05} placeholder="65,5" onChange={setWeight} />
          <button className="button button--primary" type="button" onClick={() => void saveWeight()} disabled={!weight}>Registrar</button>
        </div>
        {milestone && <p className="inline-note">Próximo marco: {milestone.minWeightKg.toFixed(1)}–{milestone.maxWeightKg.toFixed(1)} kg em {new Date(`${milestone.date}T12:00`).toLocaleDateString('pt-BR')}.</p>}
      </section>

      {workout && workoutModal && (
        <WorkoutLogModal date={date} workout={workout} existing={workoutLog} onSave={onSaveWorkout} onClose={() => setWorkoutModal(false)} />
      )}
    </main>
  )
}
