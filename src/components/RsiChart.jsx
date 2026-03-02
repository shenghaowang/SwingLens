import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

export default function RsiChart({ data, indicators }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!indicators?.rsiResult || !containerRef.current) return
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#0f1117' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: true },
      height: 140,
    })
    chartRef.current = chart

    const rsiLine = chart.addLineSeries({ color: '#c084fc', lineWidth: 1, title: 'RSI' })
    const ob = chart.addLineSeries({ color: '#ef444466', lineWidth: 1, lineStyle: 2 })
    const os = chart.addLineSeries({ color: '#22c55e66', lineWidth: 1, lineStyle: 2 })

    const { rsiResult, rsiOffset } = indicators
    const rsiData = rsiResult.map((v, i) => ({ time: data[i + rsiOffset].time, value: v }))
    const obData = rsiData.map(d => ({ time: d.time, value: 70 }))
    const osData = rsiData.map(d => ({ time: d.time, value: 30 }))

    rsiLine.setData(rsiData)
    ob.setData(obData)
    os.setData(osData)
    chart.timeScale().fitContent()

    const handleResize = () => chart.applyOptions({ width: containerRef.current.clientWidth })
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chart.remove() }
  }, [data, indicators])

  return (
    <div>
      <div className="text-xs text-gray-400 mb-1 px-1">RSI (14)</div>
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
    </div>
  )
}
