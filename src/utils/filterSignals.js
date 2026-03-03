const RANGE_SECONDS = {
  '1M':  30  * 86400,
  '3M':  90  * 86400,
  '6M':  180 * 86400,
  '1Y':  365 * 86400,
  '3Y':  3 * 365 * 86400,
  '5Y':  5 * 365 * 86400,
}

// Enforce minimum bar spacing between signals of the same type,
// using the avg bar duration estimated from data timestamps.
function applyCooldown(signals, data, cooldownBars = 10) {
  if (!signals.length || !data?.length) return signals

  // Estimate average bar duration (seconds per bar)
  const totalDuration = data[data.length - 1].time - data[0].time
  const secPerBar = totalDuration / (data.length - 1)
  const cooldownSec = cooldownBars * secPerBar

  const result = []
  const lastTime = { BUY: -Infinity, SELL: -Infinity }

  for (const s of signals) {
    if (s.time - lastTime[s.type] >= cooldownSec) {
      result.push(s)
      lastTime[s.type] = s.time
    }
  }
  return result
}

export function filterSignals(signals, { enabledSources, range, maxCount = 5, data, cooldownBars = 10 }) {
  if (!signals?.length) return []

  const latestTime  = data?.[data.length - 1]?.time ?? signals[signals.length - 1]?.time ?? 0
  const windowStart = latestTime - (RANGE_SECONDS[range] ?? RANGE_SECONDS['1Y'])

  const step1 = signals.filter(s => enabledSources.includes(s.source))  // source filter
  const step2 = applyCooldown(step1, data, cooldownBars)                 // cooldown filter
  const step3 = step2.filter(s => s.time >= windowStart)                 // range window filter
  return step3.slice(-maxCount)                                           // last N only
}
