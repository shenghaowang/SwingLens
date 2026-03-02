import { useEffect, useRef } from 'react'
import { createChart, CrosshairMode } from 'lightweight-charts'
import { MA_COLORS } from '../utils/indicators'

export default function PriceChart({ data, indicators, signals, enabledMAs }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return

    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#0f1117' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: true },
      height: 420,
    })
    chartRef.current = chart

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    candleSeries.setData(data.map(d => ({
      time: d.time, open: d.open, high: d.high, low: d.low, close: d.close,
    })))

    // MA lines
    if (indicators?.mas) {
      for (const period of (enabledMAs || [])) {
        const ma = indicators.mas[period]
        if (!ma) continue
        const maSeries = chart.addLineSeries({
          color: MA_COLORS[period],
          lineWidth: 1,
          title: `MA${period}`,
          priceLineVisible: false,
          lastValueVisible: true,
        })
        maSeries.setData(ma.values.map((v, i) => ({ time: data[i + ma.offset].time, value: v })))
      }
    }

    // Buy/Sell markers
    if (signals?.length > 0) {
      candleSeries.setMarkers(signals.map(s => ({
        time: s.time,
        position: s.type === 'BUY' ? 'belowBar' : 'aboveBar',
        color: s.type === 'BUY' ? '#22c55e' : '#ef4444',
        shape: s.type === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: s.type,
      })))
    }

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (chartRef.current) chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }
    }
  }, [data, indicators, signals, enabledMAs])

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
}
