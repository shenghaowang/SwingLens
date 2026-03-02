export default function StockCard({ ticker, signal, price, change, changePercent, onClick, loading }) {
  const signalStyle = {
    BUY:     'bg-green-900/40 border-green-600 text-green-400',
    SELL:    'bg-red-900/40 border-red-600 text-red-400',
    NEUTRAL: 'bg-gray-800/40 border-gray-700 text-gray-400',
  }[signal] ?? 'bg-gray-800/40 border-gray-700 text-gray-400'

  const signalLabel = { BUY: '▲ BUY', SELL: '▼ SELL', NEUTRAL: '— ' }[signal] ?? '—'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-all hover:scale-[1.02] hover:brightness-110 cursor-pointer ${signalStyle}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-white text-sm">{ticker}</span>
        <span className={`text-xs font-semibold ${
          signal === 'BUY' ? 'text-green-400' : signal === 'SELL' ? 'text-red-400' : 'text-gray-500'
        }`}>{signalLabel}</span>
      </div>
      {loading ? (
        <div className="text-xs text-gray-600 animate-pulse">Loading...</div>
      ) : (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300">${price?.toFixed(2) ?? '—'}</span>
          <span className={changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
            {changePercent != null ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%` : ''}
          </span>
        </div>
      )}
    </button>
  )
}
