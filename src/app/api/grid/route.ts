import {
  fetchLoadLatest,
  fetchLoadWindow,
  fetchFuelMix,
  fetchERCOTLMPRealtime,
  fetchERCOTLMPDayAhead,
  fetchPJMLMPRealtime,
  fetchPJMLMPDayAhead,
  fetchWeather,
} from '@/lib/gridstatus'
import type {
  DashboardSnapshot,
  ERCOTLoadRow,
  FuelMixRow,
  LMPRow,
  WeatherSnapshot,
} from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 300

// GridStatus.io free tier: 1 request / second. Space sequential calls by this
// margin so we don't get 429-ed. Open-Meteo has no such limit and runs in
// parallel.
const GRIDSTATUS_SPACING_MS = 1100

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function tryGet<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[api/grid] ${label} failed:`, err)
    return null
  }
}

async function fetchGridStatusSerial() {
  const out: {
    load: ERCOTLoadRow | null
    fuel: FuelMixRow | null
    loadHistory: ERCOTLoadRow[]
    ercotRt: LMPRow | null
    ercotDa: LMPRow[]
    pjmRt: LMPRow | null
    pjmDa: LMPRow[]
  } = {
    load: null,
    fuel: null,
    loadHistory: [],
    ercotRt: null,
    ercotDa: [],
    pjmRt: null,
    pjmDa: [],
  }

  const steps: { run: () => Promise<void> }[] = [
    { run: async () => { out.load = await tryGet('load', fetchLoadLatest) } },
    { run: async () => { out.fuel = await tryGet('fuelMix', fetchFuelMix) } },
    { run: async () => { out.loadHistory = (await tryGet('loadHistory', () => fetchLoadWindow(6))) ?? [] } },
    { run: async () => { out.ercotRt = await tryGet('ercotRt', fetchERCOTLMPRealtime) } },
    { run: async () => { out.ercotDa = (await tryGet('ercotDa', fetchERCOTLMPDayAhead)) ?? [] } },
    { run: async () => { out.pjmRt = await tryGet('pjmRt', fetchPJMLMPRealtime) } },
    { run: async () => { out.pjmDa = (await tryGet('pjmDa', fetchPJMLMPDayAhead)) ?? [] } },
  ]

  for (let i = 0; i < steps.length; i++) {
    await steps[i].run()
    if (i < steps.length - 1) await sleep(GRIDSTATUS_SPACING_MS)
  }
  return out
}

export async function GET() {
  const [gs, weatherR] = await Promise.all([
    fetchGridStatusSerial(),
    tryGet<WeatherSnapshot>('weather', fetchWeather),
  ])

  const { load, fuel, loadHistory, ercotRt, ercotDa, pjmRt, pjmDa } = gs
  const weather = weatherR

  const realtime =
    load && fuel ? { ...load, ...fuel } : null

  const partial =
    !realtime ||
    !weather ||
    !ercotRt ||
    !pjmRt ||
    loadHistory.length === 0

  const body: DashboardSnapshot = {
    realtime,
    pricing: {
      ercot: { realtime: ercotRt, day_ahead: ercotDa },
      pjm: { realtime: pjmRt, day_ahead: pjmDa },
    },
    weather,
    load_history: loadHistory,
    fetched_at: new Date().toISOString(),
    partial,
  }

  return Response.json(body, {
    status: realtime || weather ? 200 : 502,
  })
}
