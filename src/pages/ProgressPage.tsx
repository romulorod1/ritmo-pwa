import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { NumberField } from '../components/NumberField'
import { WeightChart } from '../components/WeightChart'
import type { AppData, BodyEntry } from '../types/domain'
import { formatDateShort, todayIso } from '../utils/date'
import { adjustmentMessage, latestWeightAverage, nextMilestone, weeklyRate } from '../utils/progress'

const blankEntry = (date = todayIso()): BodyEntry => ({ date, weightKg: 0, notes: '', updatedAt: new Date().toISOString() })

export const ProgressPage = ({ data, onSave, onDelete }: { data: AppData; onSave: (entry: BodyEntry) => Promise<void>; onDelete: (date: string) => Promise<void> }) => {
  const [draft, setDraft] = useState<BodyEntry>(() => data.bodyEntries.find((item) => item.date === todayIso()) ?? blankEntry())
  const [saving, setSaving] = useState(false)
  const average = latestWeightAverage(data.bodyEntries)
  const rate = weeklyRate(data.bodyEntries)
  const milestone = nextMilestone(data.settings.milestones, todayIso())
  const completedWorkouts = data.workoutLogs.filter((item) => item.completed).length
  const nutritionDays = data.nutritionLogs.filter((item) => item.completedMealIds.length >= Math.ceil(data.settings.mealTemplates.length * 0.8)).length
  const save = async () => {
    if (!draft.weightKg || draft.weightKg < 30 || draft.weightKg > 250) return
    setSaving(true)
    try {
      await onSave({ ...draft, updatedAt: new Date().toISOString() })
      setDraft(blankEntry(todayIso()))
    } finally { setSaving(false) }
  }
  const edit = (entry: BodyEntry) => { setDraft(entry); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const sortedHistory = useMemo(() => [...data.bodyEntries].sort((a, b) => b.date.localeCompare(a.date)), [data.bodyEntries])
  return (
    <main className="page">
      <header className="page-heading"><div><p className="eyebrow">Tendência real</p><h1>Evolução</h1></div></header>
      <section className="stats-grid">
        <div className="stat-card stat-card--accent"><span>Média atual</span><strong>{average ? `${average.average.toFixed(2)} kg` : '—'}</strong><small>{average ? `${average.count} registro${average.count > 1 ? 's' : ''} na média` : 'Sem pesos'}</small></div>
        <div className="stat-card"><span>Ritmo semanal</span><strong>{rate === undefined ? '—' : `${rate > 0 ? '+' : ''}${rate.toFixed(2)} kg`}</strong><small>em sete dias</small></div>
        <div className="stat-card"><span>Treinos feitos</span><strong>{completedWorkouts}</strong><small>sessões registradas</small></div>
        <div className="stat-card"><span>Dias aderentes</span><strong>{nutritionDays}</strong><small>≥80% das refeições</small></div>
      </section>
      <section className="card">
        <div className="card__heading"><div><p className="eyebrow">Média móvel</p><h2>Peso</h2></div>{milestone && <span className="metric-chip">meta {milestone.minWeightKg.toFixed(1)}–{milestone.maxWeightKg.toFixed(1)}</span>}</div>
        <WeightChart entries={data.bodyEntries} />
        <p className="inline-note">{adjustmentMessage(rate)}</p>
      </section>
      <section className="card">
        <div className="card__heading"><div><p className="eyebrow">Novo registro</p><h2>Antropometria</h2></div><Icon name="scale" /></div>
        <div className="form-grid form-grid--2">
          <label className="field field--wide"><span className="field__label">Data</span><input type="date" value={draft.date} onChange={(event) => { const existing = data.bodyEntries.find((item) => item.date === event.target.value); setDraft(existing ?? blankEntry(event.target.value)) }} /></label>
          <NumberField label="Peso" value={draft.weightKg || undefined} suffix="kg" step={0.05} min={30} max={250} required onChange={(value) => setDraft({ ...draft, weightKg: value ?? 0 })} />
          <NumberField label="Gordura" value={draft.bodyFatPct} suffix="%" step={0.1} min={1} max={70} onChange={(value) => setDraft({ ...draft, bodyFatPct: value })} />
          <NumberField label="Cintura" value={draft.waistCm} suffix="cm" step={0.1} min={30} onChange={(value) => setDraft({ ...draft, waistCm: value })} />
          <NumberField label="Abdômen" value={draft.abdomenCm} suffix="cm" step={0.1} min={30} onChange={(value) => setDraft({ ...draft, abdomenCm: value })} />
          <NumberField label="Braço relaxado" value={draft.armRelaxedCm} suffix="cm" step={0.1} min={10} onChange={(value) => setDraft({ ...draft, armRelaxedCm: value })} />
          <NumberField label="Braço contraído" value={draft.armFlexedCm} suffix="cm" step={0.1} min={10} onChange={(value) => setDraft({ ...draft, armFlexedCm: value })} />
          <NumberField label="Coxa" value={draft.thighCm} suffix="cm" step={0.1} min={20} onChange={(value) => setDraft({ ...draft, thighCm: value })} />
          <NumberField label="Panturrilha" value={draft.calfCm} suffix="cm" step={0.1} min={15} onChange={(value) => setDraft({ ...draft, calfCm: value })} />
          <label className="field field--wide"><span className="field__label">Observações</span><textarea rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
        </div>
        <button className="button button--primary button--full" type="button" disabled={saving || !draft.weightKg} onClick={() => void save()}>Salvar registro</button>
      </section>
      <section className="card">
        <div className="card__heading"><div><p className="eyebrow">Histórico local</p><h2>Últimos registros</h2></div></div>
        {sortedHistory.length ? <div className="history-list">{sortedHistory.slice(0, 10).map((entry) => <div className="history-row" key={entry.date}><div><strong>{formatDateShort(entry.date)}</strong><small>{entry.waistCm ? `Cintura ${entry.waistCm} cm` : 'Somente peso'}</small></div><strong>{entry.weightKg.toFixed(2)} kg</strong><button className="icon-button" type="button" aria-label={`Editar ${entry.date}`} onClick={() => edit(entry)}><Icon name="edit" size={18} /></button><button className="icon-button icon-button--danger" type="button" aria-label={`Excluir ${entry.date}`} onClick={() => window.confirm(`Excluir o registro de ${formatDateShort(entry.date)}?`) && void onDelete(entry.date)}><Icon name="trash" size={18} /></button></div>)}</div> : <div className="empty-state"><p>Nenhuma medição registrada.</p></div>}
      </section>
    </main>
  )
}
