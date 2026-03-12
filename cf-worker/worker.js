/**
 * SwingLens Yahoo Finance CORS Proxy
 * Deploy to Cloudflare Workers (free tier)
 * Routes: /api/chart/:ticker?range=5y&interval=1d
 */
export default {
  async fetch(request) {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    // Only allow /api/chart/:ticker
    const match = url.pathname.match(/^\/api\/chart\/([A-Z0-9.\-^]+)$/i)
    if (!match) {
      return new Response('Not found', { status: 404, headers: corsHeaders() })
    }

    const ticker = match[1].toUpperCase()
    const range    = url.searchParams.get('range')    || '5y'
    const interval = url.searchParams.get('interval') || '1d'

    const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`

    try {
      const resp = await fetch(yfUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      })
      const data = await resp.text()
      return new Response(data, {
        status: resp.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
