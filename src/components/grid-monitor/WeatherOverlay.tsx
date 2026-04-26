'use client'

import { useGridStore } from '@/stores/gridStore'

function describeWind(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const idx = Math.round(((deg % 360) / 45)) % 8
  return dirs[idx]
}

function StatBlock({ label, value, unit, accent }: { label: string; value: string; unit: string; accent: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-lg font-semibold" style={{ color: accent }}>
          {value}
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">{unit}</span>
      </div>
    </div>
  )
}

export default function WeatherOverlay() {
  const weather = useGridStore((s) => s.weather)

  if (!weather) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] font-mono text-xs">
        Loading weather…
      </div>
    )
  }

  const tempF = weather.temperature_c * 9 / 5 + 32
  const windMph = weather.wind_speed_ms * 2.237
  const isStorm = weather.precipitation_mm >= 2 || windMph >= 35
  const accent = isStorm ? 'var(--accent-amber)' : 'var(--accent-cyan)'

  return (
    <div className="w-full h-full p-4 grid grid-cols-3 gap-4 content-center" aria-label="Live weather">
      <StatBlock
        label="Temp"
        value={`${tempF.toFixed(0)}°`}
        unit={`F · ${weather.temperature_c.toFixed(1)}°C`}
        accent={accent}
      />
      <StatBlock
        label="Wind"
        value={`${windMph.toFixed(0)}`}
        unit={`mph · ${describeWind(weather.wind_direction_deg)}`}
        accent={accent}
      />
      <StatBlock
        label="Solar Irr."
        value={`${weather.solar_irradiance_wm2.toFixed(0)}`}
        unit="W/m²"
        accent="var(--accent-amber)"
      />
      <StatBlock
        label="Precip."
        value={`${weather.precipitation_mm.toFixed(1)}`}
        unit="mm"
        accent={weather.precipitation_mm > 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)'}
      />
      <div className="col-span-2 flex items-end">
        <span className="font-mono text-[10px] text-[var(--text-muted)]">
          {new Date(weather.timestamp_utc).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
          })}
          {' · '}Open-Meteo · 30.27°N, 97.74°W
        </span>
      </div>
    </div>
  )
}
