import { MACD, RSI, SMA, ADX, BollingerBands } from 'technicalindicators'

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
  const bbResult  = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 })

  const mas = {}
  for (const period of MA_PERIODS) {
    if (closes.length >= period) {
      const values = SMA.calculate({ values: closes, period })
      mas[period] = { values, offset: closes.length - values.length }
    }
  }

  const ma50raw  = closes.length >= 50  ? SMA.calculate({ values: closes, period: 50  }) : []
  const ma200raw = closes.length >= 200 ? SMA.calculate({ values: closes, period: 200 }) : []

  return {
    macdResult, rsiResult, adxResult, bbResult, mas, ma50raw, ma200raw,
    macdOffset: closes.length - macdResult.length,
    rsiOffset:  closes.length - rsiResult.length,
    adxOffset:  closes.length - adxResult.length,
    bbOffset:   closes.length - bbResult.length,
  }
}

export function computeSignals(data, indicators) {
  const { macdResult, rsiResult, adxResult, bbResult,
          macdOffset, rsiOffset, adxOffset, bbOffset,
          ma50raw, ma200raw } = indicators
  const signals = []

  // 1. MACD crossover
  for (let i = 1; i < macdResult.length; i++) {
    const di = i + macdOffset
    if (di >= data.length) break
    const p = macdResult[i - 1], c = macdResult[i]
    if (p.MACD < p.signal && c.MACD >= c.signal)
      signals.push({ time: data[di].time, type: 'BUY',  source: 'MACD', price: data[di].close })
    else if (p.MACD > p.signal && c.MACD <= c.signal)
      signals.push({ time: data[di].time, type: 'SELL', source: 'MACD', price: data[di].close })
  }

  // 2. RSI
  for (let i = 1; i < rsiResult.length; i++) {
    const di = i + rsiOffset
    if (di >= data.length) break
    if (rsiResult[i - 1] >= 30 && rsiResult[i] < 30)
      signals.push({ time: data[di].time, type: 'BUY',  source: 'RSI', price: data[di].close })
    else if (rsiResult[i - 1] <= 70 && rsiResult[i] > 70)
      signals.push({ time: data[di].time, type: 'SELL', source: 'RSI', price: data[di].close })
  }

  // 3. Golden / Death Cross
  if (ma50raw.length && ma200raw.length) {
    const crossOffset = data.length - ma200raw.length
    const ma50a = ma50raw.slice(ma50raw.length - ma200raw.length)
    for (let i = 1; i < ma200raw.length; i++) {
      const di = i + crossOffset
      if (di >= data.length) break
      const prevAbove = ma50a[i - 1] > ma200raw[i - 1]
      const curAbove  = ma50a[i]     > ma200raw[i]
      if (!prevAbove && curAbove)
        signals.push({ time: data[di].time, type: 'BUY',  source: 'Golden Cross', price: data[di].close })
      else if (prevAbove && !curAbove)
        signals.push({ time: data[di].time, type: 'SELL', source: 'Death Cross',  price: data[di].close })
    }
  }

  // 4. ADX: +DI/-DI cross with ADX > 25
  for (let i = 1; i < adxResult.length; i++) {
    const di = i + adxOffset
    if (di >= data.length) break
    const p = adxResult[i - 1], c = adxResult[i]
    if (c.adx < 25) continue
    if (p.pdi <= p.mdi && c.pdi > c.mdi)
      signals.push({ time: data[di].time, type: 'BUY',  source: 'ADX', price: data[di].close })
    else if (p.pdi >= p.mdi && c.pdi < c.mdi)
      signals.push({ time: data[di].time, type: 'SELL', source: 'ADX', price: data[di].close })
  }

  // 5. Bollinger Bands: price pierces lower (BUY) or upper (SELL)
  for (let i = 1; i < bbResult.length; i++) {
    const di = i + bbOffset
    if (di >= data.length) break
    const bb   = bbResult[i]
    const bbp  = bbResult[i - 1]
    const bar  = data[di]
    const barp = data[di - 1]
    // Enter lower band: low crosses below lower band
    if (barp.low > bbp.lower && bar.low <= bb.lower)
      signals.push({ time: bar.time, type: 'BUY',  source: 'BB', price: bar.close })
    // Enter upper band: high crosses above upper band
    else if (barp.high < bbp.upper && bar.high >= bb.upper)
      signals.push({ time: bar.time, type: 'SELL', source: 'BB', price: bar.close })
  }

  return signals.sort((a, b) => a.time - b.time)
}

export function computeCurrentSignal(data, indicators) {
  const { macdResult, rsiResult, adxResult, bbResult, ma50raw, ma200raw } = indicators
  const breakdown = {}

  if (macdResult.length) {
    const c = macdResult[macdResult.length - 1]
    breakdown.MACD = c.MACD > c.signal ? 'BUY' : c.MACD < c.signal ? 'SELL' : 'NEUTRAL'
  }

  if (rsiResult.length) {
    const r = rsiResult[rsiResult.length - 1]
    breakdown.RSI = r < 30 ? 'BUY' : r > 70 ? 'SELL' : 'NEUTRAL'
  }

  if (ma50raw.length && ma200raw.length) {
    const ma50  = ma50raw[ma50raw.length - 1]
    const ma200 = ma200raw[ma200raw.length - 1]
    breakdown['MA Cross'] = ma50 > ma200 ? 'BUY' : ma50 < ma200 ? 'SELL' : 'NEUTRAL'
  }

  if (adxResult.length) {
    const { adx, pdi, mdi } = adxResult[adxResult.length - 1]
    breakdown.ADX = adx > 25 ? (pdi > mdi ? 'BUY' : 'SELL') : 'NEUTRAL'
  }

  if (bbResult.length && data.length) {
    const bb  = bbResult[bbResult.length - 1]
    const bar = data[data.length - 1]
    breakdown.BB = bar.close <= bb.lower ? 'BUY'
      : bar.close >= bb.upper ? 'SELL' : 'NEUTRAL'
  }

  const counts = { BUY: 0, SELL: 0, NEUTRAL: 0 }
  Object.values(breakdown).forEach(s => counts[s]++)
  const overall = counts.BUY > counts.SELL ? 'BUY'
    : counts.SELL > counts.BUY ? 'SELL' : 'NEUTRAL'

  return { overall, breakdown }
}
