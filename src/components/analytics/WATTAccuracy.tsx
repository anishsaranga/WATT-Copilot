'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'

const DATA = [
  { name: 'Correct',  value: 89, color: '#00E676' },
  { name: 'Modified', value: 8,  color: '#FF6B35' },
  { name: 'Rejected', value: 3,  color: '#FF3B3B' },
]

function CenterLabel({ viewBox }: any) {
  const { cx, cy } = viewBox ?? {}
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={22} fontWeight="700" fill="#00E676" fontFamily="JetBrains Mono">
        89%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle"
        fontSize={9} fill="rgba(255,255,255,0.35)" fontFamily="JetBrains Mono">
        correct
      </text>
    </g>
  )
}

export default function WATTAccuracy() {
  return (
    <div className="flex flex-col items-center" style={{ height: 160 }}>
      <div style={{ width: '100%', height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={DATA}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={42}
              outerRadius={58}
              paddingAngle={2}
              dataKey="value"
            >
              {DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} opacity={0.85} />
              ))}
              <Label content={<CenterLabel />} position="center" />
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                borderRadius: 4,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-3 mt-1">
        {DATA.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="font-mono text-[10px] text-[var(--text-secondary)]">
              {d.name} {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
