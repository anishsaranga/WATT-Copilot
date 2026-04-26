'use client'

import { useEffect, useRef } from 'react'
import { useGridStore } from '@/stores/gridStore'
import { generateNextFrequency, generateAlarm } from '@/lib/mock-data/gridGenerator'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
const TICK_MS = 1000
const ALARM_PROBABILITY = 1 / 480 // ~1 alarm per 8 minutes at 1Hz ticks

export function useGridData() {
  const { updateMetrics, addAlarm, pushFrequencyPoint, initWithMockData } = useGridStore()
  const tickCountRef = useRef(0)

  useEffect(() => {
    if (!DEMO_MODE) return

    initWithMockData()

    const interval = setInterval(() => {
      tickCountRef.current++
      const now = Date.now()

      const raw = generateNextFrequency()
      const frequency = isNaN(raw) ? 60.0 : raw
      const loadBase = 41000 + Math.sin(tickCountRef.current * 0.001) * 3000
      const load = Math.max(35000, Math.min(48000, loadBase + (Math.random() - 0.5) * 200))
      const forecastLoad = load + (Math.random() - 0.5) * 800
      const forecastDeviation = ((load - forecastLoad) / forecastLoad) * 100
      const dcLoad = 1100 + Math.sin(tickCountRef.current * 0.003) * 150 + (Math.random() - 0.5) * 50

      updateMetrics({ frequency, load, forecastLoad, forecastDeviation, dcLoad })
      pushFrequencyPoint({ timestamp: now, value: frequency })

      if (Math.random() < ALARM_PROBABILITY) {
        addAlarm(generateAlarm())
      }
    }, TICK_MS)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
