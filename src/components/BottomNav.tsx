import { Icon, type IconName } from './Icon'

export type AppTab = 'today' | 'training' | 'progress' | 'settings'

const items: { id: AppTab; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Hoje', icon: 'today' },
  { id: 'training', label: 'Treinos', icon: 'training' },
  { id: 'progress', label: 'Evolução', icon: 'progress' },
  { id: 'settings', label: 'Ajustes', icon: 'settings' },
]

export const BottomNav = ({ active, onChange }: { active: AppTab; onChange: (tab: AppTab) => void }) => (
  <nav className="bottom-nav" aria-label="Navegação principal">
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        className={active === item.id ? 'bottom-nav__item is-active' : 'bottom-nav__item'}
        onClick={() => onChange(item.id)}
        aria-current={active === item.id ? 'page' : undefined}
      >
        <Icon name={item.icon} size={23} />
        <span>{item.label}</span>
      </button>
    ))}
  </nav>
)

