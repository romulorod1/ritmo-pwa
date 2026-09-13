import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ConditioningMetrics, ExercisePerformance, MartialMetrics, Readiness, WorkoutLog, WorkoutSet, WorkoutTemplate } from '../types/domain'
import { defaultRestSeconds, performanceForExercise, workSecondsFromPrescription } from '../utils/training'
import { NumberField } from './NumberField'

type RunnerPhase = 'ready' | 'work' | 'rest' | 'summary'
type Position = { exerciseIndex: number; setIndex: number }

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
const loadable = (kind: string) => kind === 'strength' || kind === 'power'
const timed = (kind: string) => kind === 'conditioning'

const nextOpenPosition = (performances: ExercisePerformance[], from?: Position): Position | undefined => {
  const startExercise = from?.exerciseIndex ?? 0
  for (let exerciseIndex = startExercise; exerciseIndex < performances.length; exerciseIndex += 1) {
    const sets = performances[exerciseIndex].sets ?? []
    const startSet = exerciseIndex === startExercise ? (from?.setIndex ?? 0) : 0
    for (let setIndex = startSet; setIndex < sets.length; setIndex += 1) {
      if (!sets[setIndex].completed) return { exerciseIndex, setIndex }
    }
  }
  return undefined
}

const makeTone = () => {
  navigator.vibrate?.([90, 55, 160])
  try {
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.08, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.22)
  } catch {
    // Alguns navegadores bloqueiam áudio até uma interação explícita.
  }
}

type WakeLockLike = { release: () => Promise<void> }
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockLike> } }

