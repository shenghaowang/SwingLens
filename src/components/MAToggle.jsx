import { MA_PERIODS, MA_COLORS } from '../utils/indicators'

export default function MAToggle({ enabled, onChange }) {
  const toggle = (period) => {
    onChange(prev =>
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500">MA:</span>
      {MA_PERIODS.map(p => {
        const active = enabled.includes(p)
        return (
          <button
            key={p}
            onClick={() => toggle(p)}
            className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${
              active ? 'opacity-100' : 'opacity-30'
            }`}
            style={{
              borderColor: MA_COLORS[p],
              color: active ? MA_COLORS[p] : '#9ca3af',
              backgroundColor: active ? `${MA_COLORS[p]}18` : 'transparent',
            }}
          >
            {p}
          </button>
        )
      })}
    </div>
  )
}
