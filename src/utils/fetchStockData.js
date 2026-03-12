// Always fetch full 5Y — time range selector controls the visible window, not the data
export async function fetchStockData(ticker) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=5y&interval=1d`
  const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`

  let res
  try {
    res = await fetch(proxy)
  } catch {
    throw new Error(`Network error — unable to reach data provider. Check your connection.`)
  }

  if (!res.ok) throw new Error(`Failed to fetch data for "${ticker}" (HTTP ${res.status})`)

  const json = await res.json()

  // Yahoo returns an error object for invalid tickers
  if (json.chart?.error) {
    throw new Error(`Invalid ticker "${ticker}": ${json.chart.error.description ?? 'symbol not found'}`)
  }
  if (!json.chart?.result?.[0]) {
    throw new Error(`No data found for "${ticker}". Please check the ticker symbol.`)
  }

  const result = json.chart.result[0]
  if (!result.timestamp?.length) {
    throw new Error(`"${ticker}" returned empty data. It may be delisted or not supported.`)
  }

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
