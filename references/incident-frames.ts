// ============================================================
// MOCK INCIDENT DATASET
//
// Simulates the February 2021 Texas Winter Storm Uri grid failure.
// All keys are identical to live API output — swap fetchDashboardLive()
// for iterateMockFrames() when "Mock Demo" is triggered on the UI.
//
// Usage:
//   const frames = createMockIncidentFrames();
//   // in your polling loop:
//   const frame = frames[frameIndex % frames.length];
// ============================================================

import type { DashboardSnapshot } from "../types/grid";

// ------------------------------------------------------------------
// Each "frame" is a 5-second snapshot. The sequence plays out:
//   Phase 0-2:   Pre-incident — normal operations
//   Phase 3-5:   Degradation begins — frequency drops, reserve shrinks
//   Phase 6-9:   Incident active — cascading load loss
//   Phase 10-12: Partial restoration attempt
//   Phase 13-14: Stabilization (loop back to 0 after)
// ------------------------------------------------------------------

export const MOCK_INCIDENT_FRAMES: DashboardSnapshot[] = [
  // ── FRAME 0: Normal operations ──────────────────────────────────
  {
    realtime: {
      timestamp_utc: "2021-02-10T06:00:00Z",
      balancing_authority_code: "ERCO",
      nerc_region: "TRE",
      demand_mw: 52400,
      load_forecast_mw: 52800,
      load_deviation_mw: -400,
      net_generation_mw: 56100,
      generation_by_fuel: {
        natural_gas: 28000,
        coal: 8200,
        nuclear: 5100,
        wind: 12400,
        solar: 100,
        hydro: 300,
        storage: 900,
        other: 1100,
      },
      net_interchange_mw: 0,          // ERCOT is islanded — no AC ties
      frequency_hz: 60.01,
      reserve_margin_pct: 7.1,
      severity: "normal",
    },
    pricing: {
      timestamp_utc: "2021-02-10T06:00:00Z",
      balancing_authority_code: "ERCO",
      lmp_rt_usd_per_mwh: 28.50,
      lmp_da_usd_per_mwh: 31.00,
      lmp_congestion_component: 1.20,
      lmp_loss_component: 0.80,
      lmp_energy_component: 26.50,
    },
    weather: {
      timestamp_utc: "2021-02-10T06:00:00Z",
      latitude: 30.2672,
      longitude: -97.7431,
      temperature_c: -2.1,
      wind_speed_ms: 8.4,
      wind_direction_deg: 315,
      solar_irradiance_wm2: 0,
      precipitation_mm: 0.2,
    },
    incident: null,
  },

  // ── FRAME 1: Temperature drops overnight ───────────────────────
  {
    realtime: {
      timestamp_utc: "2021-02-10T18:00:00Z",
      balancing_authority_code: "ERCO",
      nerc_region: "TRE",
      demand_mw: 58200,
      load_forecast_mw: 54000,
      load_deviation_mw: 4200,
      net_generation_mw: 61000,
      generation_by_fuel: {
        natural_gas: 31000,
        coal: 8400,
        nuclear: 5100,
        wind: 13600,
        solar: 0,
        hydro: 300,
        storage: 1500,
        other: 1100,
      },
      net_interchange_mw: 0,
      frequency_hz: 59.97,
      reserve_margin_pct: 4.8,
      severity: "warning",
    },
    pricing: {
      timestamp_utc: "2021-02-10T18:00:00Z",
      balancing_authority_code: "ERCO",
      lmp_rt_usd_per_mwh: 850.00,
      lmp_da_usd_per_mwh: 120.00,
      lmp_congestion_component: 45.00,
      lmp_loss_component: 5.00,
      lmp_energy_component: 800.00,
    },
    weather: {
      timestamp_utc: "2021-02-10T18:00:00Z",
      latitude: 30.2672,
      longitude: -97.7431,
      temperature_c: -8.4,
      wind_speed_ms: 12.1,
      wind_direction_deg: 330,
      solar_irradiance_wm2: 0,
      precipitation_mm: 2.1,
    },
    incident: null,
  },

  // ── FRAME 2: Pre-incident — natural gas lines begin freezing ───
  {
    realtime: {
      timestamp_utc: "2021-02-11T02:00:00Z",
      balancing_authority_code: "ERCO",
      nerc_region: "TRE",
      demand_mw: 69400,
      load_forecast_mw: 55000,
      load_deviation_mw: 14400,
      net_generation_mw: 67200,
      generation_by_fuel: {
        natural_gas: 28000,  // dropping — fuel supply issues
        coal: 7800,
        nuclear: 5100,
        wind: 9800,          // wind dropping in ice storm
        solar: 0,
        hydro: 300,
        storage: 2000,       // storage discharging at max
        other: 1100,
      },
      net_interchange_mw: 0,
      frequency_hz: 59.85,
      reserve_margin_pct: -3.2,  // negative — emergency
      severity: "warning",
    },
    pricing: {
      timestamp_utc: "2021-02-11T02:00:00Z",
      balancing_authority_code: "ERCO",
      lmp_rt_usd_per_mwh: 9000.00,
      lmp_da_usd_per_mwh: 2400.00,
      lmp_congestion_component: 1200.00,
      lmp_loss_component: 80.00,
      lmp_energy_component: 7720.00,
    },
    weather: {
      timestamp_utc: "2021-02-11T02:00:00Z",
      latitude: 30.2672,
      longitude: -97.7431,
      temperature_c: -14.2,
      wind_speed_ms: 15.3,
      wind_direction_deg: 340,
      solar_irradiance_wm2: 0,
      precipitation_mm: 4.8,
    },
    incident: null,
  },

  // ── FRAME 3: CRITICAL — frequency collapse, load shedding begins
  {
    realtime: {
      timestamp_utc: "2021-02-11T04:30:00Z",
      balancing_authority_code: "ERCO",
      nerc_region: "TRE",
      demand_mw: 69400,
      load_forecast_mw: 55000,
      load_deviation_mw: 14400,
      net_generation_mw: 45800,   // 23,600 MW offline
      generation_by_fuel: {
        natural_gas: 14000,       // froze gas supply lines
        coal: 5200,               // frozen coal handling
        nuclear: 4800,            // one unit tripped
        wind: 2000,               // most turbines iced
        solar: 0,
        hydro: 300,
        storage: 0,               // depleted
        other: 500,
      },
      net_interchange_mw: 0,
      frequency_hz: 59.4,         // ERCOT automated under-freq load shed triggers at 59.3
      reserve_margin_pct: -34.0,
      severity: "critical",
    },
    pricing: {
      timestamp_utc: "2021-02-11T04:30:00Z",
      balancing_authority_code: "ERCO",
      lmp_rt_usd_per_mwh: 9000.00,   // ERCOT price cap at $9,000/MWh
      lmp_da_usd_per_mwh: 9000.00,
      lmp_congestion_component: 2100.00,
      lmp_loss_component: 200.00,
      lmp_energy_component: 6700.00,
    },
    weather: {
      timestamp_utc: "2021-02-11T04:30:00Z",
      latitude: 30.2672,
      longitude: -97.7431,
      temperature_c: -17.8,
      wind_speed_ms: 16.2,
      wind_direction_deg: 345,
      solar_irradiance_wm2: 0,
      precipitation_mm: 6.1,
    },
    incident: {
      incident_id: "ERCOT-2021-WS-URI-001",
      event_date: "2021-02-11",
      event_time_local: "04:30",
      event_type: "Severe Weather - Winter Storm — Cold Wave / Extreme Cold",
      area_affected: "ERCO",
      load_loss_mw: 20000,
      customers_affected: 4500000,
      frequency_hz_at_event: 59.4,
      restoration_datetime: null,
      duration_hours: null,
      severity: "critical",
      narrative:
        "Winter Storm Uri caused widespread natural gas supply curtailment due to frozen wellheads and instrumentation. Approximately 185 generating units totaling ~34 GW tripped offline. ERCOT initiated emergency under-frequency load shedding to prevent total grid collapse. Frequency reached 59.3 Hz — 4.5 minutes from complete blackout.",
    },
  },

  // ── FRAME 4: Deep outage — 4.5M customers dark ──────────────────
  {
    realtime: {
      timestamp_utc: "2021-02-11T12:00:00Z",
      balancing_authority_code: "ERCO",
      nerc_region: "TRE",
      demand_mw: 28000,           // demand collapsed due to forced outages
      load_forecast_mw: 55000,
      load_deviation_mw: -27000,
      net_generation_mw: 34000,
      generation_by_fuel: {
        natural_gas: 12000,
        coal: 4800,
        nuclear: 4800,
        wind: 1800,
        solar: 800,
        hydro: 300,
        storage: 0,
        other: 500,
      },
      net_interchange_mw: 0,
      frequency_hz: 59.92,        // stabilized via load shedding
      reserve_margin_pct: 21.4,   // high only because load was forcibly cut
      severity: "critical",
    },
    pricing: {
      timestamp_utc: "2021-02-11T12:00:00Z",
      balancing_authority_code: "ERCO",
      lmp_rt_usd_per_mwh: 9000.00,
      lmp_da_usd_per_mwh: 9000.00,
      lmp_congestion_component: 1800.00,
      lmp_loss_component: 150.00,
      lmp_energy_component: 7050.00,
    },
    weather: {
      timestamp_utc: "2021-02-11T12:00:00Z",
      latitude: 30.2672,
      longitude: -97.7431,
      temperature_c: -18.9,       // record low for Texas
      wind_speed_ms: 14.0,
      wind_direction_deg: 340,
      solar_irradiance_wm2: 180,
      precipitation_mm: 1.2,
    },
    incident: {
      incident_id: "ERCOT-2021-WS-URI-001",
      event_date: "2021-02-11",
      event_time_local: "12:00",
      event_type: "Severe Weather - Winter Storm — Cold Wave / Extreme Cold",
      area_affected: "ERCO",
      load_loss_mw: 34000,
      customers_affected: 4500000,
      frequency_hz_at_event: 59.4,
      restoration_datetime: null,
      duration_hours: 7.5,
      severity: "critical",
      narrative:
        "Grid remained in emergency operations. 34 GW of generation offline. ERCOT operating under emergency protocols. 4.5 million Texans without power in sub-zero temperatures. Water systems failing statewide due to power loss.",
    },
  },

  // ── FRAME 5: Partial recovery — day 3 ───────────────────────────
  {
    realtime: {
      timestamp_utc: "2021-02-13T08:00:00Z",
      balancing_authority_code: "ERCO",
      nerc_region: "TRE",
      demand_mw: 38000,
      load_forecast_mw: 55000,
      load_deviation_mw: -17000,
      net_generation_mw: 42000,
      generation_by_fuel: {
        natural_gas: 19000,
        coal: 6000,
        nuclear: 5100,
        wind: 7500,
        solar: 1800,
        hydro: 300,
        storage: 1200,
        other: 1100,
      },
      net_interchange_mw: 0,
      frequency_hz: 59.98,
      reserve_margin_pct: 10.5,
      severity: "warning",
    },
    pricing: {
      timestamp_utc: "2021-02-13T08:00:00Z",
      balancing_authority_code: "ERCO",
      lmp_rt_usd_per_mwh: 9000.00,  // still at cap
      lmp_da_usd_per_mwh: 9000.00,
      lmp_congestion_component: 900.00,
      lmp_loss_component: 100.00,
      lmp_energy_component: 8000.00,
    },
    weather: {
      timestamp_utc: "2021-02-13T08:00:00Z",
      latitude: 30.2672,
      longitude: -97.7431,
      temperature_c: -12.1,
      wind_speed_ms: 10.2,
      wind_direction_deg: 320,
      solar_irradiance_wm2: 320,
      precipitation_mm: 0.0,
    },
    incident: {
      incident_id: "ERCOT-2021-WS-URI-001",
      event_date: "2021-02-11",
      event_time_local: "04:30",
      event_type: "Severe Weather - Winter Storm — Cold Wave / Extreme Cold",
      area_affected: "ERCO",
      load_loss_mw: 20000,
      customers_affected: 3200000,   // partial restoration
      frequency_hz_at_event: 59.4,
      restoration_datetime: null,
      duration_hours: 51.5,
      severity: "warning",
      narrative:
        "Partial restoration underway. Natural gas wellheads thawing. ERCOT restored approximately 5 GW of generation capacity since peak outage. Rolling blackouts continued in Dallas, Houston, and San Antonio metropolitan areas.",
    },
  },

  // ── FRAME 6: Recovery — generation returning ────────────────────
  {
    realtime: {
      timestamp_utc: "2021-02-16T14:00:00Z",
      balancing_authority_code: "ERCO",
      nerc_region: "TRE",
      demand_mw: 48000,
      load_forecast_mw: 52000,
      load_deviation_mw: -4000,
      net_generation_mw: 52800,
      generation_by_fuel: {
        natural_gas: 25000,
        coal: 7500,
        nuclear: 5100,
        wind: 11000,
        solar: 2100,
        hydro: 300,
        storage: 600,
        other: 1200,
      },
      net_interchange_mw: 0,
      frequency_hz: 60.00,
      reserve_margin_pct: 10.0,
      severity: "warning",
    },
    pricing: {
      timestamp_utc: "2021-02-16T14:00:00Z",
      balancing_authority_code: "ERCO",
      lmp_rt_usd_per_mwh: 4200.00,
      lmp_da_usd_per_mwh: 3800.00,
      lmp_congestion_component: 380.00,
      lmp_loss_component: 60.00,
      lmp_energy_component: 3760.00,
    },
    weather: {
      timestamp_utc: "2021-02-16T14:00:00Z",
      latitude: 30.2672,
      longitude: -97.7431,
      temperature_c: -4.5,
      wind_speed_ms: 7.2,
      wind_direction_deg: 290,
      solar_irradiance_wm2: 680,
      precipitation_mm: 0.0,
    },
    incident: {
      incident_id: "ERCOT-2021-WS-URI-001",
      event_date: "2021-02-11",
      event_time_local: "04:30",
      event_type: "Severe Weather - Winter Storm — Cold Wave / Extreme Cold",
      area_affected: "ERCO",
      load_loss_mw: 5000,
      customers_affected: 500000,
      frequency_hz_at_event: 59.4,
      restoration_datetime: null,
      duration_hours: 129.5,
      severity: "warning",
      narrative:
        "Generation largely restored. Temperatures rising. Remaining 500K outages concentrated in areas with infrastructure damage from burst pipes and downed equipment.",
    },
  },
];

// ------------------------------------------------------------------
// ITERATOR — use in your polling hook
// ------------------------------------------------------------------

export function createMockFrameIterator() {
  let index = 0;

  return {
    /** Returns the next frame, looping at the end */
    next(): DashboardSnapshot {
      const frame = MOCK_INCIDENT_FRAMES[index];
      index = (index + 1) % MOCK_INCIDENT_FRAMES.length;
      return frame;
    },
    /** Jump to specific phase (0 = pre-incident, 3 = critical) */
    seek(frameIndex: number): DashboardSnapshot {
      index = Math.max(0, Math.min(frameIndex, MOCK_INCIDENT_FRAMES.length - 1));
      return MOCK_INCIDENT_FRAMES[index];
    },
    reset() {
      index = 0;
    },
    get currentIndex() {
      return index;
    },
    get totalFrames() {
      return MOCK_INCIDENT_FRAMES.length;
    },
  };
}
