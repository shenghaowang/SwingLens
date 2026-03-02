import { computeIndicators, computeCurrentSignal } from './indicators'

export function getLatestSignal(data) {
  if (!data || data.length < 30) return 'NEUTRAL'
  try {
    const ind = computeIndicators(data)
    return computeCurrentSignal(data, ind)
  } catch {
    return 'NEUTRAL'
  }
}
