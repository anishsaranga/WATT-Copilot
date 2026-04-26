'use client'

import { Treemap, ResponsiveContainer } from 'recharts'
import { useGridStore } from '@/stores/gridStore'
import { BALANCING_AUTHORITIES } from '@/lib/mock-data/gridGenerator'

function cellColor(ratio: number): string {
  const opacity = 0.12 + ratio * 0.68
  return `rgba(217, 119, 6, ${opacity.toFixed(2)})`
}

function CustomContent(props: any) {
  const { x, y, width, height, name, ratio, size } = props
  if (!width || !height || width < 2 || height < 2) return null

  const showLabel = width > 40 && height > 22
  const showSub = width > 50 && height > 38

  return (
    <g>
      <rect
        x={x + 1} y={y + 1}
        width={width - 2} height={height - 2}
        fill={cellColor(ratio ?? 0.3)}
        stroke="var(--bg-primary)"
        strokeWidth={1.5}
        rx={2}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showSub ? 7 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(width / 4.5, height / 2.5, 12)}
          fill="var(--text-primary)"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="600"
          style={{ pointerEvents: 'none' }}
        >
          {name}
        </text>
      )}
      {showSub && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(width / 7, 9)}
          fill="var(--text-secondary)"
          fontFamily="IBM Plex Mono, monospace"
          style={{ pointerEvents: 'none' }}
        >
          {((size as number) / 1000).toFixed(0)}k MW
        </text>
      )}
    </g>
  )
}

export default function RegionalTreemap() {
  const selectedRegion = useGridStore((s) => s.selectedRegion)
  const setSelectedRegion = useGridStore((s) => s.setSelectedRegion)

  const data = BALANCING_AUTHORITIES.map((ba) => ({
    name: ba.shortName,
    size: ba.currentLoad,
    ratio: ba.currentLoad / ba.capacity,
    id: ba.id,
  }))

  return (
    <div className="w-full h-full" aria-label="Regional load treemap">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          content={<CustomContent />}
          isAnimationActive={false}
        />
      </ResponsiveContainer>
    </div>
  )
}
