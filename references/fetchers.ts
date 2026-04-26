// ============================================================
// LIVE API FETCHERS — TypeScript / Next.js compatible
//
// All functions return the shared types from grid.ts
// Use in Next.js API routes (/app/api/grid/route.ts) or
// directly in server components.
//
// Env vars needed in .env.local:
//   EIA_API_KEY=your_key_here          (free at eia.gov/opendata)
//   ERCOT_API_KEY=your_key_here        (free at ercot.com/services/api)
// ============================================================

import type {
  GridRealtimeState,
  GridPricing,
  WeatherContext,
  ISOCode,
  FuelType,
  IncidentSeverity,
} from "../types/grid";

// ------------------------------------------------------------------
// UTILITY
// ------------------------------------------------------------------
function nowISO(): string {
  return new Date().toISOString();
}

function calcSeverity(freq: number, reserve: number): IncidentSeverity {
  if (freq < 59.5 || freq > 60.5 || reserve < 5) return "critical";
  if (freq < 59.8 || freq > 60.2 || reserve < 12) return "warning";
  return "normal";
}

// ------------------------------------------------------------------
// 1. EIA v2 API — demand + generation by fuel
//    Endpoint: https://api.eia.gov/v2/electricity/rto/region-data/data/
//    Docs: https://www.eia.gov/opendata/documentation.php
//    Free key: https://www.eia.gov/opendata/
//    Granularity: hourly, updated ~1 hour behind real-time
//    ISOs: CISO, PJM, ERCO, MISO, ISNE, NYIS, SWPP
// ------------------------------------------------------------------

const EIA_BASE = "https://api.eia.gov/v2";
const EIA_KEY = process.env.EIA_API_KEY ?? "";

// Raw shape returned by EIA v2 /electricity/rto/region-data/data/
interface EIARegionDataRow {
  period: string;          // "2024-01-15T14"
  respondent: string;      // "CISO"
  respondent_name: string;
  type: string;            // "D" | "NG" | "TI" | "DF"
  type_name: string;
  value: string;           // MW as string
  "value-units": string;   // "megawatthours"
}

interface EIAFuelRow {
  period: string;
  respondent: string;
  fueltype: string;        // "NG" | "SUN" | "WND" | "WAT" | "NUC" | "COL" | "OTH" | "STO"
  type_name: string;
  value: string;           // MW
  "value-units": string;
}

// Maps EIA fueltype codes to our FuelType
const EIA_FUEL_MAP: Record<string, FuelType> = {
  NG:  "natural_gas",
  SUN: "solar",
  WND: "wind",
  WAT: "hydro",
  NUC: "nuclear",
  COL: "coal",
  OTH: "other",
  STO: "storage",
};

export async function fetchEIARealtimeState(
  iso: ISOCode
): Promise<Pick<GridRealtimeState, "demand_mw" | "load_forecast_mw" | "net_generation_mw" | "net_interchange_mw" | "generation_by_fuel" | "timestamp_utc">> {
  // Fetch demand, net gen, total interchange, and demand forecast
  const params = new URLSearchParams({
    api_key: EIA_KEY,
    "facets[respondent][]": iso,
    frequency: "hourly",
    "data[]": "value",
    sort: "period",
    sortDirection: "desc",
    length: "10",
  });

  const regionRes = await fetch(
    `${EIA_BASE}/electricity/rto/region-data/data/?${params}`
  );
  const regionJson = await regionRes.json();
  const rows: EIARegionDataRow[] = regionJson?.response?.data ?? [];

  // Grab the most recent period that has all types
  const byType: Record<string, number> = {};
  let latestPeriod = "";

  for (const row of rows) {
    if (!latestPeriod) latestPeriod = row.period;
    if (row.period === latestPeriod) {
      byType[row.type] = parseFloat(row.value);
    }
  }

  // Fetch generation by fuel type separately
  const fuelParams = new URLSearchParams({
    api_key: EIA_KEY,
    "facets[respondent][]": iso,
    frequency: "hourly",
    "data[]": "value",
    sort: "period",
    sortDirection: "desc",
    length: "20",
  });

  const fuelRes = await fetch(
    `${EIA_BASE}/electricity/rto/fuel-type-data/data/?${fuelParams}`
  );
  const fuelJson = await fuelRes.json();
  const fuelRows: EIAFuelRow[] = fuelJson?.response?.data ?? [];

  const generation_by_fuel = {} as Record<FuelType, number>;
  for (const row of fuelRows.filter((r) => r.period === latestPeriod)) {
    const fuel = EIA_FUEL_MAP[row.fueltype];
    if (fuel) generation_by_fuel[fuel] = parseFloat(row.value);
  }

  return {
    timestamp_utc: new Date(latestPeriod + ":00:00Z").toISOString(),
    demand_mw: byType["D"] ?? 0,
    load_forecast_mw: byType["DF"] ?? 0,
    net_generation_mw: byType["NG"] ?? 0,
    net_interchange_mw: byType["TI"] ?? 0,
    generation_by_fuel,
  };
}

