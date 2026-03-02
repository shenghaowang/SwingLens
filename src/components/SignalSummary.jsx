export default function SignalSummary({ signals }) {
  if (!signals || signals.length === 0) return null

  const latest = signals[signals.length - 1]
  const date = new Date(latest.time * 1000).toLocaleDateString('en-CA')
  const isBuy = latest.type === 'BUY'

  return (
    <div className={`rounded-lg px-5 py-3 flex items-center gap-4 border ${isBuy ? 'bg-green-900/30 border-green-600' : 'bg-red-900/30 border-red-600'}`}>
      <div className={`text-2xl font-bold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
        {isBuy ? '▲ BUY' : '▼ SELL'}
      </div>
      <div className="text-gray-300 text-sm">
        <div>Latest signal: <span className="text-white font-medium">{date}</span></div>
        <div>Price: <span className="text-white font-medium">${latest.price.toFixed(2)}</span></div>
      </div>
      <div className="ml-auto text-gray-400 text-xs">{signals.length} signal{signals.length > 1 ? 's' : ''} total</div>
    </div>
  )
}
