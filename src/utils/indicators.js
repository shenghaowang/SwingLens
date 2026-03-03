import { MACD, RSI, SMA, ADX, BollingerBands, OBV } from 'technicalindicators'

export const MA_PERIODS = [5, 10, 20, 30, 60, 120, 250]
export const MA_COLORS = {
  5:   '#facc15', 10:  '#fb923c', 20:  '#34d399',
  30:  '#38bdf8', 60:  '#a78bfa', 120: '#f472b6', 250: '#f87171',
}

// Simple slope: positive or negative direction over last n values
function slope(arr, n = 20) {
  const slice = arr.slice(-n)
  if (slice.length < 2) return 0
  return slice[slice.length - 1] - slice[0]
}

export function computeIndicators(data) {
  const closes = data.map(d => d.close)
  const highs  = data.map(d => d.high)
  const lows   = data.map(d => d.low)
  const volumes = data.map(d => d.volume ?? 0)

  const macdResult = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false })
  const rsiResult  = RSI.calculate({ values: closes, period: 14 })
  const adxResult  = ADX.calculate({ close: closes, high: highs, low: lows, period: 14 })
  const bbResult   = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 })
  const obvResult  = OBV.calculate({ close: closes, volume: volumes })

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
    macdResult, rsiResult, adxResult, bbResult, obvResult, mas, ma50raw, ma200raw,
    macdOffset: closes.length - macdResult.length,
    rsiOffset:  closes.length - rsiResult.length,
    adxOffset:  closes.length - adxResult.length,
    bbOffset:   closes.length - bbResult.length,
    obvOffset:  closes.length - obvResult.length,   // OBV aligns 1:1 with data
  }
}

export function computeSignals(data, indicators) {
  const { macdResult, rsiResult, adxResult, bbResult, obvResult,
          macdOffset, rsiOffset, adxOffset, bbOffset,
          ma50raw, ma200raw } = indicators
  const signals = []
  const DIVERGE_WINDOW = 20  // bars to measure divergence over

  // 1. MACD crossover
  for (let i = 1; i < macdResult.length; i++) {
    const di = i + macdOffset; if (di >= data.length) break
    const p = macdResult[i-1], c = macdResult[i]
    if (p.MACD < p.signal && c.MACD >= c.signal)
      signals.push({ time: data[di].time, type: 'BUY',  source: 'MACD', price: data[di].close })
    else if (p.MACD > p.signal && c.MACD <= c.signal)
      signals.push({ time: data[di].time, type: 'SELL', source: 'MACD', price: data[di].close })
  }

  // 2. RSI
  for (let i = 1; i < rsiResult.length; i++) {
    const di = i + rsiOffset; if (di >= data.length) break
    if (rsiResult[i-1] >= 30 && rsiResult[i] < 30)
      signals.push({ time: data[di].time, type: 'BUY',  source: 'RSI', price: data[di].close })
    else if (rsiResult[i-1] <= 70 && rsiResult[i] > 70)
      signals.push({ time: data[di].time, type: 'SELL', source: 'RSI', price: data[di].close })
  }

  // 3. Golden / Death Cross
  if (ma50raw.length && ma200raw.length) {
    const crossOffset = data.length - ma200raw.length
    const ma50a = ma50raw.slice(ma50raw.length - ma200raw.length)
    for (let i = 1; i < ma200raw.length; i++) {
      const di = i + crossOffset; if (di >= data.length) break
      const prevAbove = ma50a[i-1] > ma200raw[i-1], curAbove = ma50a[i] > ma200raw[i]
      if (!prevAbove && curAbove)
        signals.push({ time: data[di].time, type: 'BUY',  source: 'Golden Cross', price: data[di].close })
      else if (prevAbove && !curAbove)
        signals.push({ time: data[di].time, type: 'SELL', source: 'Death Cross',  price: data[di].close })
    }
  }

  // 4. ADX: +DI/-DI cross with ADX > 25
  for (let i = 1; i < adxResult.length; i++) {
    const di = i + adxOffset; if (di >= data.length) break
    const p = adxResult[i-1], c = adxResult[i]
    if (c.adx < 25) continue
    if (p.pdi <= p.mdi && c.pdi > c.mdi)
      signals.push({ time: data[di].time, type: 'BUY',  source: 'ADX', price: data[di].close })
    else if (p.pdi >= p.mdi && c.pdi < c.mdi)
      signals.push({ time: data[di].time, type: 'SELL', source: 'ADX', price: data[di].close })
  }

  // 5. Bollinger Bands pierce
  for (let i = 1; i < bbResult.length; i++) {
    const di = i + bbOffset; if (di >= data.length) break
    const bb = bbResult[i], bbp = bbResult[i-1], bar = data[di], barp = data[di-1]
    if (barp.low > bbp.lower && bar.low <= bb.lower)
      signals.push({ time: bar.time, type: 'BUY',  source: 'BB', price: bar.close })
    else if (barp.high < bbp.upper && bar.high >= bb.upper)
      signals.push({ time: bar.time, type: 'SELL', source: 'BB', price: bar.close })
  }

  // 6. OBV divergence (rolling DIVERGE_WINDOW bars)
  for (let i = DIVERGE_WINDOW; i < obvResult.length; i++) {
    const di = i   // OBV is 1:1 with data (offset=0 typically)
    if (di >= data.length) break

    const priceSlice = data.slice(di - DIVERGE_WINDOW, di + 1).map(d => d.close)
    const obvSlice   = obvResult.slice(di - DIVERGE_WINDOW, di + 1)

    const priceS = priceSlice[priceSlice.length - 1] - priceSlice[0]
    const obvS   = obvSlice[obvSlice.length - 1]   - obvSlice[0]

    // Only fire on the transition bar (previous bar had no divergence)
    const priceSprev = priceSlice[priceSlice.length - 2] - priceSlice[0]
    const obvSprev   = obvSlice[obvSlice.length - 2]     - obvSlice[0]
    const wasBearDiv = priceSprev > 0 && obvSprev > 0   // no divergence before
    const wasOk      = !(priceSprev > 0 && obvSprev < 0) && !(priceSprev < 0 && obvSprev > 0)

    // Bearish divergence: price rising, OBV falling → SELL
    if (wasOk && priceS > 0 && obvS < 0)
      signals.push({ time: data[di].time, type: 'SELL', source: 'OBV', price: data[di].close })
    // Bullish divergence: price falling, OBV rising → BUY
    else if (wasOk && priceS < 0 && obvS > 0)
      signals.push({ time: data[di].time, type: 'BUY',  source: 'OBV', price: data[di].close })
  }

  return signals.sort((a, b) => a.time - b.time)
}

