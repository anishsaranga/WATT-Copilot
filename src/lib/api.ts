const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function fetchGridMetrics() {
  if (DEMO_MODE) return null
  const res = await fetch('/api/grid/metrics')
  if (!res.ok) throw new Error('Failed to fetch grid metrics')
  return res.json()
}

export async function fetchAlarms() {
  if (DEMO_MODE) return null
  const res = await fetch('/api/grid/alarms')
  if (!res.ok) throw new Error('Failed to fetch alarms')
  return res.json()
}

export async function fetchIncidents() {
  if (DEMO_MODE) return null
  const res = await fetch('/api/incidents')
  if (!res.ok) throw new Error('Failed to fetch incidents')
  return res.json()
}

export async function generateHandoffBrief(shiftData: unknown) {
  const res = await fetch('/api/handoff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftData),
  })
  if (!res.ok) throw new Error('Failed to generate handoff brief')
  return res.blob()
}

export function createSSEConnection(url: string, onMessage: (data: string) => void) {
  if (DEMO_MODE) return null
  const es = new EventSource(url)
  es.onmessage = (e) => onMessage(e.data)
  return es
}
