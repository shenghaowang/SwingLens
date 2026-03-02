import { useEffect, useState, useRef } from 'react'
import StockCard from './StockCard'
import { fetchStockData } from '../utils/fetchStockData'
import { getLatestSignal } from '../utils/getLatestSignal'
import { loadStocks } from '../utils/loadStocks'

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 400

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export default function StockList({ onSelectTicker }) {
  const [stocks, setStocks] = useState([])
  const [filter, setFilter] = useState('ALL')
  const abortRef = useRef(false)

  useEffect(() => {
    abortRef.current = false

    async function fetchAll() {
      const tickers = await loadStocks()
      // Init all as loading
      setStocks(tickers.map(ticker => ({ ticker, signal: 'NEUTRAL', price: null, change: null, changePercent: null, loading: true })))

      for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
        if (abortRef.current) break
        const batch = tickers.slice(i, i + BATCH_SIZE)
        await Promise.all(batch.map(async (ticker) => {
          try {
            const data = await fetchStockData(ticker, '1Y')
            if (abortRef.current) return
            const signal = getLatestSignal(data)
            const latest = data[data.length - 1]
            const prev = data[data.length - 2]
            const change = latest.close - prev.close
            const changePercent = (change / prev.close) * 100
            setStocks(prev => prev.map(s =>
              s.ticker === ticker ? { ticker, signal, price: latest.close, change, changePercent, loading: false } : s
            ))
          } catch {
            setStocks(prev => prev.map(s =>
              s.ticker === ticker ? { ...s, loading: false, signal: 'NEUTRAL' } : s
            ))
          }
        }))
        if (i + BATCH_SIZE < tickers.length) await sleep(BATCH_DELAY_MS)
      }
    }

    fetchAll()
    return () => { abortRef.current = true }
  }, [])

  const filtered = filter === 'ALL' ? stocks
    : filter === 'BUY' ? stocks.filter(s => s.signal === 'BUY')
    : filter === 'SELL' ? stocks.filter(s => s.signal === 'SELL')
    : stocks.filter(s => s.signal === 'NEUTRAL')

  const buyCnt = stocks.filter(s => s.signal === 'BUY').length
  const sellCnt = stocks.filter(s => s.signal === 'SELL').length

  return (
    <div className="space-y-4">
      {/* Header + filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Watchlist</h2>
          <span className="text-xs text-green-400 font-medium">{buyCnt} BUY</span>
          <span className="text-xs text-red-400 font-medium">{sellCnt} SELL</span>
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

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map(s => (
          <StockCard
            key={s.ticker}
            {...s}
            onClick={() => onSelectTicker(s.ticker)}
          />
        ))}
      </div>
    </div>
  )
}