export function computeCurrentSignal(data, indicators) {
  const { macdResult, rsiResult, adxResult, bbResult, obvResult, ma50raw, ma200raw } = indicators
  const breakdown = {}
  const DIVERGE_WINDOW = 20

  if (macdResult.length) {
    const c = macdResult[macdResult.length - 1]
    breakdown.MACD = c.MACD > c.signal ? 'BUY' : c.MACD < c.signal ? 'SELL' : 'NEUTRAL'
  }

  if (rsiResult.length) {
    const r = rsiResult[rsiResult.length - 1]
    breakdown.RSI = r < 30 ? 'BUY' : r > 70 ? 'SELL' : 'NEUTRAL'
  }

  if (ma50raw.length && ma200raw.length) {
    breakdown['MA Cross'] = ma50raw[ma50raw.length-1] > ma200raw[ma200raw.length-1] ? 'BUY' : 'SELL'
  }

  if (adxResult.length) {
    const { adx, pdi, mdi } = adxResult[adxResult.length - 1]
    breakdown.ADX = adx > 25 ? (pdi > mdi ? 'BUY' : 'SELL') : 'NEUTRAL'
  }

  if (bbResult.length && data.length) {
    const bb = bbResult[bbResult.length - 1], bar = data[data.length - 1]
    breakdown.BB = bar.close <= bb.lower ? 'BUY' : bar.close >= bb.upper ? 'SELL' : 'NEUTRAL'
  }

  if (obvResult.length >= DIVERGE_WINDOW && data.length >= DIVERGE_WINDOW) {
    const priceSlice = data.slice(-DIVERGE_WINDOW).map(d => d.close)
    const obvSlice   = obvResult.slice(-DIVERGE_WINDOW)
    const priceS = priceSlice[priceSlice.length - 1] - priceSlice[0]
    const obvS   = obvSlice[obvSlice.length - 1]     - obvSlice[0]
    breakdown.OBV = (priceS > 0 && obvS < 0) ? 'SELL'
      : (priceS < 0 && obvS > 0) ? 'BUY' : 'NEUTRAL'
  }

  const counts = { BUY: 0, SELL: 0, NEUTRAL: 0 }
  Object.values(breakdown).forEach(s => counts[s]++)
  const overall = counts.BUY > counts.SELL ? 'BUY' : counts.SELL > counts.BUY ? 'SELL' : 'NEUTRAL'
  return { overall, breakdown }
}
