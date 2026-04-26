'use client'

import { useEffect, useRef } from 'react'
import { useGridStore } from '@/stores/gridStore'
import { useCopilotStore } from '@/stores/copilotStore'
import {
  createSimulatorState,
  nextIncidentFrame,
  TICK_MS,
  type SimulatorState,
} from '@/lib/mock-data/incidentSimulator'
import type { DashboardSnapshot, FastLoadSnapshot } from '@/lib/types'
import { SPARKLINE_POINTS, LOAD_HISTORY_POINTS } from '@/lib/constants'

const POLL_FULL_MS = 5 * 60_000
const POLL_FAST_MS = 30_000
const MAX_RETRIES = 3

function isDashboardSnapshot(v: unknown): v is DashboardSnapshot {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    typeof o.fetched_at === 'string' &&
    Array.isArray(o.load_history) &&
    typeof o.pricing === 'object' &&
    o.pricing !== null
  )
}

function isFastLoadSnapshot(v: unknown): v is FastLoadSnapshot {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.fetched_at === 'string' && 'realtime_load' in o
}

async function fetchJson<T>(
  url: string,
  signal: AbortSignal,
  guard: (v: unknown) => v is T,
): Promise<T> {
  const res = await fetch(url, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  const json: unknown = await res.json()
  if (!guard(json)) throw new Error(`${url} malformed payload`)
  return json
}

export function useGridDashboard() {
  const demoMode = useGridStore((s) => s.demoMode)
  const setSnapshot = useGridStore((s) => s.setSnapshot)
  const setFastLoad = useGridStore((s) => s.setFastLoad)
  const setIsError = useGridStore((s) => s.setIsError)

  const liveAbortRef = useRef<AbortController | null>(null)
  const simStateRef = useRef<SimulatorState | null>(null)

  // Live polling effect
  useEffect(() => {
    if (demoMode) return

    let disposed = false
    const ctrl = new AbortController()
    liveAbortRef.current = ctrl

    let fullFailures = 0
    let fastFailures = 0

    const pollFull = async () => {
      try {
        const snap = await fetchJson('/api/grid', ctrl.signal, isDashboardSnapshot)
        if (disposed) return
        setSnapshot(snap)
        fullFailures = 0
        setIsError(false)
      } catch (err) {
        if (disposed || ctrl.signal.aborted) return
        fullFailures += 1
        if (fullFailures >= MAX_RETRIES) setIsError(true)
        console.error('[useGridDashboard] full poll failed', err)
      }
    }

    const pollFast = async () => {
      try {
        const snap = await fetchJson('/api/grid/load', ctrl.signal, isFastLoadSnapshot)
        if (disposed) return
        setFastLoad(snap)
        fastFailures = 0
      } catch (err) {
        if (disposed || ctrl.signal.aborted) return
        fastFailures += 1
        if (fastFailures >= MAX_RETRIES) setIsError(true)
        console.error('[useGridDashboard] fast poll failed', err)
      }
    }

    // Stagger: full first, then fast 1s later so the snapshot lands first
    void pollFull()
    const fastBoot = window.setTimeout(() => void pollFast(), 1000)
    const fullId = window.setInterval(pollFull, POLL_FULL_MS)
    const fastId = window.setInterval(pollFast, POLL_FAST_MS)

    return () => {
      disposed = true
      ctrl.abort()
      window.clearTimeout(fastBoot)
      window.clearInterval(fullId)
      window.clearInterval(fastId)
    }
  }, [demoMode, setSnapshot, setFastLoad, setIsError])

  // Demo loop effect
  useEffect(() => {
    if (!demoMode) {
      simStateRef.current = null
      return
    }

    const baseSnapshot = useGridStore.getState().snapshot
    simStateRef.current = createSimulatorState(baseSnapshot)

    // Reset transient state for clean demo start
    useGridStore.setState({
      frequencyHistory: [],
      alarms: [],
      metrics: { ...useGridStore.getState().metrics, alarmCount: 0 },
    })

    // Fire copilot scripted scenario once on cycle 0 start
    useCopilotStore.getState().runDemoScenario()

    let lastCycle = 0

    const tick = () => {
      const state = simStateRef.current
      if (!state) return
      const now = Date.now()
      const frame = nextIncidentFrame(state, now)

      const store = useGridStore.getState()
      store.updateMetrics({
        frequency: frame.frequency,
        load: frame.load,
        forecastLoad: frame.load * 1.01,
        forecastDeviation: ((frame.load - frame.load * 1.01) / (frame.load * 1.01)) * 100,
      })
      store.pushFrequencyPoint({ timestamp: now, value: frame.frequency })

      // Update sparkline only (MetricsStrip). loadHistory intentionally NOT
      // updated — it holds 5-min API data and must not receive 1s demo points
      // (would flood the LoadCurve X-axis with duplicate HH:mm labels).
      const sp = useGridStore.getState().loadSparkline
      const nextSp = [...sp, { timestamp: now, value: frame.load }].slice(-SPARKLINE_POINTS)

      useGridStore.setState({
        loadSparkline: nextSp,
        fuelMix: frame.fuelMix,
        lmpERCOTRealtime: frame.lmpERCOT,
        lmpPJMRealtime: frame.lmpPJM,
      })

      for (const a of frame.newAlarms) store.addAlarm(a)

      if (frame.cycle > lastCycle) {
        lastCycle = frame.cycle
        // Re-fire copilot scripted scenario per cycle
        useCopilotStore.getState().runDemoScenario()
      }
    }

    tick()
    const id = window.setInterval(tick, TICK_MS)
    return () => {
      window.clearInterval(id)
      simStateRef.current = null
    }
  }, [demoMode])
}
