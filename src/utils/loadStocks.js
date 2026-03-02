// Returns [{ theme: 'Hyperscalers', tickers: ['MSFT', ...] }, ...]
export async function loadStocks() {
  const res = await fetch('./stocks.txt')
  const text = await res.text()

  const groups = []
  let current = null

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const themeMatch = line.match(/^\[(.+)\]$/)
    if (themeMatch) {
      current = { theme: themeMatch[1], tickers: [] }
      groups.push(current)
    } else if (current) {
      current.tickers.push(line)
    }
  }

  return groups
}
