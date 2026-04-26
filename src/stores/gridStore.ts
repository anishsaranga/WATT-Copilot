'use client'

import { create } from 'zustand'
import type { GridMetrics, GridState, FrequencyDataPoint, LoadDataPoint, Alarm, SparklinePoint } from '@/lib/types'
import { getGridState } from '@/lib/formatters'
import { SPARKLINE_POINTS, LOAD_HISTORY_POINTS } from '@/lib/constants'
import {
  generateFrequencyHistory, generateLoadCurve, generateLoadSparkline,
  generateDCLoadSparkline, BALANCING_AUTHORITIES,
} from '@/lib/mock-data/gridGenerator'

interface GridStore {
  metrics: GridMetrics
  frequencyHistory: FrequencyDataPoint[]
  loadHistory: LoadDataPoint[]
  loadSparkline: SparklinePoint[]
  dcLoadSparkline: SparklinePoint[]
  alarms: Alarm[]
  selectedRegion: string | null
  gridState: GridState
  updateMetrics: (partial: Partial<GridMetrics>) => void
  addAlarm: (alarm: Alarm) => void
  acknowledgeAlarm: (id: string) => void
  setSelectedRegion: (region: string | null) => void
  pushFrequencyPoint: (point: FrequencyDataPoint) => void
  pushLoadPoint: (point: LoadDataPoint) => void
  initWithMockData: () => void
}

export const useGridStore = create<GridStore>()((set, get) => ({
  metrics: {
    frequency: 60.002,
    load: 41247,
    forecastLoad: 41000,
    forecastDeviation: 0.6,
    alarmCount: 0,
    dcLoad: 1102,
    timestamp: Date.now(),
  },
  frequencyHistory: [],
  loadHistory: [],
  loadSparkline: [],
  dcLoadSparkline: [],
  alarms: [],
  selectedRegion: null,
  gridState: 'nominal',

  updateMetrics: (partial) =>
    set((state) => {
      const next = { ...state.metrics, ...partial, timestamp: Date.now() }
      const newState = getGridState(next.frequency, next.forecastDeviation)
      return { metrics: next, gridState: newState }
    }),

  addAlarm: (alarm) =>
    set((state) => ({
      alarms: [alarm, ...state.alarms].slice(0, 50),
      metrics: { ...state.metrics, alarmCount: state.metrics.alarmCount + 1 },
    })),

  acknowledgeAlarm: (id) =>
    set((state) => ({
      alarms: state.alarms.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
      metrics: {
        ...state.metrics,
        alarmCount: Math.max(0, state.metrics.alarmCount - 1),
      },
    })),

  setSelectedRegion: (region) => set({ selectedRegion: region }),

  pushFrequencyPoint: (point) =>
    set((state) => ({
      frequencyHistory: [...state.frequencyHistory, point].slice(-SPARKLINE_POINTS),
    })),

  pushLoadPoint: (point) =>
    set((state) => ({
      loadHistory: [...state.loadHistory, point].slice(-LOAD_HISTORY_POINTS),
    })),

  initWithMockData: () => {
    const now = Date.now()
    set({
      frequencyHistory: generateFrequencyHistory(SPARKLINE_POINTS, now),
      loadHistory: generateLoadCurve(LOAD_HISTORY_POINTS, now),
      loadSparkline: generateLoadSparkline(SPARKLINE_POINTS),
      dcLoadSparkline: generateDCLoadSparkline(SPARKLINE_POINTS),
    })
  },
}))
