import { useState } from 'react'

export default function SearchBar({ onSearch, loading }) {
  const [ticker, setTicker] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (ticker.trim()) onSearch(ticker.trim().toUpperCase())
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <input
        type="text"
        value={ticker}
        onChange={e => setTicker(e.target.value)}
        placeholder="Enter ticker (e.g. AAPL, TSLA)"
        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? 'Loading...' : 'Analyse'}
      </button>
    </form>
  )
}
