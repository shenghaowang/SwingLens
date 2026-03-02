import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function MacdChart({ data, indicators }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!indicators?.macdResult || !containerRef.current) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#0f1117' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: true },
      height: 160,
    })
    chartRef.current = chart

    const macdLine = chart.addLineSeries({ color: '#38bdf8', lineWidth: 1, title: 'MACD' })
    const signalLine = chart.addLineSeries({ color: '#f97316', lineWidth: 1, title: 'Signal' })
    const histSeries = chart.addHistogramSeries({ priceFormat: { type: 'price' } })

    const { macdResult, macdOffset } = indicators
    macdLine.setData(macdResult.map((v, i) => ({ time: data[i + macdOffset].time, value: v.MACD })))
    signalLine.setData(macdResult.map((v, i) => ({ time: data[i + macdOffset].time, value: v.signal })))
    histSeries.setData(macdResult.map((v, i) => ({
      time: data[i + macdOffset].time,
      value: v.histogram,
      color: v.histogram >= 0 ? '#22c55e' : '#ef4444',
    })))

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (chartRef.current) chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [data, indicators])

  return (
    <div>
      <div className="text-xs text-gray-400 mb-1 px-1">MACD (12, 26, 9)</div>
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
    </div>
  )
}
