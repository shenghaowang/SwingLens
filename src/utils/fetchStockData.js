// ── Proxy Configuration ──────────────────────────────────────────────────────
// corsproxy.io stopped working in March 2026.
// Deploy the Cloudflare Worker in /cf-worker/worker.js (free, 2 min setup)
// Then replace the URL below with your worker URL.
const PROXY_BASE = import.meta.env.VITE_PROXY_BASE || ''

function buildUrl(ticker) {
  if (PROXY_BASE) {
    // Cloudflare Worker proxy
    return `${PROXY_BASE}/api/chart/${ticker}?range=5y&interval=1d`
  }
  // Direct Yahoo Finance — works locally, blocked by CORS in browser
  return `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5y&interval=1d`
}

export async function fetchStockData(ticker) {
  if (!PROXY_BASE) {
    throw new Error(
      `Data proxy not configured. Please deploy the Cloudflare Worker (see /cf-worker/README.md) and set VITE_PROXY_BASE in your GitHub repository secrets.`
    )
  }

  let res
  try {
    res = await fetch(buildUrl(ticker))
  } catch {
    throw new Error(`Network error — unable to reach data provider. Check your connection.`)
  }

  if (!res.ok) throw new Error(`Failed to fetch "${ticker}" (HTTP ${res.status})`)

  const json = await res.json()

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
