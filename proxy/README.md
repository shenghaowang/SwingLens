# SwingLens CORS Proxy (Cloudflare Worker)

Because GitHub Pages is a static host, we need a CORS-enabled proxy to fetch
Yahoo Finance data from the browser.

## Deploy in 3 minutes (free)

1. Sign up at https://cloudflare.com (free account)
2. Go to **Workers & Pages → Create Worker**
3. Paste the contents of `worker.js` into the editor
4. Click **Deploy**
5. Copy your worker URL (e.g. `https://swinglens-proxy.yourname.workers.dev`)
6. Update `VITE_PROXY_URL` in `.env.production`:
   ```
   VITE_PROXY_URL=https://swinglens-proxy.yourname.workers.dev
   ```
7. Rebuild and push: `npm run build && git push origin master`

## Free tier limits
- 100,000 requests / day
- 10ms CPU time / request
- Global edge deployment

## Usage
The worker accepts: `GET https://your-worker.workers.dev/AAPL`
and proxies to Yahoo Finance with CORS headers added.
