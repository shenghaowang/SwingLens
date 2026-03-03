import { useEffect, useRef, useState } from 'react'
import { createChart, CrosshairMode } from 'lightweight-charts'
import { MA_COLORS } from '../utils/indicators'
import VolumeProfile from './VolumeProfile'

const PRICE_CHART_HEIGHT = 400

const RANGE_SECONDS = {
  '1M':  30  * 86400,
  '3M':  90  * 86400,
  '6M':  180 * 86400,
  '1Y':  365 * 86400,
  '3Y':  3 * 365 * 86400,
  '5Y':  5 * 365 * 86400,
}

function makeChart(container, height, hideTimeScale = false) {
  return createChart(container, {
    width: container.clientWidth,
    height,
    layout: { background: { color: '#0f1117' }, textColor: '#94a3b8' },
    grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#334155', autoScale: true },
    timeScale: { borderColor: '#334155', timeVisible: true, visible: !hideTimeScale },
  })
}

function setVisibleRange(charts, data, range) {
  const to   = data[data.length - 1].time
  const from = to - (RANGE_SECONDS[range] ?? RANGE_SECONDS['1Y'])
  charts.forEach(c => { try { c.timeScale().setVisibleRange({ from, to }) } catch {} })
}

export default function ChartPanel({ data, indicators, signals, enabledMAs, range }) {
  const priceRef = useRef(null)
  const volRef   = useRef(null)
  const macdRef  = useRef(null)
  const rsiRef   = useRef(null)
  const adxRef   = useRef(null)
  const chartsRef = useRef([])
  const [visibleData, setVisibleData] = useState(null)

  const hasVolume = data?.some(d => d.volume != null && d.volume > 0)
  const priceRange = visibleData?.length
    ? { min: Math.min(...visibleData.map(d => d.low).filter(Boolean)),
        max: Math.max(...visibleData.map(d => d.high).filter(Boolean)) }
    : null

  useEffect(() => {
    if (!data?.length || !priceRef.current || !macdRef.current || !rsiRef.current || !adxRef.current) return

    chartsRef.current.forEach(c => { try { c.remove() } catch {} })
    chartsRef.current = []

    // ── Price ──
    const price = makeChart(priceRef.current, PRICE_CHART_HEIGHT, true)
    const candle = price.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    candle.setData(data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })))

    if (indicators?.mas) {
      for (const period of (enabledMAs || [])) {
        const ma = indicators.mas[period]
        if (!ma) continue
        price.addLineSeries({ color: MA_COLORS[period], lineWidth: 1, title: `MA${period}`, priceLineVisible: false })
          .setData(ma.values.map((v, i) => ({ time: data[i + ma.offset].time, value: v })))
      }
    }

    if (signals?.length) {
      candle.setMarkers(signals.map(s => ({
        time: s.time,
        position: s.type === 'BUY' ? 'belowBar' : 'aboveBar',
        color: s.type === 'BUY' ? '#22c55e' : '#ef4444',
        shape: s.type === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: s.source,
      })))
    }

    const allCharts = [price]

    // ── Volume ──
    if (hasVolume && volRef.current) {
      const vol = makeChart(volRef.current, 100, true)
      const volSeries = vol.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'volume' })
      vol.priceScale('volume').applyOptions({ scaleMargins: { top: 0.1, bottom: 0 } })
      volSeries.setData(data.map(d => ({
        time: d.time, value: d.volume,
        color: d.close >= d.open ? '#22c55e' : '#ef4444',
      })))
      allCharts.push(vol)
    }

    // ── MACD ──
    const macd = makeChart(macdRef.current, 140, true)
    if (indicators?.macdResult) {
      const { macdResult, macdOffset } = indicators
      macd.addLineSeries({ color: '#38bdf8', lineWidth: 1, title: 'MACD' })
        .setData(macdResult.map((v, i) => ({ time: data[i + macdOffset].time, value: v.MACD })))
      macd.addLineSeries({ color: '#f97316', lineWidth: 1, title: 'Signal' })
        .setData(macdResult.map((v, i) => ({ time: data[i + macdOffset].time, value: v.signal })))
      macd.addHistogramSeries().setData(macdResult.map((v, i) => ({
        time: data[i + macdOffset].time, value: v.histogram,
        color: v.histogram >= 0 ? '#22c55e' : '#ef4444',
      })))
    }
    allCharts.push(macd)

    // ── RSI ──
    const rsi = makeChart(rsiRef.current, 120, true)
    if (indicators?.rsiResult) {
      const { rsiResult, rsiOffset } = indicators
      const rsiData = rsiResult.map((v, i) => ({ time: data[i + rsiOffset].time, value: v }))
      rsi.addLineSeries({ color: '#c084fc', lineWidth: 1, title: 'RSI' }).setData(rsiData)
      rsi.addLineSeries({ color: '#ef444466', lineWidth: 1, lineStyle: 2 }).setData(rsiData.map(d => ({ time: d.time, value: 70 })))
      rsi.addLineSeries({ color: '#22c55e66', lineWidth: 1, lineStyle: 2 }).setData(rsiData.map(d => ({ time: d.time, value: 30 })))
    }
    allCharts.push(rsi)

    // ── ADX ──
    const adx = makeChart(adxRef.current, 120, false)
    if (indicators?.adxResult) {
      const { adxResult, adxOffset } = indicators
      // ADX line
      adx.addLineSeries({ color: '#fbbf24', lineWidth: 2, title: 'ADX' })
        .setData(adxResult.map((v, i) => ({ time: data[i + adxOffset].time, value: v.adx })))
      // +DI
      adx.addLineSeries({ color: '#22c55e', lineWidth: 1, title: '+DI' })
        .setData(adxResult.map((v, i) => ({ time: data[i + adxOffset].time, value: v.pdi })))
      // -DI
      adx.addLineSeries({ color: '#ef4444', lineWidth: 1, title: '-DI' })
        .setData(adxResult.map((v, i) => ({ time: data[i + adxOffset].time, value: v.mdi })))
      // Threshold lines
      adx.addLineSeries({ color: '#ffffff33', lineWidth: 1, lineStyle: 2 })
        .setData(adxResult.map((v, i) => ({ time: data[i + adxOffset].time, value: 25 })))
      adx.addLineSeries({ color: '#ffffff1a', lineWidth: 1, lineStyle: 2 })
        .setData(adxResult.map((v, i) => ({ time: data[i + adxOffset].time, value: 20 })))
    }
    allCharts.push(adx)

    chartsRef.current = allCharts
    setVisibleRange(allCharts, data, range)

    // Track visible data for volume profile
    const updateVisibleData = () => {
      try {
        const lr = price.timeScale().getVisibleLogicalRange()
        if (!lr) return
        setVisibleData(data.slice(Math.max(0, Math.floor(lr.from)), Math.min(data.length - 1, Math.ceil(lr.to)) + 1))
      } catch {}
    }
    price.timeScale().subscribeVisibleLogicalRangeChange(updateVisibleData)
    updateVisibleData()

    // Sync all
    let isSyncing = false
    allCharts.forEach((source, si) => {
      source.timeScale().subscribeVisibleLogicalRangeChange(lr => {
        if (isSyncing || !lr) return
        isSyncing = true
        allCharts.forEach((target, ti) => {
          if (ti !== si) target.timeScale().setVisibleLogicalRange(lr)
          target.priceScale('right').applyOptions({ autoScale: true })
        })
        isSyncing = false
      })
    })

    const ro = new ResizeObserver(() => {
      const w = priceRef.current?.clientWidth
      if (w) allCharts.forEach(c => { try { c.applyOptions({ width: w }) } catch {} })
    })
    ro.observe(priceRef.current)

    return () => {
      ro.disconnect()
      allCharts.forEach(c => { try { c.remove() } catch {} })
      chartsRef.current = []
    }
  }, [data, indicators, signals, enabledMAs])

  useEffect(() => {
    if (chartsRef.current.length && data?.length) {
      setVisibleRange(chartsRef.current, data, range)
      chartsRef.current.forEach(c => c.priceScale('right').applyOptions({ autoScale: true }))
    }
  }, [range, data])

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <div ref={priceRef} className="w-full overflow-hidden" />
        {hasVolume && priceRange && (
          <VolumeProfile data={visibleData || data} chartHeight={PRICE_CHART_HEIGHT} priceRange={priceRange} />
        )}
      </div>
      {hasVolume && (
        <div className="pt-1">
          <div className="text-xs text-gray-500 mb-0.5">Volume</div>
          <div ref={volRef} className="w-full overflow-hidden" />
        </div>
      )}
      <div className="pt-2">
        <div className="text-xs text-gray-500 mb-0.5">MACD (12, 26, 9)</div>
        <div ref={macdRef} className="w-full overflow-hidden" />
      </div>
      <div className="pt-2">
        <div className="text-xs text-gray-500 mb-0.5">RSI (14)</div>
        <div ref={rsiRef} className="w-full overflow-hidden" />
      </div>
      <div className="pt-2">
        <div className="text-xs text-gray-500 mb-0.5">
          ADX (14) — <span className="text-yellow-400">ADX</span> · <span className="text-green-400">+DI</span> · <span className="text-red-400">-DI</span> · dashed lines at 20 / 25
        </div>
        <div ref={adxRef} className="w-full overflow-hidden" />
      </div>
    </div>
  )
}
