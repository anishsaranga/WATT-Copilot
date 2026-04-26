'use client'

import { useMemo } from 'react'
import { MOCK_WEATHER_CELLS } from '@/lib/mock-data/gridGenerator'

// Simplified US projection: lat/lon to SVG x/y
// Approximate: lon -130 to -65, lat 24 to 50
function project(lat: number, lon: number, w: number, h: number) {
  const x = ((lon - (-130)) / (65)) * w
  const y = ((50 - lat) / (26)) * h
  return { x, y }
}

export default function WeatherOverlay() {
  const cells = MOCK_WEATHER_CELLS
  const W = 400
  const H = 250

  return (
    <div className="w-full h-full relative" aria-label="Weather overlay">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        style={{ background: 'rgba(10,14,23,0.3)' }}
      >
        {/* Simplified US outline as a rough rectangle with cutouts */}
        <rect x={10} y={10} width={W - 20} height={H - 20}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={0.8}
          rx={4}
        />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <g key={t}>
            <line
              x1={10 + t * (W - 20)} y1={10}
              x2={10 + t * (W - 20)} y2={H - 10}
              stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}
            />
            <line
              x1={10} y1={10 + t * (H - 20)}
              x2={W - 10} y2={10 + t * (H - 20)}
              stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}
            />
          </g>
        ))}

        {/* State/region labels */}
        {[
          { name: 'CAISO', lat: 36, lon: -119 },
          { name: 'ERCOT', lat: 31, lon: -99 },
          { name: 'PJM', lat: 40, lon: -79 },
          { name: 'MISO', lat: 42, lon: -90 },
          { name: 'SPP', lat: 37, lon: -97 },
          { name: 'WECC', lat: 45, lon: -113 },
        ].map(({ name, lat, lon }) => {
          const { x, y } = project(lat, lon, W, H)
          return (
            <text
              key={name}
              x={x} y={y}
              textAnchor="middle"
              fontSize={6}
              fill="rgba(255,255,255,0.2)"
              fontFamily="JetBrains Mono"
            >
              {name}
            </text>
          )
        })}

        {/* Weather cells */}
        {cells.map((cell) => {
          const { x, y } = project(cell.lat, cell.lon, W, H)

          if (cell.type === 'storm') {
            return (
              <g key={cell.id}>
                {/* Animated radar rings */}
                {[1, 2].map((ring) => (
                  <circle
                    key={ring}
                    cx={x} cy={y}
                    r={8 * cell.intensity}
                    fill="none"
                    stroke="#FF6B35"
                    strokeWidth={1}
                    opacity={ring === 1 ? 0.5 : 0.25}
                    style={{
                      animation: `radar-pulse ${1.5 + ring * 0.5}s ease-out ${ring * 0.4}s infinite`,
                    }}
                  />
                ))}
                <circle cx={x} cy={y} r={3 * cell.intensity} fill="rgba(255,107,53,0.6)" />
                <text x={x + 6} y={y - 4} fontSize={5.5} fill="#FF6B35" fontFamily="JetBrains Mono">
                  {cell.label}
                </text>
              </g>
            )
          }

          if (cell.type === 'wind') {
            return (
              <g key={cell.id}>
                <circle cx={x} cy={y} r={4} fill="rgba(0,240,255,0.3)" stroke="#00F0FF" strokeWidth={0.5} />
                <text x={x + 6} y={y} fontSize={5.5} fill="#00F0FF" fontFamily="JetBrains Mono">
                  {cell.label}
                </text>
              </g>
            )
          }

          return (
            <g key={cell.id}>
              <circle cx={x} cy={y} r={6} fill="rgba(240,187,64,0.2)" stroke="#F0BB40" strokeWidth={0.5} />
              <text x={x + 7} y={y} fontSize={5.5} fill="#F0BB40" fontFamily="JetBrains Mono">
                {cell.label}
              </text>
            </g>
          )
        })}

        {/* Legend */}
        <g transform="translate(10, 220)">
          <circle cx={4} cy={4} r={3} fill="rgba(255,107,53,0.6)" />
          <text x={10} y={7} fontSize={5} fill="rgba(255,255,255,0.4)" fontFamily="JetBrains Mono">Storm</text>
          <circle cx={44} cy={4} r={3} fill="rgba(0,240,255,0.3)" stroke="#00F0FF" strokeWidth={0.5} />
          <text x={50} y={7} fontSize={5} fill="rgba(255,255,255,0.4)" fontFamily="JetBrains Mono">Wind</text>
          <circle cx={82} cy={4} r={3} fill="rgba(240,187,64,0.2)" stroke="#F0BB40" strokeWidth={0.5} />
          <text x={88} y={7} fontSize={5} fill="rgba(255,255,255,0.4)" fontFamily="JetBrains Mono">Temp anomaly</text>
        </g>
      </svg>
    </div>
  )
}
