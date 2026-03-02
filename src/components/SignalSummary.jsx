export default function SignalSummary({ signal, ticker, price, date }) {
  const config = {
    BUY:     { bg: 'bg-green-900/30 border-green-600', text: 'text-green-400', label: '▲ BUY',     desc: 'MACD bullish + RSI oversold' },
    SELL:    { bg: 'bg-red-900/30 border-red-600',     text: 'text-red-400',   label: '▼ SELL',    desc: 'MACD bearish + RSI overbought' },
    NEUTRAL: { bg: 'bg-gray-800/40 border-gray-700',   text: 'text-gray-400',  label: '— NEUTRAL', desc: 'No clear signal today' },
  }[signal] ?? { bg: 'bg-gray-800/40 border-gray-700', text: 'text-gray-400', label: '—', desc: '' }

  return (
    <div className={`rounded-lg px-5 py-3 flex items-center gap-5 border ${config.bg}`}>
      <div className={`text-2xl font-bold ${config.text}`}>{config.label}</div>
      <div className="text-sm text-gray-400">
        <span className="text-white font-medium">{ticker}</span> as of <span className="text-white font-medium">{date}</span>
        <div className="text-xs mt-0.5">{config.desc}</div>
      </div>
      {price && (
        <div className="ml-auto text-right">
          <div className="text-white font-semibold">${price.toFixed(2)}</div>
          <div className="text-xs text-gray-500">latest close</div>
        </div>
      )}
    </div>
  )
}
