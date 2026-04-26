'use client'

import { useEffect, useRef, useMemo } from 'react'
import { motion } from 'motion/react'
import * as d3 from 'd3'
import { useGridStore } from '@/stores/gridStore'
import { getFrequencyZone, formatFrequency } from '@/lib/formatters'
import {
  FREQUENCY_DISPLAY_MIN, FREQUENCY_DISPLAY_MAX,
  FREQUENCY_WARN_LOW, FREQUENCY_WARN_HIGH,
  FREQUENCY_CRIT_LOW, FREQUENCY_CRIT_HIGH,
} from '@/lib/constants'

const W = 280
const H = 190
const CX = W / 2
const CY = H - 30
const R_OUTER = 110
const R_INNER = 72
const ANGLE_START = -Math.PI * 0.75
const ANGLE_END = Math.PI * 0.75

function hzToAngle(hz: number): number {
  const t = (hz - FREQUENCY_DISPLAY_MIN) / (FREQUENCY_DISPLAY_MAX - FREQUENCY_DISPLAY_MIN)
  return ANGLE_START + t * (ANGLE_END - ANGLE_START)
}

const ARC_ZONES = [
  { from: FREQUENCY_DISPLAY_MIN, to: FREQUENCY_CRIT_LOW, color: '#FF3B3B' },
  { from: FREQUENCY_CRIT_LOW, to: FREQUENCY_WARN_LOW, color: '#FF6B35' },
  { from: FREQUENCY_WARN_LOW, to: FREQUENCY_WARN_HIGH, color: '#00E676' },
  { from: FREQUENCY_WARN_HIGH, to: FREQUENCY_CRIT_HIGH, color: '#FF6B35' },
  { from: FREQUENCY_CRIT_HIGH, to: FREQUENCY_DISPLAY_MAX, color: '#FF3B3B' },
]

export default function FrequencyGauge() {
  const frequency = useGridStore((s) => s.metrics.frequency)
  const svgRef = useRef<SVGSVGElement>(null)

  const zone = getFrequencyZone(frequency)
  const zoneColor = zone === 'nominal' ? '#00E676' : zone === 'watch' ? '#FF6B35' : '#FF3B3B'
  const needleAngle = hzToAngle(Math.max(FREQUENCY_DISPLAY_MIN, Math.min(FREQUENCY_DISPLAY_MAX, frequency)))
  const needleDeg = (needleAngle * 180) / Math.PI

  // Build arc paths once
  const arcPaths = useMemo(() => {
    const arcGen = d3.arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(R_INNER)
      .outerRadius(R_OUTER)
      .startAngle((d) => d.startAngle)
      .endAngle((d) => d.endAngle)

    return ARC_ZONES.map((zone) => ({
      color: zone.color,
      d: arcGen({ startAngle: hzToAngle(zone.from), endAngle: hzToAngle(zone.to) }) ?? '',
    }))
  }, [])

  // Tick marks
  const ticks = useMemo(() => {
    const vals = [59.85, 59.9, 59.95, 60.0, 60.05, 60.1, 60.15]
    return vals.map((v) => {
      const angle = hzToAngle(v)
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const r1 = R_OUTER + 4
      const r2 = R_OUTER + 12
      return {
        label: v.toFixed(2),
        x1: CX + cos * r1,
        y1: CY + sin * r1,
        x2: CX + cos * r2,
        y2: CY + sin * r2,
        lx: CX + cos * (r2 + 8),
        ly: CY + sin * (r2 + 8),
        isCenter: v === 60.0,
      }
    })
  }, [])

  const deviation = frequency - 60.0
  const devText = `Δ ${deviation >= 0 ? '+' : ''}${deviation.toFixed(4)} Hz`

  return (
    <div className="relative w-full flex flex-col items-center">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[280px]"
        role="img"
        aria-label={`Frequency gauge: ${formatFrequency(frequency)}, ${zone}`}
        style={{ filter: `drop-shadow(0 0 12px ${zoneColor}22)` }}
      >
        <defs>
          <radialGradient id="gauge-bg" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor={`${zoneColor}20`} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <ellipse cx={CX} cy={CY} rx={R_OUTER + 10} ry={R_OUTER + 10} fill="url(#gauge-bg)" />

        {/* Track background */}
        <path
          d={d3.arc<{ startAngle: number; endAngle: number }>()
            .innerRadius(R_INNER)
            .outerRadius(R_OUTER)
            .startAngle(ANGLE_START)
            .endAngle(ANGLE_END)({ startAngle: ANGLE_START, endAngle: ANGLE_END }) ?? ''}
          transform={`translate(${CX},${CY})`}
          fill="rgba(255,255,255,0.04)"
        />

        {/* Zone arcs */}
        {arcPaths.map((arc, i) => (
          <path
            key={i}
            d={arc.d}
            transform={`translate(${CX},${CY})`}
            fill={arc.color}
            opacity={0.7}
          />
        ))}

        {/* Tick marks */}
        {ticks.map((tick) => (
          <g key={tick.label}>
            <line
              x1={tick.x1} y1={tick.y1}
              x2={tick.x2} y2={tick.y2}
              stroke={tick.isCenter ? '#00F0FF' : 'rgba(255,255,255,0.3)'}
              strokeWidth={tick.isCenter ? 1.5 : 0.8}
            />
          </g>
        ))}

        {/* Needle */}
        <motion.g
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          animate={{ rotate: needleDeg }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - R_INNER + 8}
            stroke={zoneColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle cx={CX} cy={CY} r={5} fill={zoneColor} />
          <circle cx={CX} cy={CY} r={3} fill="var(--bg-primary)" />
        </motion.g>
      </svg>

      {/* Center value display */}
      <div className="flex flex-col items-center -mt-8 relative z-10">
        <span
          className="font-jetbrains text-2xl font-bold animate-pulse-glow"
          style={{ color: zoneColor }}
          aria-live="off"
        >
          {frequency.toFixed(3)} Hz
        </span>
        <span className="font-jetbrains text-xs mt-0.5" style={{ color: zoneColor + 'AA' }}>
          {devText}
        </span>
      </div>
    </div>
  )
}