// ------------------------------------------------------------------
// 2. ERCOT PUBLIC API — system frequency (only public ISO that exposes it)
//    Endpoint: https://api.ercot.com/api/public-reports
//    Docs: https://www.ercot.com/services/api
//    Free key from: developer.ercot.com
//    Granularity: 5-minute real-time
// ------------------------------------------------------------------

const ERCOT_BASE = "https://api.ercot.com/api/public-reports";
const ERCOT_KEY = process.env.ERCOT_API_KEY ?? "";

interface ERCOTSystemStatus {
  systemFrequency: number;       // Hz
  systemLoad: number;            // MW
  windOutput: number;            // MW
  solarOutput: number;           // MW
  dcTieFlowTotal: number;        // MW — net interchange
  timestamp: string;
}

export async function fetchERCOTRealtimeState(): Promise<{
  frequency_hz: number;
  demand_mw: number;
  wind_mw: number;
  solar_mw: number;
  net_interchange_mw: number;
  timestamp_utc: string;
}> {
  // np6-345-cd: Actual System Load by Weather Zone (5-min)
  const res = await fetch(
    `${ERCOT_BASE}/np6-345-cd/act_sys_load_by_wzn`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": ERCOT_KEY,
        Accept: "application/json",
      },
    }
  );

  // Frequency comes from a separate endpoint
  const freqRes = await fetch(
    `${ERCOT_BASE}/np4-187-cd/nprr_syststatus`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": ERCOT_KEY,
        Accept: "application/json",
      },
    }
  );

  const loadData = await res.json();
  const freqData = await freqRes.json();

  // ERCOT returns { _meta, data: [...] }
  const latestLoad = loadData?.data?.[0] ?? {};
  const latestFreq = freqData?.data?.[0] ?? {};

  return {
    frequency_hz: parseFloat(latestFreq.systemFrequency ?? "60.0"),
    demand_mw: parseFloat(latestLoad.systemLoad ?? "0"),
    wind_mw: parseFloat(latestLoad.windOutput ?? "0"),
    solar_mw: parseFloat(latestLoad.solarOutput ?? "0"),
    net_interchange_mw: parseFloat(latestLoad.dcTieFlowTotal ?? "0"),
    timestamp_utc: new Date(latestLoad.timestamp ?? Date.now()).toISOString(),
  };
}

// ------------------------------------------------------------------
// 3. PJM DataMiner2 — Real-time LMP
//    Endpoint: https://dataminer2.pjm.com/feed/rt_unverified_fivemin_lmps
//    Docs: https://dataminer2.pjm.com
//    Free account: dataminer2.pjm.com (register, no key in header — uses session)
//    Granularity: 5-minute
// ------------------------------------------------------------------

interface PJMLMPRow {
  datetime_beginning_utc: string;
  pnode_id: number;
  pnode_name: string;
  voltage: number;
  equipment: string;
  type: string;
  zone: string;
  total_lmp_rt: number;
  energy_price: number;
  congestion_price: number;
  loss_price: number;
}

