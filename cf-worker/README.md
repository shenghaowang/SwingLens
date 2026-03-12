# SwingLens CF Worker — Yahoo Finance CORS Proxy

## Deploy (free, 2 minutes)

1. Go to https://workers.cloudflare.com and sign up (free)
2. Click **Create Worker**
3. Replace the default code with the contents of `worker.js`
4. Click **Deploy**
5. Copy your worker URL (e.g. `https://swinglens-proxy.YOUR-NAME.workers.dev`)
6. Set it in `src/utils/fetchStockData.js` as `PROXY_BASE`

## Usage
GET https://your-worker.workers.dev/api/chart/AAPL?range=5y&interval=1d
