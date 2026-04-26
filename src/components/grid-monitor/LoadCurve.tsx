'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Line, LineChart, ComposedChart,
} from 'recharts'
import { format } from 'date-fns'
import { useGridStore } from '@/stores/gridStore'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-panel rounded p-2 text-[10px] font-mono min-w-[140px]">
      <p className="text-[var(--text-muted)] mb-1">
        {label ? format(new Date(label), 'HH:mm') : ''}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-[var(--text-primary)]">
            {Math.round(p.value).toLocaleString()} MW
          </span>
        </div>
      ))}
    </div>
  )
}

export default function LoadCurve() {
  const loadHistory = useGridStore((s) => s.loadHistory)

  const chartData = useMemo(() =>
    loadHistory.map((p) => ({
      timestamp: p.timestamp,
      actual: Math.round(p.actual),
      forecast: Math.round(p.forecast),
    })),
    [loadHistory]
  )

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] font-mono text-xs">
        Loading...
      </div>
    )
  }

  return (
    <motion.div
      initial={{ scaleX: 0, transformOrigin: 'left' }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  style={{ stopColor: 'var(--accent-cyan)', stopOpacity: 0.25 }} />
              <stop offset="95%" style={{ stopColor: 'var(--accent-cyan)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) => format(new Date(ts), 'HH:mm')}
            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="var(--accent-cyan)"
            strokeWidth={2}
            fill="url(#actualGradient)"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
