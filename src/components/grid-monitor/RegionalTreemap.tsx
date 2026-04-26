'use client'

import { useMemo } from 'react'
import * as d3 from 'd3'
import { motion } from 'motion/react'
import { useGridStore } from '@/stores/gridStore'
import { BALANCING_AUTHORITIES } from '@/lib/mock-data/gridGenerator'

export default function RegionalTreemap() {
  const selectedRegion = useGridStore((s) => s.selectedRegion)
  const setSelectedRegion = useGridStore((s) => s.setSelectedRegion)

  const colorScale = useMemo(() =>
    d3.scaleSequential(d3.interpolateRgb('#1A2233', '#00F0FF')).domain([0, 1]),
    []
  )

  const treemapData = useMemo(() => {
    const data = {
      name: 'root',
      children: BALANCING_AUTHORITIES.map((ba) => ({
        ...ba,
        value: ba.currentLoad,
        ratio: ba.currentLoad / ba.capacity,
      })),
    }
    const root = d3.hierarchy(data).sum((d: any) => d.value ?? 0)
    d3.treemap<typeof data>().size([100, 100]).padding(1)(root)
    return root.leaves()
  }, [])

  return (
    <div className="w-full h-full relative" aria-label="Regional load treemap">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        {treemapData.map((leaf) => {
          const d = leaf.data as any
          const isSelected = selectedRegion === d.id
          const ratio = d.ratio ?? 0
          const color = colorScale(ratio)
          const w = (leaf as any).x1 - (leaf as any).x0
          const h = (leaf as any).y1 - (leaf as any).y0

          return (
            <g key={d.id}>
              <motion.rect
                x={(leaf as any).x0}
                y={(leaf as any).y0}
                width={w}
                height={h}
                fill={color}
                stroke={isSelected ? '#00F0FF' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isSelected ? 0.5 : 0.3}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedRegion(isSelected ? null : d.id)}
                whileHover={{ opacity: 0.85 }}
                role="button"
                aria-label={`${d.name}: ${Math.round(d.currentLoad).toLocaleString()} MW`}
              />
              {w > 12 && h > 8 && (
                <>
                  <text
                    x={(leaf as any).x0 + w / 2}
                    y={(leaf as any).y0 + h / 2 - 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.min(w / 5, h / 3, 4)}
                    fill="rgba(255,255,255,0.9)"
                    fontFamily="JetBrains Mono"
                    fontWeight="600"
                    style={{ pointerEvents: 'none' }}
                  >
                    {d.shortName}
                  </text>
                  {h > 12 && (
                    <text
                      x={(leaf as any).x0 + w / 2}
                      y={(leaf as any).y0 + h / 2 + 3.5}
                      textAnchor="middle"
                      fontSize={Math.min(w / 7, 3)}
                      fill="rgba(255,255,255,0.5)"
                      fontFamily="JetBrains Mono"
                      style={{ pointerEvents: 'none' }}
                    >
                      {(d.currentLoad / 1000).toFixed(0)}k MW
                    </text>
                  )}
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
