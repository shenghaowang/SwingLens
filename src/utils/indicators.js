import { MACD, RSI, SMA } from 'technicalindicators'

export const MA_PERIODS = [5, 10, 20, 30, 60, 120, 250]
export const MA_COLORS = {
  5:   '#facc15', // yellow
  10:  '#fb923c', // orange
  20:  '#34d399', // green
  30:  '#38bdf8', // sky blue
  60:  '#a78bfa', // purple
  120: '#f472b6', // pink
  250: '#f87171', // red
}

export function computeIndicators(data) {
  const closes = data.map(d => d.close)

  const macdResult = MACD.calculate({
    values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
    SimpleMAOscillator: false, SimpleMASignal: false,
  })
  const rsiResult = RSI.calculate({ values: closes, period: 14 })

  const mas = {}
  for (const period of MA_PERIODS) {
    if (closes.length >= period) {
      const values = SMA.calculate({ values: closes, period })
      mas[period] = { values, offset: closes.length - values.length }
    }
  }

  const macdOffset = closes.length - macdResult.length
  const rsiOffset = closes.length - rsiResult.length

  return { macdResult, rsiResult, mas, macdOffset, rsiOffset }
}

export function computeSignals(data, indicators) {
  const { macdResult, rsiResult, macdOffset, rsiOffset } = indicators
  const signals = []
  for (let i = 1; i < macdResult.length; i++) {
    const dataIdx = i + macdOffset
    if (dataIdx >= data.length) break
    const macdPrev = macdResult[i - 1]
    const macdCur = macdResult[i]
    const rsiIdx = dataIdx - rsiOffset
    if (rsiIdx < 0 || rsiIdx >= rsiResult.length) continue
    const rsi = rsiResult[rsiIdx]
    const macdCrossUp = macdPrev.MACD < macdPrev.signal && macdCur.MACD >= macdCur.signal
    const macdCrossDown = macdPrev.MACD > macdPrev.signal && macdCur.MACD <= macdCur.signal
    if (macdCrossUp && rsi < 40) signals.push({ time: data[dataIdx].time, type: 'BUY', price: data[dataIdx].close })
    else if (macdCrossDown && rsi > 60) signals.push({ time: data[dataIdx].time, type: 'SELL', price: data[dataIdx].close })
  }
  return signals
}

// ── Current signal as of today ──
export function computeCurrentSignal(data, indicators) {
  const { macdResult, rsiResult } = indicators
  if (!macdResult.length || !rsiResult.length) return 'NEUTRAL'

  const latestMacd = macdResult[macdResult.length - 1]
  const latestRsi  = rsiResult[rsiResult.length - 1]

  const macdBullish = latestMacd.MACD > latestMacd.signal
  const macdBearish = latestMacd.MACD < latestMacd.signal

  if (macdBullish && latestRsi < 40) return 'BUY'
  if (macdBearish && latestRsi > 60) return 'SELL'
  return 'NEUTRAL'
}
