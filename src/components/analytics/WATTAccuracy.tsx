'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const DATA = [
  { name: 'Correct', value: 89, color: '#00E676' },
  { name: 'Modified', value: 8, color: '#FF6B35' },
  { name: 'Rejected', value: 3, color: '#FF3B3B' },
]

export default function WATTAccuracy() {
  return (
    <div className="flex flex-col items-center h-full">
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={DATA}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={45}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {DATA.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.85} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontFamily: 'JetBrains Mono', fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-1">
        {DATA.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="font-mono text-[10px] text-[var(--text-secondary)]">{d.name}: {d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
