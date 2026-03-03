const SIGNAL_STYLE = {
  BUY:     { bg: 'bg-green-900/30 border-green-600', text: 'text-green-400',  badge: 'bg-green-900/60 text-green-300', label: '▲ BUY'     },
  SELL:    { bg: 'bg-red-900/30 border-red-600',     text: 'text-red-400',    badge: 'bg-red-900/60 text-red-300',     label: '▼ SELL'    },
  NEUTRAL: { bg: 'bg-gray-800/40 border-gray-700',   text: 'text-gray-400',   badge: 'bg-gray-700/60 text-gray-400',   label: '— NEUTRAL' },
}

const INDICATOR_LABELS = {
  MACD:       'MACD',
  RSI:        'RSI',
  'MA Cross': 'MA Cross',
}

function IndicatorBadge({ name, signal }) {
  const s = SIGNAL_STYLE[signal] ?? SIGNAL_STYLE.NEUTRAL
  return (
    <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border ${s.bg} min-w-[80px]`}>
      <span className="text-xs text-gray-500 mb-0.5">{INDICATOR_LABELS[name] ?? name}</span>
      <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
    </div>
  )
}

export default function SignalSummary({ overall, breakdown, ticker, price, date }) {
  const s = SIGNAL_STYLE[overall] ?? SIGNAL_STYLE.NEUTRAL

  return (
    <div className={`rounded-xl px-5 py-4 border ${s.bg} space-y-3`}>
      {/* Top row: overall signal + meta */}
      <div className="flex items-center gap-5 flex-wrap">
        <div className={`text-2xl font-bold ${s.text}`}>{s.label}</div>
        <div className="text-sm text-gray-400">
          <span className="text-white font-medium">{ticker}</span>
          {date && <> · as of <span className="text-white font-medium">{date}</span></>}
          <div className="text-xs text-gray-500 mt-0.5">Majority vote across 3 indicators</div>
        </div>
        {price != null && (
          <div className="ml-auto text-right">
            <div className="text-white font-semibold">${price.toFixed(2)}</div>
            <div className="text-xs text-gray-500">latest close</div>
          </div>
        )}
      </div>

      {/* Breakdown row */}
      {breakdown && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(breakdown).map(([name, signal]) => (
            <IndicatorBadge key={name} name={name} signal={signal} />
          ))}
        </div>
      )}
    </div>
  )
}
