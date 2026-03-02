import { MACD, RSI, SMA } from 'technicalindicators'

export function computeIndicators(data) {
  const closes = data.map(d => d.close)
  const macdResult = MACD.calculate({
    values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
    SimpleMAOscillator: false, SimpleMASignal: false,
  })
  const rsiResult = RSI.calculate({ values: closes, period: 14 })
  const sma50 = SMA.calculate({ values: closes, period: 50 })
  const sma200 = SMA.calculate({ values: closes, period: 200 })
  const macdOffset = closes.length - macdResult.length
  const rsiOffset = closes.length - rsiResult.length
  const sma50Offset = closes.length - sma50.length
  const sma200Offset = closes.length - sma200.length
  return { macdResult, rsiResult, sma50, sma200, macdOffset, rsiOffset, sma50Offset, sma200Offset }
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
    if (macdCrossUp && rsi < 40) {
      signals.push({ time: data[dataIdx].time, type: 'BUY', price: data[dataIdx].close })
    } else if (macdCrossDown && rsi > 60) {
      signals.push({ time: data[dataIdx].time, type: 'SELL', price: data[dataIdx].close })
    }
  }
  return signals
}
