const RANGE_SECONDS = {
  '1M':  30  * 86400,
  '3M':  90  * 86400,
  '6M':  180 * 86400,
  '1Y':  365 * 86400,
  '3Y':  3 * 365 * 86400,
  '5Y':  5 * 365 * 86400,
}

export function filterSignals(signals, { enabledSources, range, maxCount = 5 }) {
  if (!signals?.length) return []

  const latestTime = signals[signals.length - 1]?.time ?? 0
  const windowStart = latestTime - (RANGE_SECONDS[range] ?? RANGE_SECONDS['1Y'])

  return signals
    .filter(s => enabledSources.includes(s.source))  // source filter
    .filter(s => s.time >= windowStart)               // range filter
    .slice(-maxCount)                                 // last N only
}
