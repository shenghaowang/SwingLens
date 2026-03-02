export async function loadStocks() {
  const res = await fetch('./stocks.txt')
  const text = await res.text()
  return [...new Set(
    text.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
  )]
}
