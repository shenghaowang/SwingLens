import { useEffect, useRef } from 'react'

const NUM_ROWS = 60       // price buckets
const BAR_MAX_WIDTH = 80  // max px width of bars
const POC_COLOR = '#f59e0b'
const BULL_COLOR = '#22c55e'
const BEAR_COLOR = '#ef4444'

export default function VolumeProfile({ data, chartHeight, priceRange }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data?.length || !priceRange) return

    const { min, max } = priceRange
    if (max <= min) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = chartHeight

    canvas.width  = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    // Build volume buckets
    const bucketSize = (max - min) / NUM_ROWS
    const buckets = Array.from({ length: NUM_ROWS }, () => ({ bull: 0, bear: 0 }))

    for (const d of data) {
      if (!d.volume || d.close == null) continue
      const price = (d.high + d.low) / 2
      const idx = Math.min(Math.floor((price - min) / bucketSize), NUM_ROWS - 1)
      if (idx < 0) continue
      if (d.close >= d.open) buckets[idx].bull += d.volume
      else buckets[idx].bear += d.volume
    }

    const maxVol = Math.max(...buckets.map(b => b.bull + b.bear), 1)
    const pocIdx = buckets.reduce((best, b, i) =>
      (b.bull + b.bear) > (buckets[best].bull + buckets[best].bear) ? i : best, 0)

    const rowH = h / NUM_ROWS

    buckets.forEach((b, i) => {
      const total = b.bull + b.bear
      if (total === 0) return
      const barW = (total / maxVol) * BAR_MAX_WIDTH
      const bullW = (b.bull / total) * barW
      const bearW = barW - bullW
      // i=0 is lowest price, draw from bottom
      const y = h - (i + 1) * rowH

      if (i === pocIdx) {
        // POC highlight
        ctx.fillStyle = POC_COLOR + '33'
        ctx.fillRect(0, y, barW, rowH)
        ctx.strokeStyle = POC_COLOR
        ctx.lineWidth = 1
        ctx.strokeRect(0, y, barW, rowH)
      }

      ctx.fillStyle = BULL_COLOR + 'bb'
      ctx.fillRect(0, y + 1, bullW, rowH - 2)
      ctx.fillStyle = BEAR_COLOR + 'bb'
      ctx.fillRect(bullW, y + 1, bearW, rowH - 2)
    })

    // POC label
    const pocPrice = min + (pocIdx + 0.5) * bucketSize
    const pocY = h - (pocIdx + 0.5) * rowH
    ctx.fillStyle = POC_COLOR
    ctx.font = `${Math.max(9, rowH * 0.8)}px monospace`
    ctx.fillText(`POC $${pocPrice.toFixed(0)}`, 2, pocY - 2)

  }, [data, chartHeight, priceRange])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: BAR_MAX_WIDTH,
        height: chartHeight,
        pointerEvents: 'none',
        opacity: 0.85,
      }}
    />
  )
}
