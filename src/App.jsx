import { useState } from 'react'
import SearchBar from './components/SearchBar'
import PriceChart from './components/PriceChart'
import MacdChart from './components/MacdChart'
import RsiChart from './components/RsiChart'
import SignalSummary from './components/SignalSummary'
import TimeRangeSelector from './components/TimeRangeSelector'
import { fetchStockData } from './utils/fetchStockData'
import { computeIndicators, computeSignals } from './utils/indicators'

export default function App() {
  const [ticker, setTicker] = useState('')
  const [range, setRange] = useState('1Y')
  const [data, setData] = useState(null)
  const [indicators, setIndicators] = useState(null)
  const [signals, setSignals] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadData = async (symbol, selectedRange) => {
    setLoading(true)
    setError(null)
    setData(null)
    setIndicators(null)
    setSignals(null)
    try {
      const raw = await fetchStockData(symbol, selectedRange)
      const ind = computeIndicators(raw)
      const sig = computeSignals(raw, ind)
      setData(raw)
      setIndicators(ind)
      setSignals(sig)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (symbol) => {
    setTicker(symbol)
    loadData(symbol, range)
  }

  const handleRangeChange = (newRange) => {
    setRange(newRange)
    if (ticker) loadData(ticker, newRange)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">🔭</span>
        <h1 className="text-xl font-bold text-white tracking-tight">SwingLens</h1>
        <span className="text-gray-500 text-sm ml-1">Swing Trading Technical Analysis</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        <SearchBar onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-white">{ticker}</h2>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span><span className="inline-block w-3 h-0.5 bg-yellow-400 mr-1 align-middle"></span>SMA 50</span>
                  <span><span className="inline-block w-3 h-0.5 bg-purple-500 mr-1 align-middle"></span>SMA 200</span>
                  <span><span className="text-green-400 mr-1">▲</span>BUY</span>
                  <span><span className="text-red-400 mr-1">▼</span>SELL</span>
                </div>
              </div>
              <TimeRangeSelector selected={range} onChange={handleRangeChange} />
            </div>

            <SignalSummary signals={signals} />

            <div className="bg-gray-900/50 rounded-xl p-4 space-y-4 border border-gray-800">
              <PriceChart data={data} indicators={indicators} signals={signals} />
              <MacdChart data={data} indicators={indicators} />
              <RsiChart data={data} indicators={indicators} />
            </div>
          </>
        )}

        {!data && !loading && !error && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">📈</div>
            <p className="text-lg">Enter a ticker symbol to start analysing</p>
            <p className="text-sm mt-2">e.g. AAPL · TSLA · NVDA · SPY</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p>Loading {ticker}...</p>
          </div>
        )}
      </main>
    </div>
  )
}
