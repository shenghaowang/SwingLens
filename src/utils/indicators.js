import { MACD, RSI, SMA, ADX } from 'technicalindicators'

export const MA_PERIODS = [5, 10, 20, 30, 60, 120, 250]
export const MA_COLORS = {
  5:   '#facc15',
  10:  '#fb923c',
  20:  '#34d399',
  30:  '#38bdf8',
  60:  '#a78bfa',
  120: '#f472b6',
  250: '#f87171',
}

export function computeIndicators(data) {
  const closes = data.map(d => d.close)
  const highs  = data.map(d => d.high)
  const lows   = data.map(d => d.low)

  const macdResult = MACD.calculate({
    values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
    SimpleMAOscillator: false, SimpleMASignal: false,
  })
  const rsiResult = RSI.calculate({ values: closes, period: 14 })

  const adxResult = ADX.calculate({ close: closes, high: highs, low: lows, period: 14 })

  const mas = {}
  for (const period of MA_PERIODS) {
    if (closes.length >= period) {
      const values = SMA.calculate({ values: closes, period })
      mas[period] = { values, offset: closes.length - values.length }
    }
  }

  const ma50raw  = closes.length >= 50  ? SMA.calculate({ values: closes, period: 50  }) : []
  const ma200raw = closes.length >= 200 ? SMA.calculate({ values: closes, period: 200 }) : []

  const macdOffset = closes.length - macdResult.length
  const rsiOffset  = closes.length - rsiResult.length
  const adxOffset  = closes.length - adxResult.length

  return { macdResult, rsiResult, adxResult, mas, ma50raw, ma200raw, macdOffset, rsiOffset, adxOffset }
}

// ── Historical signal markers ──
export function computeSignals(data, indicators) {
  const { macdResult, rsiResult, adxResult, ma50raw, ma200raw, macdOffset, rsiOffset, adxOffset } = indicators
  const signals = []

  // 1. MACD crossover
  for (let i = 1; i < macdResult.length; i++) {
    const dataIdx = i + macdOffset
    if (dataIdx >= data.length) break
    const prev = macdResult[i - 1]
    const cur  = macdResult[i]
    if (prev.MACD < prev.signal && cur.MACD >= cur.signal)
      signals.push({ time: data[dataIdx].time, type: 'BUY',  source: 'MACD', price: data[dataIdx].close })
    else if (prev.MACD > prev.signal && cur.MACD <= cur.signal)
      signals.push({ time: data[dataIdx].time, type: 'SELL', source: 'MACD', price: data[dataIdx].close })
  }

  // 2. RSI
  for (let i = 1; i < rsiResult.length; i++) {
    const dataIdx = i + rsiOffset
    if (dataIdx >= data.length) break
    if (rsiResult[i - 1] >= 30 && rsiResult[i] < 30)
      signals.push({ time: data[dataIdx].time, type: 'BUY',  source: 'RSI', price: data[dataIdx].close })
    else if (rsiResult[i - 1] <= 70 && rsiResult[i] > 70)
      signals.push({ time: data[dataIdx].time, type: 'SELL', source: 'RSI', price: data[dataIdx].close })
  }

  // 3. Golden / Death Cross (MA50 vs MA200)
  if (ma50raw.length && ma200raw.length) {
    const crossOffset  = data.length - ma200raw.length
    const ma50Aligned  = ma50raw.slice(ma50raw.length - ma200raw.length)
    for (let i = 1; i < ma200raw.length; i++) {
      const dataIdx  = i + crossOffset
      if (dataIdx >= data.length) break
      const prevAbove = ma50Aligned[i - 1] > ma200raw[i - 1]
      const curAbove  = ma50Aligned[i]     > ma200raw[i]
      if (!prevAbove && curAbove)
        signals.push({ time: data[dataIdx].time, type: 'BUY',  source: 'Golden Cross', price: data[dataIdx].close })
      else if (prevAbove && !curAbove)
        signals.push({ time: data[dataIdx].time, type: 'SELL', source: 'Death Cross',  price: data[dataIdx].close })
    }
  }

  // 4. ADX crossover: +DI/-DI cross while ADX > 25
  for (let i = 1; i < adxResult.length; i++) {
    const dataIdx = i + adxOffset
    if (dataIdx >= data.length) break
    const prev = adxResult[i - 1]
    const cur  = adxResult[i]
    if (cur.adx < 25) continue
    const prevUp = prev.pdi > prev.mdi
    const curUp  = cur.pdi  > cur.mdi
    if (!prevUp && curUp)
      signals.push({ time: data[dataIdx].time, type: 'BUY',  source: 'ADX', price: data[dataIdx].close })
    else if (prevUp && !curUp)
      signals.push({ time: data[dataIdx].time, type: 'SELL', source: 'ADX', price: data[dataIdx].close })
  }

  return signals.sort((a, b) => a.time - b.time)
}

// ── Current signal state per indicator ──
export function computeCurrentSignal(data, indicators) {
  const { macdResult, rsiResult, adxResult, ma50raw, ma200raw } = indicators
  const breakdown = {}

  // MACD
  if (macdResult.length >= 1) {
    const cur = macdResult[macdResult.length - 1]
    breakdown.MACD = cur.MACD > cur.signal ? 'BUY' : cur.MACD < cur.signal ? 'SELL' : 'NEUTRAL'
  }

  // RSI
  if (rsiResult.length >= 1) {
    const rsi = rsiResult[rsiResult.length - 1]
    breakdown.RSI = rsi < 30 ? 'BUY' : rsi > 70 ? 'SELL' : 'NEUTRAL'
  }

  // Golden / Death Cross
  if (ma50raw.length && ma200raw.length) {
    const ma50  = ma50raw[ma50raw.length - 1]
    const ma200 = ma200raw[ma200raw.length - 1]
    breakdown['MA Cross'] = ma50 > ma200 ? 'BUY' : ma50 < ma200 ? 'SELL' : 'NEUTRAL'
  }

  // ADX
  if (adxResult.length >= 1) {
    const { adx, pdi, mdi } = adxResult[adxResult.length - 1]
    if (adx > 25)      breakdown.ADX = pdi > mdi ? 'BUY' : 'SELL'
    else if (adx < 20) breakdown.ADX = 'NEUTRAL'   // ranging
    else               breakdown.ADX = 'NEUTRAL'   // weak trend
  }

  // Majority vote
  const counts = { BUY: 0, SELL: 0, NEUTRAL: 0 }
  Object.values(breakdown).forEach(s => counts[s]++)
  const overall = counts.BUY > counts.SELL ? 'BUY'
    : counts.SELL > counts.BUY ? 'SELL' : 'NEUTRAL'

  return { overall, breakdown }
}
