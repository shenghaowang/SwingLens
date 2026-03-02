const RANGE_MAP = {
  '1M': '1mo',
  '3M': '3mo',
  '6M': '6mo',
  '1Y': '1y',
  '3Y': '3y',
  '5Y': '5y',
}

export async function fetchStockData(ticker, range = '1Y') {
  const yfRange = RANGE_MAP[range] || '1y'
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${yfRange}&interval=1d`
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
