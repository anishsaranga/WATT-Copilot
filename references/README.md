# Grid Dashboard — API Reference & Setup

## Env vars (.env.local)

```
EIA_API_KEY=          # free at https://www.eia.gov/opendata/
ERCOT_API_KEY=        # free at https://developer.ercot.com/
```

PJM and Open-Meteo need no key.

---

## Live API Endpoints → Expected Response Shapes

### 1. EIA v2 — Demand + Generation by Fuel
**URL**: `https://api.eia.gov/v2/electricity/rto/region-data/data/`
**Granularity**: Hourly (~1h lag)
**Key params**: `respondent=ERCO`, `type=D|NG|TI|DF`, `api_key=`

```json
{
  "response": {
    "data": [
      {
        "period": "2024-01-15T14",
        "respondent": "ERCO",
        "respondent-name": "Electric Reliability Council of Texas, Inc.",
        "type": "D",
        "type-name": "Demand",
        "value": "52400",
        "value-units": "megawatthours"
      }
    ]
  }
}
```

**type codes**:
- `D`  = Demand (actual load MW)
- `DF` = Demand Forecast
- `NG` = Net Generation
- `TI` = Total Interchange

**Fuel type endpoint**: `.../rto/fuel-type-data/data/`
```json
{
  "response": {
    "data": [
      {
        "period": "2024-01-15T14",
        "respondent": "ERCO",
        "fueltype": "WND",
        "type-name": "Net generation",
        "value": "13600",
        "value-units": "megawatthours"
      }
    ]
  }
}
```

**fueltype codes**: `NG`=gas, `SUN`=solar, `WND`=wind, `WAT`=hydro, `NUC`=nuclear, `COL`=coal, `OTH`=other, `STO`=storage

---

### 2. ERCOT API — System Frequency + Real-time Load
**URL**: `https://api.ercot.com/api/public-reports/np6-345-cd/act_sys_load_by_wzn`
**Granularity**: 5-minute real-time
**Header**: `Ocp-Apim-Subscription-Key: {ERCOT_API_KEY}`

```json
{
  "_meta": {
    "version": "1.0",
    "status": "SUCCESS",
    "request_timestamp": "2024-01-15T14:05:00Z"
  },
  "data": [
    {
      "timestamp": "2024-01-15T14:00:00-06:00",
      "deliveryDate": "2024-01-15",
      "hourEnding": "14:00",
      "systemLoad": "52400.5",
      "windOutput": "13620.8",
      "solarOutput": "1240.2",
      "dcTieFlowTotal": "0.0"
    }
  ]
}
```

**Frequency endpoint**: `.../np4-187-cd/nprr_syststatus`
```json
{
  "data": [
    {
      "timestamp": "2024-01-15T14:05:00-06:00",
      "systemFrequency": "59.98",
      "systemLoad": "52400.5"
    }
  ]
}
```

---

### 3. PJM DataMiner2 — Real-time LMP
**URL**: `https://dataminer2.pjm.com/feed/rt_unverified_fivemin_lmps/fields`
**Granularity**: 5-minute
**Auth**: Free account (session cookie) — no API key in header

```json
[
  {
    "datetime_beginning_utc": "2024-01-15 14:00:00",
    "datetime_beginning_ept": "2024-01-15 09:00:00",
    "pnode_id": 1,
    "pnode_name": "PJM RTO",
    "voltage": 0,
    "equipment": "",
    "type": "ZONE",
    "zone": "PJM RTO",
    "total_lmp_rt": 42.85,
    "energy_price": 40.10,
    "congestion_price": 1.95,
    "loss_price": 0.80
  }
]
```

**Day-ahead**: `.../feed/da_hrl_lmps/fields`
```json
[
  {
    "datetime_beginning_utc": "2024-01-15 14:00:00",
    "pnode_name": "PJM RTO",
    "total_lmp_da": 38.50,
    "energy_price_da": 36.20,
    "congestion_price_da": 1.50,
    "loss_price_da": 0.80
  }
]
```

---

### 4. Open-Meteo — Weather Context
**URL**: `https://api.open-meteo.com/v1/forecast`
**Granularity**: Hourly. Free, no key.

```json
{
  "latitude": 30.27,
  "longitude": -97.74,
  "timezone": "UTC",
  "hourly": {
    "time": ["2024-01-15T00:00", "2024-01-15T01:00"],
    "temperature_2m": [22.4, 21.8],
    "wind_speed_10m": [8.4, 9.1],
    "wind_direction_10m": [315, 320],
    "direct_normal_irradiance": [0, 0],
    "precipitation": [0.2, 0.0]
  }
}
```

---

## Unified DashboardSnapshot shape (live + mock share this)

```typescript
{
  realtime: {
    timestamp_utc: string,              // ISO 8601
    balancing_authority_code: ISOCode,  // "ERCO" | "CISO" | "PJM" | ...
    nerc_region: NERCRegion,            // "TRE" | "WECC" | "RF" | ...
    demand_mw: number,
    load_forecast_mw: number,
    load_deviation_mw: number,          // demand - forecast
    net_generation_mw: number,
    generation_by_fuel: {
      natural_gas: number,
      coal: number,
      nuclear: number,
      wind: number,
      solar: number,
      hydro: number,
      storage: number,
      other: number
    },
    net_interchange_mw: number,         // positive = import
    frequency_hz: number,               // 60.0 nominal
    reserve_margin_pct: number,
    severity: "normal" | "warning" | "critical"
  },
  pricing: {
    timestamp_utc: string,
    balancing_authority_code: ISOCode,
    lmp_rt_usd_per_mwh: number,
    lmp_da_usd_per_mwh: number,
    lmp_congestion_component: number,
    lmp_loss_component: number,
    lmp_energy_component: number
  },
  weather: {
    timestamp_utc: string,
    latitude: number,
    longitude: number,
    temperature_c: number,
    wind_speed_ms: number,
    wind_direction_deg: number,
    solar_irradiance_wm2: number,
    precipitation_mm: number
  },
  incident: null | {
    incident_id: string,
    event_date: string,                 // YYYY-MM-DD
    event_time_local: string,           // HH:MM
    event_type: string,                 // OE-417 raw type
    area_affected: string,
    load_loss_mw: number | null,
    customers_affected: number | null,
    frequency_hz_at_event: number | null,
    restoration_datetime: string | null,
    duration_hours: number | null,
    severity: "normal" | "warning" | "critical",
    narrative: string
  }
}
```

---

## File structure

```
src/
├── types/
│   └── grid.ts              ← all interfaces
├── api/
│   ├── fetchers.ts          ← live API functions
│   ├── useGridDashboard.ts  ← React hook (live + mock toggle)
│   └── route.ts             ← Next.js /app/api/grid/route.ts
└── mock/
    └── incident-frames.ts   ← 7-frame Winter Storm Uri dataset
```

---

## Frontend toggle pattern

```tsx
const { snapshot, isMock, startMock, stopMock } = useGridDashboard();

// In your component:
<button onClick={isMock ? stopMock : startMock}>
  {isMock ? "← Back to Live" : "⚡ Mock Incident"}
</button>

// snapshot.incident is null during live mode,
// populated with OE-417 fields during mock mode.
```
