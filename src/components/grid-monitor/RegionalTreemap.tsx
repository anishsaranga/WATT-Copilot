'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import * as d3 from 'd3'
import { motion } from 'motion/react'
import { useGridStore } from '@/stores/gridStore'
import { BALANCING_AUTHORITIES } from '@/lib/mock-data/gridGenerator'

export default function RegionalTreemap() {
  const selectedRegion = useGridStore((s) => s.selectedRegion)
  const setSelectedRegion = useGridStore((s) => s.setSelectedRegion)

  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 400, h: 180 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setDims({ w: Math.floor(width), h: Math.floor(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const colorScale = useMemo(() =>
    d3.scaleSequential(d3.interpolateRgb('#1A2233', '#00A8C8')).domain([0, 1]),
    []
  )

  const leaves = useMemo(() => {
    const { w, h } = dims
    if (w < 10 || h < 10) return []

    const data = {
      name: 'root',
      children: BALANCING_AUTHORITIES.map((ba) => ({
        ...ba,
        value: ba.currentLoad,
        ratio: ba.currentLoad / ba.capacity,
      })),
    }
    const root = d3.hierarchy(data).sum((d: any) => d.value ?? 0)
    d3.treemap<typeof data>()
      .size([w, h])
      .paddingInner(3)
      .paddingOuter(2)
      (root)
    return root.leaves()
  }, [dims])

  return (
    <div ref={containerRef} className="w-full h-full" aria-label="Regional load treemap">
      <svg width={dims.w} height={dims.h} style={{ display: 'block' }}>
        {leaves.map((leaf) => {
          const d = leaf.data as any
          const x0 = (leaf as any).x0
          const y0 = (leaf as any).y0
          const x1 = (leaf as any).x1
          const y1 = (leaf as any).y1
          const w = x1 - x0
          const h = y1 - y0
          if (w <= 0 || h <= 0) return null

          const isSelected = selectedRegion === d.id
          const color = colorScale(d.ratio ?? 0)

          return (
            <motion.g
              key={d.id}
              whileHover={{ opacity: 0.85 }}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedRegion(isSelected ? null : d.id)}
              role="button"
              aria-label={`${d.name}: ${Math.round(d.currentLoad).toLocaleString()} MW`}
            >
              <rect
                x={x0} y={y0} width={w} height={h}
                fill={color}
                stroke={isSelected ? '#00F0FF' : 'rgba(10,14,23,0.6)'}
                strokeWidth={isSelected ? 1.5 : 1}
                rx={2}
              />
              {w > 40 && h > 22 && (
                <text
                  x={x0 + w / 2} y={y0 + h / 2 - (h > 36 ? 7 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(w / 4.5, h / 2.5, 13)}
                  fill="rgba(255,255,255,0.92)"
                  fontFamily="JetBrains Mono"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {d.shortName}
                </text>
              )}
              {w > 40 && h > 36 && (
                <text
                  x={x0 + w / 2} y={y0 + h / 2 + 9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(w / 7, h / 4, 10)}
                  fill="rgba(255,255,255,0.5)"
                  fontFamily="JetBrains Mono"
                  style={{ pointerEvents: 'none' }}
                >
                  {(d.currentLoad / 1000).toFixed(0)}k MW
                </text>
              )}
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