export const WorkoutRunner = ({
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
  const initialPerformances = useMemo(() => workout.exercises.map((exercise) => performanceForExercise(exercise, existing?.performances.find((item) => item.exerciseId === exercise.id))), [existing, workout.exercises])
  const hasConditioning = workout.exercises.some((item) => item.kind === 'conditioning')
  const isMartial = workout.kind === 'boxing' || workout.kind === 'hybrid'
  const initialPosition = nextOpenPosition(initialPerformances)
  const [performances, setPerformances] = useState(initialPerformances)
  const [position, setPosition] = useState<Position | undefined>(initialPosition)
  const [phase, setPhase] = useState<RunnerPhase>(initialPosition ? 'ready' : 'summary')
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [readiness, setReadiness] = useState<Readiness>(existing?.readiness ?? 'green')
  const [variant, setVariant] = useState(existing?.variant ?? 'Boxe')
  const [rpe, setRpe] = useState<number | undefined>(existing?.rpe)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [conditioning, setConditioning] = useState<ConditioningMetrics>(existing?.conditioning ?? { activity: workout.kind === 'boxing' ? 'Boxe' : 'Zona 2' })
  const [martial, setMartial] = useState<MartialMetrics>(existing?.martial ?? {})
  const [intervals, setIntervals] = useState<Record<string, { workSeconds: number; restSeconds: number }>>({})
  const [saving, setSaving] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const [durationMinutes, setDurationMinutes] = useState(existing?.durationMinutes ?? workout.durationMinutes)

  const currentExercise = position ? workout.exercises[position.exerciseIndex] : undefined
  const currentPerformance = position ? performances[position.exerciseIndex] : undefined
  const currentSet = position ? currentPerformance?.sets?.[position.setIndex] : undefined
  const interval = currentExercise ? intervals[currentExercise.id] ?? {
    workSeconds: currentExercise.workSeconds ?? workSecondsFromPrescription(currentExercise.reps) ?? 120,
    restSeconds: currentSet?.restSeconds ?? defaultRestSeconds(currentExercise),
  } : undefined

  const buildLog = useCallback((nextPerformances: ExercisePerformance[], completed: boolean): WorkoutLog => ({
    id: `${date}:${workout.id}`,
    date,
    templateId: workout.id,
    completed,
    readiness,
    durationMinutes,
    rpe,
    variant: workout.kind === 'hybrid' ? variant : undefined,
    notes,
    performances: nextPerformances,
    conditioning: hasConditioning ? conditioning : undefined,
    martial: isMartial ? martial : undefined,
    updatedAt: new Date().toISOString(),
  }), [conditioning, date, durationMinutes, hasConditioning, isMartial, martial, notes, readiness, rpe, variant, workout.id, workout.kind])

  useEffect(() => {
    const navigatorWithWakeLock = navigator as WakeLockNavigator
    let lock: WakeLockLike | undefined
    void navigatorWithWakeLock.wakeLock?.request('screen').then((value) => { lock = value }).catch(() => undefined)
    return () => { void lock?.release() }
  }, [])

  const beginCountdown = useCallback((nextPhase: RunnerPhase, duration: number) => {
    setPhase(nextPhase)
    setSeconds(Math.max(1, duration))
    setRunning(true)
  }, [])

  const updateCurrentSet = (patch: Partial<WorkoutSet>) => {
    if (!position || !currentExercise || !currentSet) return
    setPerformances((current) => current.map((performance, exerciseIndex) => {
      if (exerciseIndex !== position.exerciseIndex) return performance
      return performanceForExercise(currentExercise, { ...performance, sets: performance.sets?.map((set, setIndex) => setIndex === position.setIndex ? { ...set, ...patch } : set) })
    }))
  }

  const updateRoundCount = (count: number) => {
    if (!position || !currentExercise) return
    setPerformances((current) => current.map((performance, exerciseIndex) => {
      if (exerciseIndex !== position.exerciseIndex) return performance
      const sets = [...(performance.sets ?? [])]
      while (sets.length < count) sets.push({ id: crypto.randomUUID(), kind: 'work', completed: false, restSeconds: interval?.restSeconds })
      return performanceForExercise(currentExercise, { ...performance, sets: sets.slice(0, Math.max(1, count)) })
    }))
  }

  const moveAfterRest = useCallback(() => {
    const next = position ? nextOpenPosition(performances, { exerciseIndex: position.exerciseIndex, setIndex: position.setIndex + 1 }) : undefined
    setRunning(false)
    setSeconds(0)
    if (next) {
      setPosition(next)
      setPhase('ready')
    } else {
      setPosition(undefined)
      setPhase('summary')
      makeTone()
    }
  }, [performances, position])

  const completeCurrentSet = useCallback(() => {
    if (!position || !currentExercise || !currentSet) return
    const next = performances.map((performance, exerciseIndex) => {
      if (exerciseIndex !== position.exerciseIndex) return performance
      return performanceForExercise(currentExercise, { ...performance, sets: performance.sets?.map((set, setIndex) => setIndex === position.setIndex ? { ...set, completed: true } : set) })
    })
    const remaining = nextOpenPosition(next, { exerciseIndex: position.exerciseIndex, setIndex: position.setIndex + 1 })
    setPerformances(next)
    void onSave(buildLog(next, false))
    if (timed(currentExercise.kind) && isMartial) setMartial((current) => ({ ...current, roundsCompleted: (current.roundsCompleted ?? 0) + 1 }))
    if (!remaining) {
      setDurationMinutes(Math.max(1, Math.round((Date.now() - startedAt) / 60_000)))
      setPosition(undefined)
      setPhase('summary')
      setRunning(false)
      setSeconds(0)
      makeTone()
      return
    }
    makeTone()
    beginCountdown('rest', interval?.restSeconds ?? defaultRestSeconds(currentExercise))
  }, [beginCountdown, buildLog, currentExercise, currentSet, interval?.restSeconds, isMartial, onSave, performances, position, startedAt])

  useEffect(() => {
    if (!running || seconds <= 0) return undefined
    const timer = window.setTimeout(() => {
      if (seconds <= 1) {
        setSeconds(0)
        if (phase === 'work') completeCurrentSet()
        if (phase === 'rest') moveAfterRest()
      } else {
        setSeconds(seconds - 1)
      }
    }, 1_000)
    return () => window.clearTimeout(timer)
  }, [completeCurrentSet, moveAfterRest, phase, running, seconds])

  const startCurrent = () => {
    if (!currentExercise) return
    if (timed(currentExercise.kind)) {
      setConditioning((current) => ({ ...current, workSeconds: interval?.workSeconds, restSeconds: interval?.restSeconds }))
      beginCountdown('work', interval?.workSeconds ?? 120)
    }
    else setPhase('work')
  }

  const finish = async () => {
    const actualDuration = Math.max(1, Math.round((Date.now() - startedAt) / 60_000))
    setDurationMinutes(actualDuration)
    setSaving(true)
    try {
      await onSave({ ...buildLog(performances, true), durationMinutes: actualDuration })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const skip = () => {
    if (phase === 'work') completeCurrentSet()
    if (phase === 'rest') moveAfterRest()
  }

  const phaseLabel = phase === 'rest' ? 'Descanso' : timed(currentExercise?.kind ?? '') ? 'Round em curso' : 'Série em curso'
  return (
    <div className={`runner runner--${phase}`} role="dialog" aria-modal="true" aria-label="Modo treino">
      <header className="runner__header"><button type="button" className="runner__close" onClick={onClose} aria-label="Fechar modo treino">×</button><div><span>{phase === 'summary' ? 'Sessão pronta' : 'Modo treino'}</span><strong>{workout.shortTitle}</strong></div><span className="runner__progress">{position ? `${position.exerciseIndex + 1}/${workout.exercises.length}` : '✓'}</span></header>

      {phase === 'summary' ? (
        <main className="runner__summary">
          <p className="runner__eyebrow">Treino concluído</p><h1>Como foi a sessão?</h1>
          <div className="form-grid form-grid--2"><NumberField label="Esforço final" value={rpe} suffix="RPE" min={1} max={10} onChange={setRpe} /><NumberField label="Duração" value={durationMinutes} suffix="min" min={1} onChange={(value) => setDurationMinutes(value ?? durationMinutes)} /></div>
          {hasConditioning && <div className="form-grid form-grid--2"><label className="field field--wide"><span className="field__label">Modalidade</span><input value={conditioning.activity} onChange={(event) => setConditioning({ ...conditioning, activity: event.target.value })} /></label><NumberField label="Distância" value={conditioning.distanceKm} suffix="km" min={0} step={0.1} onChange={(value) => setConditioning({ ...conditioning, distanceKm: value })} /><NumberField label="FC média" value={conditioning.averageHeartRate} suffix="bpm" min={0} onChange={(value) => setConditioning({ ...conditioning, averageHeartRate: value })} /><NumberField label="FC máxima" value={conditioning.maxHeartRate} suffix="bpm" min={0} onChange={(value) => setConditioning({ ...conditioning, maxHeartRate: value })} /><label className="field"><span className="field__label">Zona</span><input value={conditioning.zone ?? ''} placeholder="Zona 2" onChange={(event) => setConditioning({ ...conditioning, zone: event.target.value })} /></label></div>}
          {isMartial && <div className="form-grid form-grid--2"><NumberField label="Rounds concluídos" value={martial.roundsCompleted} min={0} onChange={(value) => setMartial({ ...martial, roundsCompleted: value })} /><NumberField label="Sparring" value={martial.sparringRounds} min={0} onChange={(value) => setMartial({ ...martial, sparringRounds: value })} /><label className="field field--wide"><span className="field__label">Foco técnico</span><input value={martial.techniqueFocus ?? ''} placeholder="Defesa, distância, combinação..." onChange={(event) => setMartial({ ...martial, techniqueFocus: event.target.value })} /></label></div>}
          <label className="runner__notes"><span>Observações</span><textarea rows={3} value={notes} placeholder="Técnica, dor, energia..." onChange={(event) => setNotes(event.target.value)} /></label>
          <button className="runner__finish" type="button" disabled={saving} onClick={() => void finish()}>Salvar treino concluído</button>
        </main>
      ) : currentExercise && currentSet && position && interval ? (
        <main className="runner__main">
          <p className="runner__eyebrow">{phaseLabel}</p><h1>{currentExercise.name}</h1><p className="runner__prescription">{currentSet.kind === 'warmup' ? 'Aquecimento' : `${currentExercise.reps} · RIR ${currentExercise.rir}`}</p>
          {(phase === 'work' && timed(currentExercise.kind)) || phase === 'rest' ? <div className="runner__clock" aria-live="assertive"><span>{phase === 'rest' ? 'PAUSA' : `ROUND ${position.setIndex + 1}`}</span><strong>{formatTime(seconds)}</strong><small>{running ? 'em andamento' : 'pausado'}</small></div> : <div className="runner__set-number"><span>Série</span><strong>{position.setIndex + 1}</strong><small>de {currentPerformance?.sets?.length ?? 0}</small></div>}

          {phase === 'ready' && <>
            <div className="runner__readiness"><span>Prontidão</span>{(['green', 'yellow', 'red'] as Readiness[]).map((value) => <button key={value} className={readiness === value ? `is-active is-${value}` : ''} type="button" onClick={() => setReadiness(value)}>{value === 'green' ? 'Verde' : value === 'yellow' ? 'Amarelo' : 'Vermelho'}</button>)}</div>
            {workout.kind === 'hybrid' && <label className="runner__variant"><span>Sessão</span><select value={variant} onChange={(event) => setVariant(event.target.value)}><option>Boxe</option><option>Técnica leve + zona 2</option></select></label>}
            <div className="runner__config">{timed(currentExercise.kind) ? <><NumberField label="Rounds" value={currentPerformance?.sets?.length} min={1} max={30} onChange={(value) => updateRoundCount(value ?? 1)} /><NumberField label="Trabalho" value={interval.workSeconds} suffix="s" min={10} onChange={(value) => setIntervals({ ...intervals, [currentExercise.id]: { ...interval, workSeconds: value ?? interval.workSeconds } })} /><NumberField label="Pausa" value={interval.restSeconds} suffix="s" min={0} onChange={(value) => setIntervals({ ...intervals, [currentExercise.id]: { ...interval, restSeconds: value ?? interval.restSeconds } })} /></> : <><NumberField label="Carga" value={currentSet.loadKg} suffix="kg" min={0} step={0.5} onChange={(value) => updateCurrentSet({ loadKg: value })} /><NumberField label="Reps" value={currentSet.reps} min={0} max={100} onChange={(value) => updateCurrentSet({ reps: value })} />{loadable(currentExercise.kind) && <NumberField label="RIR" value={currentSet.rir} min={0} max={6} onChange={(value) => updateCurrentSet({ rir: value })} />}<NumberField label="Pausa" value={interval.restSeconds} suffix="s" min={0} onChange={(value) => setIntervals({ ...intervals, [currentExercise.id]: { ...interval, restSeconds: value ?? interval.restSeconds } })} /></>}</div>
            <button className="runner__start" type="button" onClick={startCurrent}>{timed(currentExercise.kind) ? 'Iniciar round' : 'Começar série'}</button>
          </>}
          {phase === 'work' && !timed(currentExercise.kind) && <button className="runner__start" type="button" onClick={completeCurrentSet}>Concluir série</button>}
          {(phase === 'work' && timed(currentExercise.kind)) || phase === 'rest' ? <div className="runner__timer-actions"><button type="button" onClick={() => setRunning(!running)}>{running ? 'Pausar' : 'Retomar'}</button><button type="button" onClick={skip}>Pular</button></div> : null}
          <button className="runner__manual" type="button" onClick={() => setPhase('summary')}>Encerrar e revisar</button>
        </main>
      ) : null}
    </div>
  )
}
