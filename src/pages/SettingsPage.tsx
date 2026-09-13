import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { NumberField } from '../components/NumberField'
import { downloadBackup, parseBackup } from '../services/backup'
import type { AppData, AppSettings, MealTemplate } from '../types/domain'

const MealEditor = ({ meal, onSave, onClose }: { meal: MealTemplate; onSave: (meal: MealTemplate) => Promise<void>; onClose: () => void }) => {
  const [draft, setDraft] = useState(structuredClone(meal))
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!draft.title.trim() || !draft.time.trim() || draft.items.some((item) => !item.trim())) return
    setSaving(true)
    try { await onSave(draft); onClose() } finally { setSaving(false) }
  }
  return <Modal title="Editar refeição" onClose={onClose}>
    <div className="form-grid sheet-section">
      <label className="field"><span className="field__label">Nome</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
      <label className="field"><span className="field__label">Horário</span><input value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label>
      <label className="field"><span className="field__label">Itens — um por linha</span><textarea rows={7} value={draft.items.join('\n')} onChange={(event) => setDraft({ ...draft, items: event.target.value.split('\n') })} /></label>
      <label className="field"><span className="field__label">Observação</span><textarea rows={3} value={draft.note ?? ''} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label>
    </div>
    <div className="sheet-actions"><button className="button button--primary button--full" type="button" disabled={saving} onClick={() => void submit()}>Salvar refeição</button></div>
  </Modal>
}

