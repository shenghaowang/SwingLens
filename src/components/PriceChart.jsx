import { useEffect, useRef } from 'react'
import { createChart, CrosshairMode } from 'lightweight-charts'

export default function PriceChart({ data, indicators, signals }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#0f1117' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: true },
      height: 380,
    })
    chartRef.current = chart

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    const candleData = data.map(d => ({
      time: d.time,
      open: d.open, high: d.high, low: d.low, close: d.close,
    }))
    candleSeries.setData(candleData)

    // SMA 50
    if (indicators?.sma50) {
      const sma50Series = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, title: 'SMA50' })
      sma50Series.setData(
        indicators.sma50.map((v, i) => ({ time: data[i + indicators.sma50Offset].time, value: v }))
      )
    }

    // SMA 200
    if (indicators?.sma200) {
      const sma200Series = chart.addLineSeries({ color: '#a855f7', lineWidth: 1, title: 'SMA200' })
      sma200Series.setData(
        indicators.sma200.map((v, i) => ({ time: data[i + indicators.sma200Offset].time, value: v }))
      )
    }

    // Buy/Sell markers
    if (signals && signals.length > 0) {
      const markers = signals.map(s => ({
        time: s.time,
        position: s.type === 'BUY' ? 'belowBar' : 'aboveBar',
        color: s.type === 'BUY' ? '#22c55e' : '#ef4444',
        shape: s.type === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: s.type,
      }))
      candleSeries.setMarkers(markers)
    }

    chart.timeScale().fitContent()

    const handleResize = () => chart.applyOptions({ width: containerRef.current.clientWidth })
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chart.remove() }
  }, [data, indicators, signals])

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
}