export async function fetchPJMLMP(pnode: string = "PJM RTO"): Promise<GridPricing> {
  // PJM uses a query parameter API — no auth key needed for public read
  const params = new URLSearchParams({
    startRow: "1",
    numRows: "1",
    pnode_name: pnode,
    sort: "datetime_beginning_utc",
    order: "desc",
  });

  const res = await fetch(
    `https://dataminer2.pjm.com/feed/rt_unverified_fivemin_lmps/fields?${params}`,
    { headers: { Accept: "application/json" } }
  );
  const json = await res.json();
  const row: PJMLMPRow = json?.[0] ?? {};

  // Day-ahead from separate endpoint
  const daRes = await fetch(
    `https://dataminer2.pjm.com/feed/da_hrl_lmps/fields?${new URLSearchParams({
      startRow: "1",
      numRows: "1",
      pnode_name: pnode,
      sort: "datetime_beginning_utc",
      order: "desc",
    })}`,
    { headers: { Accept: "application/json" } }
  );
  const daJson = await daRes.json();
  const daRow = daJson?.[0] ?? {};

  return {
    timestamp_utc: new Date(row.datetime_beginning_utc ?? Date.now()).toISOString(),
    balancing_authority_code: "PJM",
    lmp_rt_usd_per_mwh: row.total_lmp_rt ?? 0,
    lmp_da_usd_per_mwh: daRow.total_lmp_da ?? 0,
    lmp_congestion_component: row.congestion_price ?? 0,
    lmp_loss_component: row.loss_price ?? 0,
    lmp_energy_component: row.energy_price ?? 0,
  };
}

// ------------------------------------------------------------------
// 4. CAISO OASIS — Real-time LMP (no auth needed)
//    Endpoint: http://oasis.caiso.com/oasisapi/SingleZip
//    Granularity: 5-minute
// ------------------------------------------------------------------

export async function fetchCAISOLMP(node: string = "TH_NP15_GEN-APND"): Promise<GridPricing> {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "0000";

  const params = new URLSearchParams({
    queryname: "PRC_LMP",
    market_run_id: "RTM",
    node: node,
    startdatetime: fmt(start),
    enddatetime: fmt(now),
    version: "1",
    resultformat: "6", // JSON
  });

  // CAISO returns a ZIP — in production use a proxy or server-side fetch
  // This is a simplified shape; actual response is XML/ZIP
  const res = await fetch(
    `http://oasis.caiso.com/oasisapi/SingleZip?${params}`
  );

  // NOTE: CAISO returns ZIP. In Next.js API route, decompress with:
  // const { unzip } = await import('zlib'); then parse XML.
  // Returning expected shape for typing purposes:
  const json = await res.json().catch(() => ({}));
  const row = json?.OASISReport?.MessagePayload?.RTO?.REPORT_ITEM?.[0]?.REPORT_DATA?.[0] ?? {};

  return {
    timestamp_utc: nowISO(),
    balancing_authority_code: "CISO",
    lmp_rt_usd_per_mwh: parseFloat(row.VALUE ?? "0"),
    lmp_da_usd_per_mwh: 0,          // fetch separately from DAM endpoint
    lmp_congestion_component: 0,
    lmp_loss_component: 0,
    lmp_energy_component: parseFloat(row.VALUE ?? "0"),
  };
}

// ------------------------------------------------------------------
// 5. OPEN-METEO — Weather context (free, no key needed)
//    Endpoint: https://api.open-meteo.com/v1/forecast
//    Docs: https://open-meteo.com/en/docs
//    Granularity: hourly, updated every hour
// ------------------------------------------------------------------

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    direct_normal_irradiance: number[];
    precipitation: number[];
  };
}

