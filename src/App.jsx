import { useState } from 'react'
import SearchBar from './components/SearchBar'
import ChartPanel from './components/ChartPanel'
import SignalSummary from './components/SignalSummary'
import TimeRangeSelector from './components/TimeRangeSelector'
import MAToggle from './components/MAToggle'
import StockList from './components/StockList'
import { fetchStockData } from './utils/fetchStockData'
import { computeIndicators, computeSignals, computeCurrentSignal } from './utils/indicators'

const DEFAULT_MAS = [30, 60, 120]

export default function App() {
  const [ticker, setTicker] = useState('')
  const [range, setRange] = useState('1Y')
  const [data, setData] = useState(null)
  const [indicators, setIndicators] = useState(null)
  const [signals, setSignals] = useState(null)
  const [currentSignal, setCurrentSignal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [enabledMAs, setEnabledMAs] = useState(DEFAULT_MAS)

  const loadData = async (symbol) => {
    setLoading(true)
    setError(null)
    setData(null)
    setIndicators(null)
    setSignals(null)
    setCurrentSignal(null)
    try {
      const raw = await fetchStockData(symbol)
      const ind = computeIndicators(raw)
      const sig = computeSignals(raw, ind)
      const cur = computeCurrentSignal(raw, ind)  // { overall, breakdown }
      setData(raw)
      setIndicators(ind)
      setSignals(sig)
      setCurrentSignal(cur)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (symbol) => { setTicker(symbol); loadData(symbol) }
  const handleBack = () => {
    setTicker(''); setData(null); setIndicators(null)
    setSignals(null); setCurrentSignal(null); setError(null)
  }

  const isChartView = data || loading
  const latest = data?.[data.length - 1]

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <button onClick={handleBack} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🔭</span>
          <h1 className="text-xl font-bold text-white tracking-tight">SwingLens</h1>
        </button>
        <span className="text-gray-500 text-sm ml-1 hidden sm:inline">Swing Trading Technical Analysis</span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        <SearchBar onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        {isChartView && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button onClick={handleBack} className="text-gray-400 hover:text-white text-sm">← Watchlist</button>
                <h2 className="text-lg font-semibold text-white">{ticker}</h2>
              </div>
              <TimeRangeSelector selected={range} onChange={setRange} />
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-4 animate-pulse">⏳</div>
                <p>Loading {ticker}...</p>
              </div>
            ) : (
              <>
                <SignalSummary
                  overall={currentSignal?.overall}
                  breakdown={currentSignal?.breakdown}
                  ticker={ticker}
                  price={latest?.close}
                  date={latest ? new Date(latest.time * 1000).toLocaleDateString('en-CA') : null}
                />
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <MAToggle enabled={enabledMAs} onChange={setEnabledMAs} />
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span><span className="text-green-400 mr-1">▲</span>BUY</span>
                    <span><span className="text-red-400 mr-1">▼</span>SELL</span>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                  <ChartPanel data={data} indicators={indicators} signals={signals} enabledMAs={enabledMAs} range={range} />
                </div>
              </>
            )}
          </>
        )}

        {!isChartView && !error && <StockList onSelectTicker={handleSearch} />}
      </main>
    </div>
  )
}
