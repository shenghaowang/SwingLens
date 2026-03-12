// Priority order of proxy strategies
async function fetchWithFallback(ticker) {
  const yfUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=5y&interval=1d`

  const strategies = [
    // 1. Cloudflare Worker (set VITE_PROXY_URL in .env.production)
    ...(import.meta.env.VITE_PROXY_URL
      ? [() => fetch(`${import.meta.env.VITE_PROXY_URL}/${ticker}`)]
      : []),

    // 2. allorigins
    () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(yfUrl)}`),

    // 3. corsproxy.io old format
    () => fetch(`https://corsproxy.io/?${encodeURIComponent(yfUrl)}`),
  ]

  let lastErr
  for (const strategy of strategies) {
    try {
      const res = await Promise.race([
        strategy(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ])
      if (!res.ok) continue
      const text = await res.text()
      if (!text || text.trim().startsWith('<')) continue  // got HTML, not JSON
      return JSON.parse(text)
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error(`All data sources failed for "${ticker}". ${lastErr?.message ?? ''}`)
}

export async function fetchStockData(ticker) {
  const json = await fetchWithFallback(ticker)

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
    time:   t,
    open:   quotes.open[i],
    high:   quotes.high[i],
    low:    quotes.low[i],
    close:  quotes.close[i],
    volume: quotes.volume[i],
  })).filter(d => d.close !== null)
}
