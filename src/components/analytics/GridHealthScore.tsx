'use client'

import { useMemo } from 'react'
import * as d3 from 'd3'

const SCORE = 91

// Half-circle gauge: flat side at bottom
// ViewBox: 200 wide × 110 tall, center at (100, 100), R = 80
const W = 200
const H = 110
const CX = W / 2
const CY = 98
const R_OUTER = 78
const R_INNER = 58
const ANGLE_START = -Math.PI      // left  (-180°)
const ANGLE_END   =  0            // right (  0°)

function scoreToAngle(score: number) {
  return ANGLE_START + (score / 100) * (ANGLE_END - ANGLE_START)
}

const arc = d3.arc<{ s: number; e: number }>()
  .innerRadius(R_INNER)
  .outerRadius(R_OUTER)
  .startAngle((d) => d.s)
  .endAngle((d) => d.e)

export default function GridHealthScore() {
  const scoreColor =
    SCORE >= 70 ? '#00E676' : SCORE >= 40 ? '#FF6B35' : '#FF3B3B'

  const trackPath = useMemo(
    () => arc({ s: ANGLE_START, e: ANGLE_END }) ?? '',
    []
  )
  const fillPath = useMemo(
    () => arc({ s: ANGLE_START, e: scoreToAngle(SCORE) }) ?? '',
    []
  )

  // Needle tip position
  const needleAngle = scoreToAngle(SCORE)
  const nx = CX + (R_INNER - 6) * Math.cos(needleAngle)
  const ny = CY + (R_INNER - 6) * Math.sin(needleAngle)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[200px]"
        role="img"
        aria-label={`Grid health score: ${SCORE} out of 100`}
        style={{ filter: `drop-shadow(0 0 10px ${scoreColor}33)` }}
      >
        {/* Zone colour bands */}
        {[
          { from: 0,  to: 40,  color: '#FF3B3B' },
          { from: 40, to: 70,  color: '#FF6B35' },
          { from: 70, to: 100, color: '#00E676' },
        ].map((zone) => {
          const bandPath = arc({
            s: scoreToAngle(zone.from),
            e: scoreToAngle(zone.to),
          })
          return (
            <path
              key={zone.from}
              d={bandPath ?? ''}
              transform={`translate(${CX},${CY})`}
              fill={zone.color}
              opacity={0.18}
            />
          )
        })}

        {/* Track */}
        <path
          d={trackPath}
          transform={`translate(${CX},${CY})`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={R_OUTER - R_INNER}
        />

        {/* Fill arc */}
        <path
          d={fillPath}
          transform={`translate(${CX},${CY})`}
          fill={scoreColor}
          opacity={0.85}
          style={{ filter: `drop-shadow(0 0 4px ${scoreColor}88)` }}
        />

        {/* Tick marks at 0, 40, 70, 100 */}
        {[0, 40, 70, 100].map((v) => {
          const a = scoreToAngle(v)
          const r1 = R_OUTER + 4
          const r2 = R_OUTER + 10
          return (
            <line
              key={v}
              x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)}
              x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1}
            />
          )
        })}

        {/* Needle dot */}
        <circle cx={nx} cy={ny} r={4} fill={scoreColor} />
        <circle cx={CX} cy={CY} r={5} fill="var(--bg-primary)" stroke={scoreColor} strokeWidth={1.5} />

        {/* Score value */}
        <text
          x={CX} y={CY - 18}
          textAnchor="middle"
          fontSize={28}
          fontWeight="700"
          fill={scoreColor}
          fontFamily="JetBrains Mono"
        >
          {SCORE}
        </text>
        <text
          x={CX} y={CY - 4}
          textAnchor="middle"
          fontSize={9}
          fill="rgba(255,255,255,0.35)"
          fontFamily="JetBrains Mono"
        >
          / 100
        </text>

        {/* Min / max labels */}
        <text x={CX - R_OUTER - 2} y={CY + 14} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.25)" fontFamily="JetBrains Mono">0</text>
        <text x={CX + R_OUTER + 2} y={CY + 14} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.25)" fontFamily="JetBrains Mono">100</text>
      </svg>
      <p className="font-mono text-[10px] text-[var(--text-muted)]">Grid Health Score</p>
    </div>
  )
}
