const RANGE_SECONDS = {
  '1M':  30  * 86400,
  '3M':  90  * 86400,
  '6M':  180 * 86400,
  '1Y':  365 * 86400,
  '3Y':  3 * 365 * 86400,
  '5Y':  5 * 365 * 86400,
}

function applyCooldown(signals, data, cooldownBars = 10) {
  if (!signals.length || !data?.length) return signals
  const secPerBar = (data[data.length - 1].time - data[0].time) / (data.length - 1)
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

  // Standard pipeline
  const step1 = signals.filter(s => enabledSources.includes(s.source))
  const step2 = applyCooldown(step1, data, cooldownBars)
  const step3 = step2.filter(s => s.time >= windowStart)
  let result  = step3.slice(-maxCount)

  // ── Priority: always include signals on the most recent bar ──
  // Find any signals from the latest data point that passed source + range filters
  // but may have been dropped by cooldown or maxCount
  const latestBarSignals = step1
    .filter(s => s.time === latestTime && s.time >= windowStart)

  for (const latest of latestBarSignals) {
    const alreadyIncluded = result.some(s => s.time === latest.time && s.source === latest.source)
    if (!alreadyIncluded) {
      // Insert and trim oldest to maintain maxCount
      result = [...result, latest]
        .sort((a, b) => a.time - b.time)
        .slice(-maxCount)
    }
  }

  return result
}
