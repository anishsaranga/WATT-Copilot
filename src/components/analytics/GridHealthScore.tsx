'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import * as d3 from 'd3'

const SCORE = 91
const W = 160
const H = 120
const CX = W / 2
const CY = H - 20
const R = 56
const ANGLE_START = -Math.PI * 0.75
const ANGLE_END = Math.PI * 0.75

export default function GridHealthScore() {
  const scoreColor = SCORE >= 70 ? '#00E676' : SCORE >= 40 ? '#FF6B35' : '#FF3B3B'
  const scoreAngle = ANGLE_START + (SCORE / 100) * (ANGLE_END - ANGLE_START)

  const trackPath = useMemo(() => d3.arc<{ s: number; e: number }>()
    .innerRadius(R - 10).outerRadius(R).startAngle((d) => d.s).endAngle((d) => d.e)
    ({ s: ANGLE_START, e: ANGLE_END }) ?? '', [])

  const fillPath = useMemo(() => d3.arc<{ s: number; e: number }>()
    .innerRadius(R - 10).outerRadius(R).startAngle((d) => d.s).endAngle((d) => d.e)
    ({ s: ANGLE_START, e: scoreAngle }) ?? '', [scoreAngle])

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-40">
        <path d={trackPath} transform={`translate(${CX},${CY})`} fill="rgba(255,255,255,0.05)" />
        <path d={fillPath} transform={`translate(${CX},${CY})`} fill={scoreColor} opacity={0.8}
          style={{ filter: `drop-shadow(0 0 6px ${scoreColor}66)` }}
        />
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize={22} fontWeight="700"
          fill={scoreColor} fontFamily="JetBrains Mono"
        >
          {SCORE}
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.4)" fontFamily="JetBrains Mono">
          /100
        </text>
      </svg>
      <p className="font-mono text-[10px] text-[var(--text-muted)] -mt-2">Grid Health Score</p>
    </div>
  )
}
