/**
 * SwingLens CORS Proxy - Cloudflare Worker
 * Proxies Yahoo Finance requests and adds CORS headers.
 * Deploy at: https://dash.cloudflare.com/workers
 * Free tier: 100,000 requests/day
 */

const ALLOWED_ORIGIN = '*'  // or restrict to 'https://shenghaowang.github.io'

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const url = new URL(request.url)
    const ticker = url.pathname.replace(/^\//, '').toUpperCase()

    if (!ticker || !/^[A-Z0-9.\-^]+$/.test(ticker)) {
      return new Response(JSON.stringify({ error: 'Invalid ticker' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
      })
    }

    const yfUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=5y&interval=1d`

    try {
      const res = await fetch(yfUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com',
        },
      })

      const data = await res.text()

      return new Response(data, {
        status: res.status,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Cache-Control': 'public, max-age=3600',  // cache 1h at edge
        },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
      })
    }
  },
}