export const SettingsPage = ({ data, onSaveSettings, onRestore, onReset }: { data: AppData; onSaveSettings: (settings: AppSettings) => Promise<void>; onRestore: (data: AppData) => Promise<void>; onReset: () => Promise<void> }) => {
  const [draft, setDraft] = useState(structuredClone(data.settings))
  const [editingMeal, setEditingMeal] = useState<MealTemplate>()
  const [message, setMessage] = useState<string>()
  const [storageState, setStorageState] = useState<string>()
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    // O estado do formulário acompanha restaurações de backup e resets externos.
    // oxlint-disable-next-line react/set-state-in-effect
    setDraft(structuredClone(data.settings))
  }, [data.settings])
  useEffect(() => { void navigator.storage?.persisted?.().then((value) => setStorageState(value ? 'Armazenamento protegido pelo navegador' : 'Faça backups periódicos')) }, [])
  const saveTargets = async () => { await onSaveSettings(draft); setMessage('Metas atualizadas no aparelho.') }
  const saveMeal = async (meal: MealTemplate) => {
    const settings = { ...data.settings, mealTemplates: data.settings.mealTemplates.map((item) => item.id === meal.id ? meal : item) }
    await onSaveSettings(settings)
  }
  const importFile = async (file: File) => {
    try {
      const backup = parseBackup(await file.text())
      const label = new Date(backup.exportedAt).toLocaleString('pt-BR')
      if (!window.confirm(`Restaurar o backup de ${label}? Os dados atuais serão substituídos somente após sua confirmação.`)) return
      await onRestore(backup.data)
      setMessage('Backup restaurado com sucesso.')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Não foi possível importar o backup.')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }
  const requestPersistence = async () => {
    if (!navigator.storage?.persist) { setStorageState('Este navegador não oferece proteção adicional. Use o backup.'); return }
    const granted = await navigator.storage.persist()
    setStorageState(granted ? 'Armazenamento protegido pelo navegador' : 'Proteção não concedida; mantenha backups periódicos')
  }
  return <main className="page">
    <header className="page-heading"><div><p className="eyebrow">Plano e dados</p><h1>Ajustes</h1></div></header>
    {message && <button type="button" className="status-banner" onClick={() => setMessage(undefined)}>{message}<Icon name="close" size={16} /></button>}
    <section className="card">
      <div className="card__heading"><div><p className="eyebrow">Objetivo atual</p><h2>Metas</h2></div></div>
      <div className="form-grid form-grid--2">
        <label className="field field--wide"><span className="field__label">Nome do plano</span><input value={draft.planName} onChange={(event) => setDraft({ ...draft, planName: event.target.value })} /></label>
        <label className="field"><span className="field__label">Início</span><input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} /></label>
        <label className="field"><span className="field__label">Reavaliação</span><input type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value, consultationDate: event.target.value })} /></label>
        <NumberField label="Peso mínimo" value={draft.targetWeightMinKg} suffix="kg" step={0.1} onChange={(value) => setDraft({ ...draft, targetWeightMinKg: value ?? 0 })} />
        <NumberField label="Peso máximo" value={draft.targetWeightMaxKg} suffix="kg" step={0.1} onChange={(value) => setDraft({ ...draft, targetWeightMaxKg: value ?? 0 })} />
        <NumberField label="Gordura mínima" value={draft.targetBodyFatMin} suffix="%" step={0.1} onChange={(value) => setDraft({ ...draft, targetBodyFatMin: value ?? 0 })} />
        <NumberField label="Gordura máxima" value={draft.targetBodyFatMax} suffix="%" step={0.1} onChange={(value) => setDraft({ ...draft, targetBodyFatMax: value ?? 0 })} />
      </div>
      <h3 className="subsection-title">Metas diárias</h3>
      <div className="form-grid form-grid--2">
        <NumberField label="Energia" value={draft.caloriesTarget} suffix="kcal" step={50} onChange={(value) => setDraft({ ...draft, caloriesTarget: value ?? 0 })} />
        <NumberField label="Proteína" value={draft.proteinTargetG} suffix="g" step={5} onChange={(value) => setDraft({ ...draft, proteinTargetG: value ?? 0 })} />
        <NumberField label="Carboidratos" value={draft.carbsTargetG} suffix="g" step={5} onChange={(value) => setDraft({ ...draft, carbsTargetG: value ?? 0 })} />
        <NumberField label="Gorduras" value={draft.fatTargetG} suffix="g" step={5} onChange={(value) => setDraft({ ...draft, fatTargetG: value ?? 0 })} />
        <NumberField label="Água" value={draft.waterTargetMl} suffix="ml" step={100} onChange={(value) => setDraft({ ...draft, waterTargetMl: value ?? 0 })} />
        <NumberField label="Passos mínimos" value={draft.stepsMin} step={500} onChange={(value) => setDraft({ ...draft, stepsMin: value ?? 0 })} />
      </div>
      <button className="button button--primary button--full" type="button" onClick={() => void saveTargets()}>Salvar metas</button>
    </section>
    <section className="card">
      <div className="card__heading"><div><p className="eyebrow">Estrutura editável</p><h2>Plano alimentar</h2></div></div>
      <div className="settings-list">{data.settings.mealTemplates.map((meal) => <button className="settings-row" type="button" key={meal.id} onClick={() => setEditingMeal(meal)}><span><strong>{meal.title}</strong><small>{meal.time} · {meal.items.length} itens</small></span><Icon name="edit" size={19} /></button>)}</div>
    </section>
    <section className="card">
      <div className="card__heading"><div><p className="eyebrow">Somente neste aparelho</p><h2>Backup e privacidade</h2></div><Icon name="shield" /></div>
      <p className="card-copy">Seus registros ficam no IndexedDB deste navegador e não são enviados para nenhuma API. Exporte um backup antes de trocar de aparelho ou limpar dados do Safari.</p>
      <div className="stacked-actions">
        <button className="button button--secondary button--full" type="button" onClick={() => downloadBackup(data)}><Icon name="download" size={19} />Exportar backup JSON</button>
        <button className="button button--secondary button--full" type="button" onClick={() => fileInput.current?.click()}><Icon name="upload" size={19} />Importar backup</button>
        <input ref={fileInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file) }} />
        <button className="text-button text-button--center" type="button" onClick={() => void requestPersistence()}>{storageState ?? 'Verificar armazenamento'}</button>
      </div>
    </section>
    <section className="card install-card"><p className="eyebrow">Instalar no iPhone</p><h2>Adicionar à Tela de Início</h2><ol><li>Abra o site no Safari.</li><li>Toque em Compartilhar.</li><li>Escolha “Adicionar à Tela de Início”.</li><li>Abra uma vez com internet; depois o app funciona offline.</li></ol></section>
    <section className="danger-zone"><button type="button" className="text-button text-button--danger" onClick={() => { if (window.confirm('Apagar registros e restaurar o plano inicial? Exporte um backup antes se quiser preservar os dados.')) void onReset().then(() => setMessage('Plano inicial restaurado.')) }}>Restaurar dados iniciais</button><small>Esta ação substitui todos os registros locais.</small></section>
    {editingMeal && <MealEditor meal={editingMeal} onSave={saveMeal} onClose={() => setEditingMeal(undefined)} />}
  </main>
}
