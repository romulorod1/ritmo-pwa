import { useEffect, useState } from 'react'
import { BottomNav, type AppTab } from './components/BottomNav'
import { Icon } from './components/Icon'
import { useAppData } from './hooks/useAppData'
import { ProgressPage } from './pages/ProgressPage'
import { SettingsPage } from './pages/SettingsPage'
import { TodayPage } from './pages/TodayPage'
import { TrainingPage } from './pages/TrainingPage'

const App = () => {
  const controller = useAppData()
  const [tab, setTab] = useState<AppTab>('today')
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])

  if (controller.loading) {
    return <div className="app-state"><div className="brand-mark">R</div><p>Abrindo seus dados locais…</p></div>
  }

  if (!controller.data) {
    return <div className="app-state"><div className="brand-mark">R</div><h1>Não foi possível abrir o Ritmo</h1><p>{controller.error ?? 'Recarregue o aplicativo para tentar novamente.'}</p><button className="button button--primary" type="button" onClick={() => window.location.reload()}>Recarregar</button></div>
  }

  const data = controller.data
  return (
    <div className="app-shell">
      <div className="app-topbar">
        <button className="brand" type="button" onClick={() => setTab('today')} aria-label="Ir para Hoje"><span className="brand-mark">R</span><span>Ritmo</span></button>
        <div className="sync-state" aria-live="polite">
          {!online ? <><span className="state-dot state-dot--offline" />Offline</> : controller.saving ? <><span className="state-dot state-dot--saving" />Salvando</> : <><Icon name="check" size={15} />No aparelho</>}
        </div>
      </div>

      {controller.error && <div className="global-error" role="alert">{controller.error}</div>}

      {tab === 'today' && <TodayPage data={data} onSaveWorkout={controller.upsertWorkoutLog} onSaveNutrition={controller.upsertNutritionLog} onSaveBody={controller.upsertBodyEntry} />}
      {tab === 'training' && <TrainingPage settings={data.settings} onSave={controller.updateSettings} />}
      {tab === 'progress' && <ProgressPage data={data} onSave={controller.upsertBodyEntry} onDelete={controller.removeBodyEntry} />}
      {tab === 'settings' && <SettingsPage data={data} onSaveSettings={controller.updateSettings} onRestore={controller.restoreData} onReset={controller.resetData} />}

      <BottomNav active={tab} onChange={(next) => { setTab(next); window.scrollTo({ top: 0, behavior: 'instant' }) }} />
    </div>
  )
}

export default App

