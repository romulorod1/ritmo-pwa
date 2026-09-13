import type { BodyEntry } from '../types/domain'
import { rollingWeightAverages } from '../utils/progress'

export const WeightChart = ({ entries }: { entries: BodyEntry[] }) => {
  const values = rollingWeightAverages(entries).slice(-30)
  if (values.length < 2) {
    return <div className="empty-chart">Registre mais um peso para formar o gráfico.</div>
  }
  const width = 320
  const height = 150
  const padding = 18
  const weights = values.map((item) => item.average)
  const min = Math.min(...weights, 62) - 0.4
  const max = Math.max(...weights, 65.55) + 0.4
  const x = (index: number) => padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2)
  const y = (value: number) => height - padding - ((value - min) / (max - min)) * (height - padding * 2)
  const points = values.map((item, index) => `${x(index)},${y(item.average)}`).join(' ')
  const targetTop = y(62.7)
  const targetBottom = y(62)

  return (
    <div className="chart-wrap" aria-label="Gráfico da média de peso">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <title>Média móvel de peso dos últimos registros</title>
        <rect x={padding} y={targetTop} width={width - padding * 2} height={Math.max(3, targetBottom - targetTop)} rx="3" className="chart-target" />
        <line x1={padding} y1={y(weights[0])} x2={width - padding} y2={y(weights[0])} className="chart-grid" />
        <polyline points={points} className="chart-line" />
        {values.map((item, index) => <circle key={item.date} cx={x(index)} cy={y(item.average)} r={index === values.length - 1 ? 4 : 2.5} className="chart-dot" />)}
        <text x={padding} y={13} className="chart-label">{max.toFixed(1)} kg</text>
        <text x={padding} y={height - 3} className="chart-label">{min.toFixed(1)} kg</text>
      </svg>
      <div className="chart-caption"><span><i className="legend-line" />média de 7 registros</span><span><i className="legend-target" />meta final</span></div>
    </div>
  )
}

