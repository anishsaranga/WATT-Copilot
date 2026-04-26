'use client'

import { useGridStore } from '@/stores/gridStore'
import type { GridState } from '@/lib/types'

const STATE_STYLES: Record<GridState, { gradient: string; animate: boolean }> = {
  nominal: {
    gradient: 'linear-gradient(90deg, #00E676 0%, #00F0FF 50%, #00E676 100%)',
    animate: false,
  },
  watch: {
    gradient: 'linear-gradient(90deg, #FF6B35 0%, #FFB800 33%, #FF6B35 66%, #FFB800 100%)',
    animate: true,
  },
  alert: {
    gradient: 'linear-gradient(90deg, #FF3B3B 0%, #FF6B35 33%, #FF3B3B 66%, #FF6B35 100%)',
    animate: true,
  },
  critical: {
    gradient: 'linear-gradient(90deg, #FF3B3B 0%, #FF0000 50%, #FF3B3B 100%)',
    animate: true,
  },
}

export default function StatusRail() {
  const gridState = useGridStore((s) => s.gridState)
  const style = STATE_STYLES[gridState]

  return (
    <div
      className="h-[2px] w-full flex-shrink-0"
      style={{
        background: style.gradient,
        backgroundSize: '200% 100%',
        animation: style.animate ? 'status-sweep 3s linear infinite' : 'none',
      }}
      role="presentation"
      aria-hidden
    />
  )
}
