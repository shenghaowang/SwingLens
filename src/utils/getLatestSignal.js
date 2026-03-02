import { computeIndicators, computeSignals } from './indicators'

export function getLatestSignal(data) {
  if (!data || data.length < 30) return 'NEUTRAL'
  try {
    const ind = computeIndicators(data)
    const signals = computeSignals(data, ind)
    if (!signals.length) return 'NEUTRAL'
    return signals[signals.length - 1].type
  } catch {
    return 'NEUTRAL'
  }
}
