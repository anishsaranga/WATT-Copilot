// ============================================================
// GRID DASHBOARD — SHARED TYPES
// Single source of truth. Live API responses and mock incident
// data must both conform to these interfaces.
// ============================================================

export type FuelType =
  | "natural_gas"
  | "coal"
  | "nuclear"
  | "wind"
  | "solar"
  | "hydro"
  | "storage"
  | "other";

export type NERCRegion = "MRO" | "NPCC" | "RF" | "SERC" | "TRE" | "WECC";

export type ISOCode =
  | "CISO"   // California ISO
  | "PJM"   // PJM Interconnection
  | "ERCO"  // ERCOT (Texas)
  | "MISO"  // Midcontinent ISO
  | "ISNE"  // ISO New England
  | "NYIS"  // New York ISO
  | "SWPP"; // Southwest Power Pool

export type IncidentSeverity = "normal" | "warning" | "critical";

// ------------------------------------------------------------------
// 1. REAL-TIME GRID STATE — top of dashboard
// ------------------------------------------------------------------
export interface GridRealtimeState {
  timestamp_utc: string;                 // ISO 8601
  balancing_authority_code: ISOCode;
  nerc_region: NERCRegion;

  // Load
  demand_mw: number;
  load_forecast_mw: number;
  load_deviation_mw: number;            // demand_mw - load_forecast_mw

  // Generation
  net_generation_mw: number;
  generation_by_fuel: Record<FuelType, number>;  // MW per fuel type

  // Interchange
  net_interchange_mw: number;           // positive = import

  // Frequency
  frequency_hz: number;                 // nominal 60.0

  // Reserve
  reserve_margin_pct: number;           // (available - load) / load * 100

  // Incident state
  severity: IncidentSeverity;
}

// ------------------------------------------------------------------
// 2. PRICING — LMP panel
// ------------------------------------------------------------------
export interface GridPricing {
  timestamp_utc: string;
  balancing_authority_code: ISOCode;

  lmp_rt_usd_per_mwh: number;           // Real-time LMP
  lmp_da_usd_per_mwh: number;           // Day-ahead LMP
  lmp_congestion_component: number;      // Congestion portion of LMP
  lmp_loss_component: number;            // Loss portion of LMP
  lmp_energy_component: number;          // Energy portion of LMP
}

// ------------------------------------------------------------------
// 3. WEATHER CONTEXT — correlates with OE-417 weather events
// ------------------------------------------------------------------
export interface WeatherContext {
  timestamp_utc: string;
  latitude: number;
  longitude: number;

  temperature_c: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  solar_irradiance_wm2: number;         // direct_normal_irradiance
  precipitation_mm: number;
}

// ------------------------------------------------------------------
// 4. INCIDENT METADATA — mirrors OE-417 fields
// ------------------------------------------------------------------
export interface IncidentMetadata {
  incident_id: string;
  event_date: string;                   // YYYY-MM-DD
  event_time_local: string;             // HH:MM
  event_type: string;                   // raw OE-417 event type
  area_affected: string;                // maps to BA code
  load_loss_mw: number | null;
  customers_affected: number | null;
  frequency_hz_at_event: number | null; // freq deviation at time of incident
  restoration_datetime: string | null;  // ISO 8601
  duration_hours: number | null;
  severity: IncidentSeverity;
  narrative: string;
}

// ------------------------------------------------------------------
// 5. FULL DASHBOARD SNAPSHOT — one object, all panels
// ------------------------------------------------------------------
export interface DashboardSnapshot {
  realtime: GridRealtimeState;
  pricing: GridPricing;
  weather: WeatherContext;
  incident: IncidentMetadata | null;    // null when severity = "normal"
}
