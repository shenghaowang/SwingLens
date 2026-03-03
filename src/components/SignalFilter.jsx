const SOURCES = ['MACD', 'RSI', 'Golden Cross', 'Death Cross', 'ADX', 'BB']

const SOURCE_COLORS = {
  'MACD':         'border-sky-500 text-sky-400 bg-sky-900/20',
  'RSI':          'border-purple-500 text-purple-400 bg-purple-900/20',
  'Golden Cross': 'border-yellow-500 text-yellow-400 bg-yellow-900/20',
  'Death Cross':  'border-orange-500 text-orange-400 bg-orange-900/20',
  'ADX':          'border-pink-500 text-pink-400 bg-pink-900/20',
  'BB':           'border-cyan-500 text-cyan-400 bg-cyan-900/20',
}

export default function SignalFilter({ enabled, onChange }) {
  const toggle = (src) =>
    onChange(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500">Signals:</span>
      {SOURCES.map(src => {
        const active = enabled.includes(src)
        return (
          <button
            key={src}
            onClick={() => toggle(src)}
            className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${
              active ? SOURCE_COLORS[src] : 'border-gray-700 text-gray-600 bg-transparent'
            }`}
          >
            {src}
          </button>
        )
      })}
    </div>
  )
}
