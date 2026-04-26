'use client'

import { motion } from 'motion/react'
import GlassCard from '@/components/shared/GlassCard'
import AlarmFeed from './AlarmFeed'
import WeatherOverlay from './WeatherOverlay'
import LoadCurve from './LoadCurve'
import FrequencyGauge from './FrequencyGauge'
import RegionalTreemap from './RegionalTreemap'
import { useGridStore } from '@/stores/gridStore'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function GridMonitorTab() {
  const demoMode = useGridStore((s) => s.demoMode)

  // FrequencyGauge is always shown — in live mode it oscillates at nominal 60Hz
  // (no real source; see FrequencyGauge.tsx). AlarmFeed stays demo-only.
  const showFrequency = true
  const showAlarms = demoMode

  // Grid layout adapts to which cards are visible.
  const topRow = showFrequency
    ? '1fr 1fr'
    : '1fr'
  const bottomRow = showAlarms
    ? '1fr 1fr'
    : '1fr'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full overflow-auto p-3 grid gap-3"
      style={{
        gridTemplateRows: 'minmax(200px, 0.35fr) minmax(120px, 0.2fr) minmax(150px, 0.45fr)',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      {/* Row 1: Frequency Gauge (demo-only) + Load Curve */}
      {showFrequency && (
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full flex flex-col" noPadding>
            <div className="px-3 pt-2.5 pb-1 border-b border-[var(--border-subtle)]">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                {demoMode ? 'Frequency · Incident Sim' : 'Frequency · ERCOT'}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 min-h-0">
              <FrequencyGauge />
            </div>
          </GlassCard>
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        style={showFrequency ? undefined : { gridColumn: '1 / -1' }}
      >
        <GlassCard className="h-full flex flex-col" noPadding>
          <div className="px-3 pt-2.5 pb-1 border-b border-[var(--border-subtle)]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              ERCOT Load Curve (6hr)
            </span>
          </div>
          <div className="flex-1 min-h-0" style={{ minHeight: 120 }}>
            <LoadCurve />
          </div>
        </GlassCard>
      </motion.div>

      {/* Row 2: Regional LMP — full width */}
      <motion.div variants={itemVariants} style={{ gridColumn: '1 / -1' }}>
        <GlassCard className="h-full flex flex-col" noPadding>
          <div className="px-3 pt-2.5 pb-1 border-b border-[var(--border-subtle)]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              ERCOT / PJM Realtime LMP
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <RegionalTreemap />
          </div>
        </GlassCard>
      </motion.div>

      {/* Row 3: Alarm Feed (demo-only) + Weather Overlay */}
      {showAlarms && (
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full" noPadding>
            <AlarmFeed />
          </GlassCard>
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        style={showAlarms ? undefined : { gridColumn: '1 / -1' }}
      >
        <GlassCard className="h-full flex flex-col" noPadding>
          <div className="px-3 pt-2.5 pb-1 border-b border-[var(--border-subtle)]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Weather (Austin · ERCOT)
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <WeatherOverlay />
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
