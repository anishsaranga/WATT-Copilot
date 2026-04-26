'use client'

import { useGridStore } from '@/stores/gridStore'
import type { LMPRow } from '@/lib/types'

function priceColor(lmp: number): string {
  if (lmp >= 200) return 'var(--accent-red)'
  if (lmp >= 80) return 'var(--accent-amber)'
  if (lmp >= 30) return 'var(--accent-green)'
  return 'var(--accent-cyan)'
}

function PriceTile({ label, sub, lmp }: { label: string; sub: string; lmp: LMPRow | null }) {
  const color = lmp ? priceColor(lmp.lmp) : 'var(--text-muted)'
  return (
    <div
      className="flex flex-col justify-between rounded p-3 border border-[var(--border-subtle)]"
      style={{
        background: lmp ? `linear-gradient(135deg, ${color}11 0%, transparent 70%)` : 'transparent',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{label}</span>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">{sub}</span>
      </div>
      {lmp ? (
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-mono text-2xl font-semibold" style={{ color }}>
            ${lmp.lmp.toFixed(2)}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">/MWh</span>
        </div>
      ) : (
        <span className="font-mono text-xs text-[var(--text-muted)] mt-2">No data</span>
      )}
      {lmp && (
        <div className="flex gap-3 mt-2 font-mono text-[10px] text-[var(--text-muted)]">
          <span>energy ${lmp.energy.toFixed(1)}</span>
          <span>cong ${lmp.congestion.toFixed(1)}</span>
          <span>loss ${lmp.loss.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}

export default function RegionalTreemap() {
  const ercot = useGridStore((s) => s.lmpERCOTRealtime)
  const pjm = useGridStore((s) => s.lmpPJMRealtime)

  return (
    <div className="w-full h-full p-3 grid grid-cols-2 gap-3" aria-label="Regional LMP pricing">
      <PriceTile label="ERCOT" sub={ercot?.location ?? 'HB_NORTH'} lmp={ercot} />
      <PriceTile label="PJM" sub={pjm?.location ?? 'PJM RTO'} lmp={pjm} />
    </div>
  )
}
