// Always fetch full 5Y — time range selector controls the visible window, not the data
export async function fetchStockData(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5y&interval=1d`
  const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`
  const res = await fetch(proxy)
  if (!res.ok) throw new Error(`Failed to fetch data for ${ticker}`)
  const json = await res.json()
  const result = json.chart.result[0]
  const timestamps = result.timestamp
  const quotes = result.indicators.quote[0]
  return timestamps.map((t, i) => ({
    time: t,
    open: quotes.open[i],
    high: quotes.high[i],
    low: quotes.low[i],
    close: quotes.close[i],
    volume: quotes.volume[i],
  })).filter(d => d.close !== null)
}
