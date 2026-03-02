import { useEffect, useRef } from 'react'
import { createChart, CrosshairMode } from 'lightweight-charts'
import { MA_COLORS } from '../utils/indicators'

function makeChart(container, height, hideTimeScale = false) {
  return createChart(container, {
    width: container.clientWidth,
    height,
    layout: { background: { color: '#0f1117' }, textColor: '#94a3b8' },
    grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#334155', autoScale: true },
    timeScale: { borderColor: '#334155', timeVisible: true, visible: !hideTimeScale },
    handleScale: { axisPressedMouseMove: { time: true, price: false } },
  })
}

export default function ChartPanel({ data, indicators, signals, enabledMAs }) {
  const priceRef = useRef(null)
  const macdRef  = useRef(null)
  const rsiRef   = useRef(null)
  const charts   = useRef([])

  useEffect(() => {
    if (!data?.length || !priceRef.current || !macdRef.current || !rsiRef.current) return

    // Destroy previous
    charts.current.forEach(c => { try { c.remove() } catch {} })
    charts.current = []

    // ── Price chart ──
    const price = makeChart(priceRef.current, 400, true)
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
        price.addLineSeries({
          color: MA_COLORS[period], lineWidth: 1, title: `MA${period}`,
          priceLineVisible: false, lastValueVisible: true,
        }).setData(ma.values.map((v, i) => ({ time: data[i + ma.offset].time, value: v })))
      }
    }

    if (signals?.length) {
      candle.setMarkers(signals.map(s => ({
        time: s.time,
        position: s.type === 'BUY' ? 'belowBar' : 'aboveBar',
        color: s.type === 'BUY' ? '#22c55e' : '#ef4444',
        shape: s.type === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: s.type,
      })))
    }

    // ── MACD chart ──
    const macd = makeChart(macdRef.current, 160, true)
    if (indicators?.macdResult) {
      const { macdResult, macdOffset } = indicators
      macd.addLineSeries({ color: '#38bdf8', lineWidth: 1, title: 'MACD' })
        .setData(macdResult.map((v, i) => ({ time: data[i + macdOffset].time, value: v.MACD })))
      macd.addLineSeries({ color: '#f97316', lineWidth: 1, title: 'Signal' })
        .setData(macdResult.map((v, i) => ({ time: data[i + macdOffset].time, value: v.signal })))
      macd.addHistogramSeries({ priceFormat: { type: 'price' } })
        .setData(macdResult.map((v, i) => ({
          time: data[i + macdOffset].time,
          value: v.histogram,
          color: v.histogram >= 0 ? '#22c55e' : '#ef4444',
        })))
    }

    // ── RSI chart ──
    const rsi = makeChart(rsiRef.current, 140, false)
    if (indicators?.rsiResult) {
      const { rsiResult, rsiOffset } = indicators
      const rsiData = rsiResult.map((v, i) => ({ time: data[i + rsiOffset].time, value: v }))
      rsi.addLineSeries({ color: '#c084fc', lineWidth: 1, title: 'RSI' }).setData(rsiData)
      rsi.addLineSeries({ color: '#ef444466', lineWidth: 1, lineStyle: 2 }).setData(rsiData.map(d => ({ time: d.time, value: 70 })))
      rsi.addLineSeries({ color: '#22c55e66', lineWidth: 1, lineStyle: 2 }).setData(rsiData.map(d => ({ time: d.time, value: 30 })))
    }

    const allCharts = [price, macd, rsi]
    charts.current = allCharts

    price.timeScale().fitContent()

    // ── Sync time scales + re-trigger autoScale on zoom/pan ──
    let isSyncing = false
    allCharts.forEach((source, si) => {
      source.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (isSyncing || !range) return
        isSyncing = true
        allCharts.forEach((target, ti) => {
          if (ti !== si) target.timeScale().setVisibleLogicalRange(range)
          // Re-apply autoScale so y-axis refits to visible bars
          target.priceScale('right').applyOptions({ autoScale: true })
        })
        isSyncing = false
      })
    })

    // ── Resize observer (more reliable than window resize) ──
    const ro = new ResizeObserver(() => {
      const w = priceRef.current?.clientWidth
      if (w) allCharts.forEach(c => c.applyOptions({ width: w }))
    })
    ro.observe(priceRef.current)

    return () => {
      ro.disconnect()
      allCharts.forEach(c => { try { c.remove() } catch {} })
      charts.current = []
    }
  }, [data, indicators, signals, enabledMAs])

  return (
    <div className="space-y-0">
      <div ref={priceRef} className="w-full rounded-t-lg overflow-hidden" />
      <div className="px-1 pt-2">
        <div className="text-xs text-gray-500 mb-0.5">MACD (12, 26, 9)</div>
        <div ref={macdRef} className="w-full overflow-hidden" />
      </div>
      <div className="px-1 pt-2">
        <div className="text-xs text-gray-500 mb-0.5">RSI (14)</div>
        <div ref={rsiRef} className="w-full rounded-b-lg overflow-hidden" />
      </div>
    </div>
  )
}
