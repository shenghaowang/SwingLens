import { useEffect, useState, useRef } from 'react'
import StockCard from './StockCard'
import { fetchStockData } from '../utils/fetchStockData'
import { getLatestSignal } from '../utils/getLatestSignal'
import { loadStocks } from '../utils/loadStocks'

const THEME_ICONS = {
  'FinTech & Crypto':    '💳',
  'Consumer':            '🛒',
  'Healthcare':         '🏥',
  'Hyperscalers':       '☁️',
  'AI & Semiconductors':'🤖',
  'Big Tech':           '📱',
  'Moonshots':          '🚀',
  'Financials':         '🏦',
  'Value & Dividend':   '💰',
  'Defensive':          '🛡️',
  'ETFs & Indices':     '📊',
}

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 350

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export default function StockList({ onSelectTicker }) {
  const [groups, setGroups] = useState([])       // [{ theme, tickers }]
  const [stockMap, setStockMap] = useState({})   // { AAPL: { signal, price, ... } }
  const [filter, setFilter] = useState('ALL')
  const abortRef = useRef(false)

  useEffect(() => {
    abortRef.current = false

    async function fetchAll() {
      const loaded = await loadStocks()
      setGroups(loaded)

      // Flatten all tickers, deduplicated
      const allTickers = [...new Set(loaded.flatMap(g => g.tickers))]

      // Init all as loading
      const init = {}
      allTickers.forEach(t => { init[t] = { signal: 'NEUTRAL', price: null, changePercent: null, loading: true } })
      setStockMap(init)

      for (let i = 0; i < allTickers.length; i += BATCH_SIZE) {
        if (abortRef.current) break
        const batch = allTickers.slice(i, i + BATCH_SIZE)
        await Promise.all(batch.map(async (ticker) => {
          try {
            const data = await fetchStockData(ticker)
            if (abortRef.current) return
            const signal = getLatestSignal(data)
            const latest = data[data.length - 1]
            const prev   = data[data.length - 2]
            const changePercent = prev ? ((latest.close - prev.close) / prev.close) * 100 : 0
            setStockMap(prev => ({ ...prev, [ticker]: { signal, price: latest.close, changePercent, loading: false } }))
          } catch {
            setStockMap(prev => ({ ...prev, [ticker]: { signal: 'NEUTRAL', price: null, changePercent: null, loading: false } }))
          }
        }))
        if (i + BATCH_SIZE < allTickers.length) await sleep(BATCH_DELAY_MS)
      }
    }

    fetchAll()
    return () => { abortRef.current = true }
  }, [])

  const allStocks = Object.entries(stockMap)
  const buyCnt  = allStocks.filter(([, s]) => s.signal === 'BUY').length
  const sellCnt = allStocks.filter(([, s]) => s.signal === 'SELL').length

  const filterTickers = (tickers) => {
    if (filter === 'ALL') return tickers
    return tickers.filter(t => stockMap[t]?.signal === filter)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Watchlist</h2>
          <span className="text-xs text-green-400 font-medium bg-green-900/30 px-2 py-0.5 rounded">{buyCnt} BUY</span>
          <span className="text-xs text-red-400 font-medium bg-red-900/30 px-2 py-0.5 rounded">{sellCnt} SELL</span>
        </div>
        <div className="flex gap-1">
          {['ALL', 'BUY', 'SELL', 'NEUTRAL'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Themed groups */}
      {groups.map(({ theme, tickers }) => {
        const visible = filterTickers(tickers)
        if (visible.length === 0) return null
        const icon = THEME_ICONS[theme] ?? '📈'
        const groupBuy  = tickers.filter(t => stockMap[t]?.signal === 'BUY').length
        const groupSell = tickers.filter(t => stockMap[t]?.signal === 'SELL').length

        return (
          <div key={theme}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{icon}</span>
              <h3 className="text-sm font-semibold text-gray-200">{theme}</h3>
              <span className="text-xs text-gray-600">·</span>
              {groupBuy  > 0 && <span className="text-xs text-green-400">{groupBuy} BUY</span>}
              {groupSell > 0 && <span className="text-xs text-red-400">{groupSell} SELL</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {visible.map(ticker => (
                <StockCard
                  key={ticker}
                  ticker={ticker}
                  {...(stockMap[ticker] ?? { signal: 'NEUTRAL', loading: true })}
                  onClick={() => onSelectTicker(ticker)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