export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherContext> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: [
      "temperature_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "direct_normal_irradiance",
      "precipitation",
    ].join(","),
    wind_speed_unit: "ms",
    forecast_days: "1",
    timezone: "UTC",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  const json: OpenMeteoResponse = await res.json();

  // Find the index closest to current hour
  const now = new Date();
  const currentHour = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours()
  ).toISOString().slice(0, 13);

  const idx = json.hourly.time.findIndex((t) => t.startsWith(currentHour));
  const i = idx >= 0 ? idx : 0;

  return {
    timestamp_utc: new Date(json.hourly.time[i]).toISOString(),
    latitude,
    longitude,
    temperature_c: json.hourly.temperature_2m[i] ?? 0,
    wind_speed_ms: json.hourly.wind_speed_10m[i] ?? 0,
    wind_direction_deg: json.hourly.wind_direction_10m[i] ?? 0,
    solar_irradiance_wm2: json.hourly.direct_normal_irradiance[i] ?? 0,
    precipitation_mm: json.hourly.precipitation[i] ?? 0,
  };
}

// ------------------------------------------------------------------
// 6. COMBINED — fetchDashboardLive()
//    Single function to hydrate all dashboard panels.
//    Use as the data source for your polling interval.
//    Default to ERCOT (best public API coverage).
// ------------------------------------------------------------------

export async function fetchDashboardLive(
  iso: ISOCode = "ERCO",
  lat = 30.2672,  // Austin TX — ERCOT HQ
  lon = -97.7431
): Promise<Omit<import("../types/grid").DashboardSnapshot, "incident">> {
  const [eia, ercot, pricing, weather] = await Promise.allSettled([
    fetchEIARealtimeState(iso),
    fetchERCOTRealtimeState(),          // frequency only available via ERCOT
    fetchPJMLMP(),                      // swap for fetchCAISOLMP() if iso=CISO
    fetchWeather(lat, lon),
  ]);

  const eiaData = eia.status === "fulfilled" ? eia.value : null;
  const ercotData = ercot.status === "fulfilled" ? ercot.value : null;
  const pricingData = pricing.status === "fulfilled" ? pricing.value : null;
  const weatherData = weather.status === "fulfilled" ? weather.value : null;

  const frequency_hz = ercotData?.frequency_hz ?? 60.0;
  const demand_mw = eiaData?.demand_mw ?? ercotData?.demand_mw ?? 0;
  const net_generation_mw = eiaData?.net_generation_mw ?? 0;
  const reserve_margin_pct =
    demand_mw > 0
      ? ((net_generation_mw - demand_mw) / demand_mw) * 100
      : 0;

  const realtime: GridRealtimeState = {
    timestamp_utc: eiaData?.timestamp_utc ?? nowISO(),
    balancing_authority_code: iso,
    nerc_region: iso === "ERCO" ? "TRE" : iso === "CISO" ? "WECC" : "RF",
    demand_mw,
    load_forecast_mw: eiaData?.load_forecast_mw ?? 0,
    load_deviation_mw: demand_mw - (eiaData?.load_forecast_mw ?? demand_mw),
    net_generation_mw,
    generation_by_fuel: eiaData?.generation_by_fuel ?? {
      natural_gas: 0, coal: 0, nuclear: 0, wind: 0,
      solar: 0, hydro: 0, storage: 0, other: 0,
    },
    net_interchange_mw: eiaData?.net_interchange_mw ?? 0,
    frequency_hz,
    reserve_margin_pct,
    severity: calcSeverity(frequency_hz, reserve_margin_pct),
  };

  return {
    realtime,
    pricing: pricingData ?? {
      timestamp_utc: nowISO(),
      balancing_authority_code: iso,
      lmp_rt_usd_per_mwh: 0,
      lmp_da_usd_per_mwh: 0,
      lmp_congestion_component: 0,
      lmp_loss_component: 0,
      lmp_energy_component: 0,
    },
    weather: weatherData ?? {
      timestamp_utc: nowISO(),
      latitude: lat,
      longitude: lon,
      temperature_c: 0,
      wind_speed_ms: 0,
      wind_direction_deg: 0,
      solar_irradiance_wm2: 0,
      precipitation_mm: 0,
    },
  };
}
