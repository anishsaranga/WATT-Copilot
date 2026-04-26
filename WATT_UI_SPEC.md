# WATT — Grid Co-Pilot UI Specification

## For: Coding Agent Implementation Guide

---

## 1. Design Philosophy

### Aesthetic: "VSCode meets Bloomberg Terminal meets Mission Control"

Think of a **dark IDE-inspired control surface** — the entire app feels like an operator's cockpit, not a dashboard. The left side is the "editor area" with switchable tabs (like VSCode's file tabs). The right side is a **docked co-pilot chat panel** (like GitHub Copilot Chat in VSCode's sidebar) that is **always contextually aware** but **collapsible** via a drag handle or toggle button.

### Design DNA

- **NOT** a generic admin dashboard. This is a **mission-critical control room interface**.
- Dark theme by default — operators work at 2am. A muted dark base (`#0A0E17`) with electric accents.
- Primary accent: `#00F0FF` (electric cyan) — for live data, active states, frequency indicators.
- Alert accent: `#FF3B3B` → `#FF6B35` gradient — for warnings and critical states.
- Success accent: `#00E676` — for approved actions, stable metrics.
- Ambient accent: `#6366F1` (indigo) — for AI-generated content, co-pilot elements.
- Typography: `JetBrains Mono` for data/metrics, `Geist Sans` for UI text, `Geist Mono` for code/logs.
- All panels have subtle `backdrop-blur` and glass-morphism borders (`1px solid rgba(255,255,255,0.06)`).
- Micro-glow effects on live data points — subtle box-shadows with accent colors that pulse.

### Key Visual Signatures

1. **The Frequency Pulse**: A subtle CSS animation on the top bar frequency readout — a soft glow that "breathes" at the current grid frequency rhythm.
2. **Token Streaming Effect**: Co-pilot text appears character-by-character with a blinking cursor, like a terminal — not a chat bubble.
3. **Status Rail**: A thin 2px strip at the very top of the viewport (like VSCode's status bar) that shifts color based on grid state: green (nominal) → amber (watch) → red (critical). It uses a gradient animation that sweeps left-to-right.
4. **Panel Dividers**: Resizable panes with drag handles, exactly like VSCode split editors.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 14+** (App Router) |
| Styling | **Tailwind CSS v4** + CSS variables for theming |
| Components | **shadcn/ui** (dark theme, customized) |
| Animations | **Framer Motion** (`motion` package) |
| Charts | **Recharts** for time-series + **D3.js** for the frequency gauge and custom visuals |
| Icons | **Lucide React** |
| State | **Zustand** for global state (grid data, panel states, active tab) |
| Real-time | **Server-Sent Events (SSE)** for streaming co-pilot output + live data |
| Layout | **react-resizable-panels** for VSCode-style split panes |
| Date/Time | **date-fns** |
| PDF Generation | **@react-pdf/renderer** for handoff brief export |

---

## 3. Global Layout Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│ STATUS RAIL (2px gradient bar — green/amber/red based on grid state)    │
├──────────────────────────────────────────────────────────────────────────┤
│ TOP BAR — Live Metrics Strip                                           │
│ [Hz: 60.001] [Load: 42,318 MW] [Forecast Δ: +2.1%] [Alarms: 3] [⏰]  │
├────────────────────────────────────────────────┬─────────────────────────┤
│                                                │                        │
│  LEFT PANEL (tabbed, resizable)                │  RIGHT PANEL            │
│                                                │  (Co-Pilot Chat)        │
│  ┌──────────────────────────────────────────┐  │                        │
│  │ [Grid Monitor] [Incidents] [Shift Log]   │  │  Collapsible via       │
│  │ [Playbook] [Analytics] [Settings]        │  │  drag handle or        │
│  │                                          │  │  toggle button         │
│  │  ← Tab content renders here →            │  │                        │
│  │                                          │  │  Always present,       │
│  │                                          │  │  context-aware         │
│  │                                          │  │                        │
│  │                                          │  │                        │
│  └──────────────────────────────────────────┘  │                        │
│                                                │                        │
├────────────────────────────────────────────────┴─────────────────────────┤
│ BOTTOM STRIP — Shift Timeline + Quick Actions                           │
│ [Event 1] → [Event 2] → [Event 3] → ...        [Generate Handoff Brief]│
└──────────────────────────────────────────────────────────────────────────┘
```

### Panel Behavior

- **Left Panel**: Occupies ~65-75% of viewport width. Contains all tabbed views. Tabs render along the top like VSCode file tabs — horizontally scrollable if many.
- **Right Panel (Co-Pilot)**: Occupies ~25-35% width. Has a **drag handle** on its left border for resizing. Has a **collapse button** (chevron icon) that slides it off-screen and gives 100% width to the left panel. When collapsed, a small floating "WATT" pill button appears at the right edge to re-open it.
- **Bottom Strip**: Fixed height (~60px), always visible. Horizontal timeline of shift events.
- **Top Bar**: Fixed height (~48px), always visible. Live metrics with real-time updates.

Use `react-resizable-panels` (`<PanelGroup>`, `<Panel>`, `<PanelResizeHandle>`) for the left/right split.

---

## 4. Top Bar — Live Metrics Strip

**File**: `components/top-bar/MetricsStrip.tsx`

### Layout

A horizontally arranged set of metric "chips" — each is a compact card with:
- A label (small, muted text)
- A value (large, monospace, accent-colored)
- A micro-sparkline (last 30 data points, ~60px wide, inline)
- A trend indicator (▲/▼ with color)

### Metrics to Display

| Metric | Label | Format | Source | Color Logic |
|---|---|---|---|---|
| Grid Frequency | `FREQ` | `60.001 Hz` | CAISO | Green if 59.95–60.05, amber if ±0.05–0.1, red if beyond |
| Current Load | `LOAD` | `42,318 MW` | EIA | Neutral cyan |
| Forecast Deviation | `Δ FORECAST` | `+2.1%` | Calculated | Green if <3%, amber 3-5%, red >5% |
| Active Alarms | `ALARMS` | `3` | Internal | Badge with count, red pulse animation if >0 |
| Data Center Load | `DC LOAD` | `1,247 MW` | EIA/CAISO | Amber if >800 MW, red if >1200 MW |
| Time | `SHIFT` | `02:47 AM EST · Night Shift` | System | Muted white |

### Animations

- Each metric value uses `framer-motion`'s `AnimatePresence` + `layoutId` for smooth number transitions.
- The frequency value has a subtle `text-shadow` glow animation (`@keyframes pulse-glow`) that breathes every 2 seconds.
- Alarm count badge pulses with a `ring` animation when count > 0.

### Interaction

- Clicking any metric chip opens a **detail popover** (shadcn `Popover`) with a larger chart of the last 1 hour of that metric.
- The entire top bar has a very subtle gradient background that shifts hue based on overall grid health status.

---

## 5. Left Panel — Tabbed Views

### Tab Bar Design

Styled like VSCode file tabs:
- Horizontal tab bar with each tab showing an icon + label.
- Active tab has a brighter background, a top border accent line (2px, cyan), and the label is white.
- Inactive tabs are muted, with hover states.
- Tabs can be reordered via drag (optional, stretch goal).
- Each tab has a subtle `framer-motion` `layoutId` underline animation when switching.

### Tab Definitions

---

### 5.1 Tab: Grid Monitor (Default Active)

**Icon**: `Activity` (Lucide)
**Purpose**: Real-time grid overview — the operator's primary view during normal operations.

#### Layout (2-column grid inside the tab)

```
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
│  Frequency Gauge         │  Load Curve Chart        │
│  (D3 radial gauge)       │  (Recharts area chart)   │
│                          │                          │
├──────────────────────────┴──────────────────────────┤
│                                                      │
│  Regional Load Heatmap / Treemap                     │
│  (D3 treemap of balancing authorities)               │
│                                                      │
├──────────────────────────┬──────────────────────────┤
│  Alarm Feed              │  Weather Overlay          │
│  (Scrollable list,       │  (Map + storm cells)      │
│   newest on top)         │                           │
└──────────────────────────┴──────────────────────────┘
```

#### Components

**A. Frequency Gauge** (`components/grid-monitor/FrequencyGauge.tsx`)
- D3.js radial/arc gauge centered on 60.00 Hz.
- The needle animates smoothly with `framer-motion` spring physics.
- Arc segments: green zone (59.95–60.05), amber (59.90–59.95 & 60.05–60.10), red (beyond).
- Current value displayed large in the center in `JetBrains Mono`.
- A "deviation" label below: `Δ +0.003 Hz`.
- Background has a subtle radial gradient glow matching the current zone color.

**B. Load Curve Chart** (`components/grid-monitor/LoadCurve.tsx`)
- Recharts `AreaChart` showing:
  - Actual load (solid cyan line with gradient fill below).
  - Forecasted load (dashed white line).
  - The gap between them shaded in amber/red when deviation is high.
- X-axis: time (last 6 hours, 5-min intervals). Y-axis: MW.
- Tooltip on hover shows exact values + deviation %.
- Animated entry: the area "draws in" from left to right on mount using `framer-motion`.

**C. Regional Load Treemap** (`components/grid-monitor/RegionalTreemap.tsx`)
- D3 treemap showing balancing authorities sized by current load.
- Color intensity mapped to load vs. capacity ratio.
- Clicking a region filters the load curve and alarm feed to that region.
- Smooth `framer-motion` `layout` transitions when data updates.

**D. Alarm Feed** (`components/grid-monitor/AlarmFeed.tsx`)
- Scrollable vertical list of active alarms, newest first.
- Each alarm card shows: timestamp, severity icon (colored dot), source region, description.
- New alarms animate in from the top with `framer-motion` `AnimatePresence` + slide-down.
- Critical alarms have a left border glow (red) and subtle background pulse.
- Clicking an alarm sends context to the Co-Pilot panel and triggers DIAGNOSE.

**E. Weather Overlay** (`components/grid-monitor/WeatherOverlay.tsx`)
- Simplified US map (SVG or lightweight map component) showing:
  - Storm cell positions (animated radar-like circles).
  - Temperature anomaly zones (colored overlays).
  - Wind icons with speed labels.
- Data from NOAA API.
- Compact view — not a full mapping solution, more of a "situational awareness glance."

---

### 5.2 Tab: Incidents

**Icon**: `AlertTriangle` (Lucide)
**Purpose**: Browse, search, and add incidents. View NERC historical database + operator-logged events.

#### Layout

```
┌──────────────────────────────────────────────────────┐
│  Search + Filter Bar                                  │
│  [🔍 Search incidents...] [Severity ▼] [Date ▼] [+]  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Incidents Table (shadcn DataTable)                    │
│  ┌────┬──────────┬────────┬──────────┬───────┬─────┐ │
│  │ ID │ Date     │ Type   │ Region   │ Sev.  │ ... │ │
│  ├────┼──────────┼────────┼──────────┼───────┼─────┤ │
│  │    │          │        │          │       │     │ │
│  │  (rows with hover highlight, click to expand)  │ │
│  └────┴──────────┴────────┴──────────┴───────┴─────┘ │
│                                                       │
├──────────────────────────────────────────────────────┤
│  Expanded Incident Detail (slide-down panel)          │
│  - Full narrative                                     │
│  - Operator actions taken                             │
│  - Outcome + recovery time                            │
│  - Similarity score to current conditions             │
│  - "Send to Co-Pilot" button                          │
└──────────────────────────────────────────────────────┘
```

#### Components

**A. Search & Filter Bar** (`components/incidents/IncidentFilters.tsx`)
- Full-text search input (shadcn `Input` with search icon).
- Filter dropdowns (shadcn `Select`): Severity (Critical/Major/Minor/Info), Date range, Event type (Frequency, Voltage, Overload, Weather, Cyber), Region/BA.
- **"+ Add Incident"** button (shadcn `Button`, primary accent) — opens a modal/drawer.

**B. Incidents Data Table** (`components/incidents/IncidentTable.tsx`)
- shadcn `DataTable` with sortable columns:
  - `ID` — NERC event ID or internal ID
  - `Date` — formatted with date-fns
  - `Type` — categorized with colored badges
  - `Region` — balancing authority
  - `Severity` — colored dot indicator (red/amber/yellow/blue)
  - `Duration` — how long the event lasted
  - `Load Impact` — MW affected
  - `Status` — Resolved / Under Review / Active
- Rows animate in with staggered `framer-motion` entrance.
- Row hover shows a subtle glow on the left border.
- Clicking a row expands an inline detail panel below it.

**C. Incident Detail Panel** (`components/incidents/IncidentDetail.tsx`)
- `framer-motion` `AnimatePresence` slide-down expansion.
- Sections:
  - **Narrative**: Full text description of the event.
  - **Actions Taken**: Bulleted list of operator actions with timestamps.
  - **Outcome**: Resolution description + metrics (recovery time, load restored).
  - **Similarity Score**: If current grid conditions exist, show cosine similarity to this incident (from ChromaDB). Displayed as a colored badge.
  - **"Analyze with WATT"** button: Sends this incident's context to the co-pilot for deeper analysis.
- Timeline visualization of the event's progression (small horizontal timeline with key moments).

**D. Add Incident Modal** (`components/incidents/AddIncidentModal.tsx`)
- shadcn `Dialog` or `Sheet` (slide-in drawer from right).
- Form fields:
  - Event type (select)
  - Severity (select)
  - Region/BA affected (select)
  - Date & time (date-time picker)
  - Load impact MW (number input)
  - Description (textarea)
  - Actions taken (textarea)
  - Outcome (textarea)
  - Attach files (file upload zone — for PDFs, logs)
- Submit button with loading state.
- On submit: incident is embedded and added to ChromaDB + displayed in table.

---

### 5.3 Tab: Shift Log

**Icon**: `ClipboardList` (Lucide)
**Purpose**: Everything that happened this shift. Operator decisions, WATT recommendations, alarms acknowledged. The "session memory" view.

#### Layout

```
┌──────────────────────────────────────────────────────┐
│  Shift Header                                         │
│  Night Shift · Started 10:00 PM · Operator: Maria     │
│  [Export Shift Log] [Generate Handoff Brief]          │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Timeline View (vertical, scrollable)                 │
│                                                       │
│  ● 10:02 PM — Shift started, 3 open watches           │
│  │                                                    │
│  ● 10:15 PM — WATT: Detected load ramp, no action    │
│  │             needed                                 │
│  ● 11:47 PM — Alarm: Frequency deviation +0.04 Hz    │
│  │             [Acknowledged by Maria]                │
│  ● 12:03 AM — WATT recommendation: Reduce output     │
│  │             Unit 7 by 50 MW                        │
│  │             [✅ Approved by Maria at 12:04 AM]     │
│  ● 01:22 AM — Manual note added: "Watching TX..."    │
│  │                                                    │
│  ...                                                  │
│                                                       │
├──────────────────────────────────────────────────────┤
│  Quick Add: [+ Add Note] [+ Log Decision] [+ Watch]  │
└──────────────────────────────────────────────────────┘
```

#### Components

**A. Shift Header** (`components/shift-log/ShiftHeader.tsx`)
- Current shift info: shift name, start time, operator name, elapsed time.
- Two action buttons:
  - **Export Shift Log**: Downloads a structured JSON/CSV of all events.
  - **Generate Handoff Brief**: Triggers Claude to summarize the entire shift into a PDF. Shows a loading spinner with streaming progress, then offers download.

**B. Shift Timeline** (`components/shift-log/ShiftTimeline.tsx`)
- Vertical timeline with connected dots and lines (left-aligned).
- Each event node is color-coded by type:
  - Blue dot: System/informational
  - Cyan dot: WATT AI action/recommendation
  - Amber dot: Alarm
  - Green dot: Operator approval/action
  - White dot: Manual note
  - Red dot: Critical event
- Events animate in with `framer-motion` stagger.
- Each event card is expandable — click to see full details.
- WATT recommendations show inline: the recommendation text + Approve/Modify buttons if still pending.
- Approved decisions show a green checkmark with operator ID and timestamp.

**C. Quick Add Actions** (`components/shift-log/QuickAdd.tsx`)
- Three buttons at the bottom:
  - **Add Note**: Opens an inline text input to type a free-form note (logged with timestamp).
  - **Log Decision**: Opens a small form: decision description, rationale, affected units.
  - **Add Watch**: Opens a form to create a "watch item" — something the operator wants to keep an eye on (e.g., "Watch TX-NM interchange if wind drops below 15mph").
- Watch items appear in the timeline with a recurring "eye" icon and can be dismissed.

---

### 5.4 Tab: Playbook

**Icon**: `BookOpen` (Lucide)
**Purpose**: Searchable library of standard operating procedures (SOPs) and WATT-generated response templates. The "institutional knowledge" repository.

#### Layout

```
┌──────────────────────────────────────────────────────┐
│  Search Bar                                           │
│  [🔍 Search playbooks... e.g. "frequency excursion"]  │
├──────────────────────────────────────────────────────┤
│  Category Cards (horizontal scroll or grid)           │
│  [Frequency] [Voltage] [Overload] [Weather] [Cyber]  │
│  [Data Center] [Renewable Intermittency] [Cascading] │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Playbook List                                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 📋 Frequency Excursion > 0.05 Hz                │ │
│  │    Steps: 8 · Last used: 3 days ago             │ │
│  │    Confidence from WATT: 91%                    │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 📋 Data Center UPS Transfer Response            │ │
│  │    Steps: 6 · Last used: 12 days ago            │ │
│  │    Confidence from WATT: 87%                    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Expanded Playbook View:                              │
│  Step 1 → Step 2 → Step 3 (visual flowchart)         │
│  [Execute with WATT] [Edit] [Duplicate]               │
└──────────────────────────────────────────────────────┘
```

#### Components

**A. Category Cards** (`components/playbook/CategoryCards.tsx`)
- Horizontal scrollable row of category filter chips.
- Each has an icon, label, and count of playbooks in that category.
- Active filter has a filled background with accent color.
- `framer-motion` `whileHover` scale animation.

**B. Playbook List** (`components/playbook/PlaybookList.tsx`)
- Card-based list of SOPs.
- Each card shows: title, step count, last used date, WATT confidence score (how well WATT can assist with this playbook).
- Click to expand into full playbook view.

**C. Playbook Detail** (`components/playbook/PlaybookDetail.tsx`)
- Full SOP rendered as a **visual step flowchart** — not just a text list.
- Each step is a card connected by arrows/lines.
- Steps can have: description, expected duration, critical warnings, related NERC precedents.
- **"Execute with WATT"** button: Loads this playbook into the co-pilot as a guided workflow. WATT will walk through each step, monitoring grid state at each stage.
- **"Edit"** button: Opens an editable view to modify steps (for operators to update SOPs).

---

### 5.5 Tab: Analytics

**Icon**: `BarChart3` (Lucide)
**Purpose**: Historical trends, operator performance metrics, grid health scores, and WATT accuracy tracking.

#### Layout

```
┌──────────────────────────────────────────────────────┐
│  Date Range Selector + Metric Toggles                 │
│  [Last 24h] [7d] [30d] [90d] [Custom]               │
├──────────────────────────────┬────────────────────────┤
│                              │                        │
│  Grid Health Score           │  WATT Accuracy          │
│  (Large radial chart)        │  (Donut chart)          │
│  Score: 94/100               │  Correct: 89%           │
│                              │                        │
├──────────────────────────────┴────────────────────────┤
│                                                       │
│  Response Time Trends (Line chart)                    │
│  Avg time from alarm → operator action                │
│                                                       │
├──────────────────────────────┬────────────────────────┤
│  Incident Frequency          │  Load Forecast          │
│  (Bar chart by type)         │  Accuracy (area chart)  │
│                              │                        │
├──────────────────────────────┴────────────────────────┤
│  Operator Decision Log (summary table)                │
│  Approved / Modified / Rejected breakdown             │
└──────────────────────────────────────────────────────┘
```

#### Components

**A. Grid Health Score** (`components/analytics/GridHealthScore.tsx`)
- Large D3 radial progress chart.
- Score is a composite of: frequency stability, load forecast accuracy, alarm resolution speed, no cascading events.
- Color transitions from red (0-40) → amber (40-70) → green (70-100).
- Animated on mount with `framer-motion` spring.

**B. WATT Accuracy Tracker** (`components/analytics/WATTAccuracy.tsx`)
- Donut chart showing: recommendations that matched operator's final action (correct), modified by operator, rejected.
- Breakdown tooltip with counts.
- Trend line below showing accuracy over time.

**C. Response Time Chart** (`components/analytics/ResponseTime.tsx`)
- Recharts line chart: time (X) vs. average minutes from alarm to action (Y).
- Overlay lines: with WATT assistance vs. without (historical baseline).
- Demonstrates WATT's impact on response time.

**D. Incident Frequency Chart** (`components/analytics/IncidentFrequency.tsx`)
- Stacked bar chart by incident type over time.
- Helps identify patterns (e.g., more frequency events in summer).

**E. Decision Log Summary** (`components/analytics/DecisionSummary.tsx`)
- Simple shadcn `Table` showing aggregate stats per shift/day.
- Columns: Date, Shift, Operator, Total Decisions, Approved, Modified, Rejected, Avg Response Time.

---

### 5.6 Tab: Settings

**Icon**: `Settings` (Lucide)
**Purpose**: Configure WATT behavior, data sources, alerting thresholds, operator profiles.

#### Sections (accordion-style using shadcn `Accordion`)

1. **WATT Configuration**
   - Confidence threshold for auto-escalation (slider, default 70%)
   - Model selection (dropdown — future-proofing)
   - Streaming speed preference
   - Enable/disable specific agents (MONITOR, DIAGNOSE, ESCALATE, DRAFT)

2. **Alert Thresholds**
   - Frequency deviation threshold (Hz input)
   - Load deviation threshold (% input)
   - Data center load warning threshold (MW input)
   - Alarm flood threshold (count/minute)

3. **Data Sources**
   - CAISO API status (connected/disconnected indicator)
   - EIA API key management
   - NOAA API key management
   - ChromaDB status + document count
   - Last data refresh timestamps

4. **Operator Profile**
   - Name, shift assignment, contact info
   - Notification preferences
   - Custom watchlist items

5. **Display Preferences**
   - Theme (dark/midnight/OLED)
   - Metric unit preferences
   - Chart animation toggle
   - Co-pilot panel default width

---

## 6. Right Panel — WATT Co-Pilot

**This panel is architecturally isolated from the left panel tabs.** It persists across all tab switches. It is the operator's conversational interface with WATT.

### File Structure: `components/copilot/`

### Layout

```
┌─────────────────────────────┐
│ ◀ WATT Co-Pilot        [─]  │  ← Header with collapse button
├─────────────────────────────┤
│  Status: ● Monitoring       │  ← Agent status indicator
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ WATT                  │  │
│  │ Monitoring grid.      │  │
│  │ Frequency nominal at  │  │
│  │ 60.002 Hz. No action  │  │
│  │ required.             │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ ⚠ WATT — ALERT        │  │  ← Alert cards are styled differently
│  │ Frequency excursion   │  │
│  │ detected: 60.047 Hz   │  │
│  │                       │  │
│  │ Retrieving similar    │  │
│  │ incidents...          │  │  ← Streaming text with cursor
│  │                       │  │
│  │ ┌─────────────────┐   │  │
│  │ │ Precedent #1     │   │  │  ← Inline precedent cards
│  │ │ Odessa 2022 IBR  │   │  │
│  │ │ Similarity: 91%  │   │  │
│  │ └─────────────────┘   │  │
│  │                       │  │
│  │ Recommendation:       │  │
│  │ Remove shunt cap      │  │
│  │ banks. Confidence 84% │  │
│  │                       │  │
│  │ ┌────────┬────────┐   │  │
│  │ │Approve │ Modify │   │  │  ← Action buttons
│  │ └────────┴────────┘   │  │
│  └───────────────────────┘  │
│                             │
│  ... (scrollable history)   │
│                             │
├─────────────────────────────┤
│ [Ask WATT something...]    │  ← Input field
│                       [⏎]  │
└─────────────────────────────┘
```

### Components

**A. Co-Pilot Header** (`components/copilot/CopilotHeader.tsx`)
- Title: "WATT Co-Pilot" with a small lightning bolt icon.
- Agent status indicator: colored dot + text:
  - Green `● Monitoring` — all agents idle, MONITOR polling.
  - Amber `● Analyzing` — DIAGNOSE active.
  - Cyan `● Drafting` — DRAFT generating recommendation.
  - Red `● ALERT` — critical situation detected.
- Collapse button (`ChevronRight` icon) to hide the panel.
- When collapsed, a floating pill on the right edge: small "WATT" button with the status color dot.

**B. Message Stream** (`components/copilot/MessageStream.tsx`)
- Scrollable message area. Auto-scrolls to bottom on new content.
- Message types (each has a distinct visual style):

  1. **System Message**: Muted text, small font. "Monitoring grid. All nominal."
  2. **Alert Message**: Amber/red left border, alert icon, bold header. Background has subtle pulsing glow.
  3. **Streaming Text**: Characters appear one by one with a blinking block cursor (`█`). Uses `framer-motion` for each character reveal. The cursor blinks at 530ms interval.
  4. **Precedent Card**: Inline card within a message. Shows: NERC event ID, date, similarity score (as a colored progress bar), short description, operator action taken, outcome. Animate in one by one with `framer-motion` stagger as ChromaDB results return.
  5. **Recommendation Card**: Distinct card with a gradient border (indigo → cyan). Shows:
     - Situation summary (1-2 sentences)
     - Recommended action (bold)
     - Confidence score (progress bar with % label)
     - Estimated recovery time
     - Load shed risk %
     - Customers at risk (formatted number)
     - **Approve** button (green, primary) + **Modify** button (outline)
  6. **Operator Response**: Right-aligned bubble (like a chat) showing what Maria typed or selected. Timestamp + operator ID.
  7. **Escalation Question**: When ESCALATE agent fires. Shows a focused question with selectable answer chips (shadcn `ToggleGroup`).

**C. Approve/Modify Flow**
- **Approve**: Click → brief animation (green checkmark sweep), logs operator ID + timestamp, recommendation card updates to "Approved ✓" state with green border, entry added to Shift Log.
- **Modify**: Click → recommendation card transforms into an editable form. Operator can adjust: the action text, add/remove steps, change parameters. Submit modified version → logged as "Modified" with diff visible.

**D. Input Bar** (`components/copilot/CopilotInput.tsx`)
- Text input with placeholder "Ask WATT something..."
- Send button (arrow icon) on the right.
- Supports:
  - Free-form questions ("What happened in Odessa 2022?")
  - Commands ("/diagnose", "/playbook frequency", "/handoff")
  - Context from left panel (e.g., clicking an alarm auto-populates context).
- `Shift+Enter` for newlines, `Enter` to send.

---

## 7. Bottom Strip — Shift Timeline

**File**: `components/bottom-strip/ShiftTimeline.tsx`

### Design

- Fixed at the bottom of the viewport, ~60px tall.
- Horizontal scrollable timeline showing events this shift as small nodes on a line.
- Each node: colored dot (matching the event type colors from Shift Log) + tiny label.
- Hovering a node shows a tooltip with event summary.
- Clicking a node scrolls the Shift Log tab to that event and switches to the Shift Log tab if not already active.
- Right side: **"Generate Handoff Brief"** button — prominent, styled as a special action button with a subtle gradient.

### Animation

- New events slide in from the right with `framer-motion`.
- The timeline line "grows" as events are added.
- Current time indicator is a pulsing dot at the rightmost position.

---

## 8. Theming System

### CSS Variables (defined in `globals.css`)

```css
:root {
  /* Base */
  --bg-primary: #0A0E17;
  --bg-secondary: #0F1419;
  --bg-tertiary: #151B25;
  --bg-elevated: #1A2233;
  --bg-hover: #1E2A3A;

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.16);

  /* Text */
  --text-primary: #E8ECF1;
  --text-secondary: #8B95A5;
  --text-muted: #4A5568;

  /* Accents */
  --accent-cyan: #00F0FF;
  --accent-cyan-dim: rgba(0, 240, 255, 0.15);
  --accent-red: #FF3B3B;
  --accent-red-dim: rgba(255, 59, 59, 0.15);
  --accent-amber: #FF6B35;
  --accent-amber-dim: rgba(255, 107, 53, 0.15);
  --accent-green: #00E676;
  --accent-green-dim: rgba(0, 230, 118, 0.15);
  --accent-indigo: #6366F1;
  --accent-indigo-dim: rgba(99, 102, 241, 0.15);

  /* Shadows & Glows */
  --glow-cyan: 0 0 20px rgba(0, 240, 255, 0.2);
  --glow-red: 0 0 20px rgba(255, 59, 59, 0.3);
  --glow-green: 0 0 20px rgba(0, 230, 118, 0.2);

  /* Glass */
  --glass-bg: rgba(15, 20, 25, 0.8);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 12px;
}
```

### Tailwind Config Extensions

```js
// tailwind.config.ts
extend: {
  colors: {
    grid: {
      bg: 'var(--bg-primary)',
      surface: 'var(--bg-secondary)',
      elevated: 'var(--bg-elevated)',
      border: 'var(--border-default)',
    },
    accent: {
      cyan: 'var(--accent-cyan)',
      red: 'var(--accent-red)',
      amber: 'var(--accent-amber)',
      green: 'var(--accent-green)',
      indigo: 'var(--accent-indigo)',
    }
  },
  fontFamily: {
    mono: ['JetBrains Mono', 'monospace'],
    sans: ['Geist Sans', 'sans-serif'],
  },
  animation: {
    'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
    'status-sweep': 'status-sweep 3s linear infinite',
    'cursor-blink': 'cursor-blink 530ms steps(1) infinite',
  }
}
```

---

## 9. File / Folder Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout — fonts, providers
│   ├── page.tsx                      # Main app shell — panels + top bar + bottom strip
│   └── globals.css                   # CSS variables, base styles, animations
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx              # Master layout: status rail + top bar + panels + bottom strip
│   │   ├── StatusRail.tsx            # 2px top status gradient bar
│   │   ├── PanelLayout.tsx           # Left/right resizable panel split
│   │   └── TabBar.tsx                # VSCode-style tab navigation for left panel
│   │
│   ├── top-bar/
│   │   ├── MetricsStrip.tsx          # Container for all metric chips
│   │   ├── MetricChip.tsx            # Individual metric: label, value, sparkline, trend
│   │   └── MetricPopover.tsx         # Expanded chart popover on click
│   │
│   ├── grid-monitor/
│   │   ├── GridMonitorTab.tsx        # Tab container — grid layout of sub-components
│   │   ├── FrequencyGauge.tsx        # D3 radial gauge
│   │   ├── LoadCurve.tsx             # Recharts area chart
│   │   ├── RegionalTreemap.tsx       # D3 treemap
│   │   ├── AlarmFeed.tsx             # Scrollable alarm list
│   │   └── WeatherOverlay.tsx        # Simplified weather map
│   │
│   ├── incidents/
│   │   ├── IncidentsTab.tsx          # Tab container
│   │   ├── IncidentFilters.tsx       # Search + filter bar
│   │   ├── IncidentTable.tsx         # shadcn DataTable
│   │   ├── IncidentDetail.tsx        # Expandable detail panel
│   │   └── AddIncidentModal.tsx      # Add incident form modal
│   │
│   ├── shift-log/
│   │   ├── ShiftLogTab.tsx           # Tab container
│   │   ├── ShiftHeader.tsx           # Shift info + export buttons
│   │   ├── ShiftTimeline.tsx         # Vertical event timeline
│   │   └── QuickAdd.tsx              # Add note / decision / watch buttons
│   │
│   ├── playbook/
│   │   ├── PlaybookTab.tsx           # Tab container
│   │   ├── CategoryCards.tsx         # Horizontal filter chips
│   │   ├── PlaybookList.tsx          # Card list of SOPs
│   │   └── PlaybookDetail.tsx        # Expanded SOP with flowchart
│   │
│   ├── analytics/
│   │   ├── AnalyticsTab.tsx          # Tab container
│   │   ├── GridHealthScore.tsx       # D3 radial score chart
│   │   ├── WATTAccuracy.tsx          # Donut chart
│   │   ├── ResponseTime.tsx          # Line chart
│   │   ├── IncidentFrequency.tsx     # Stacked bar chart
│   │   └── DecisionSummary.tsx       # Summary table
│   │
│   ├── settings/
│   │   └── SettingsTab.tsx           # Accordion-based settings
│   │
│   ├── copilot/
│   │   ├── CopilotPanel.tsx          # Full right panel container
│   │   ├── CopilotHeader.tsx         # Title + status + collapse button
│   │   ├── MessageStream.tsx         # Scrollable message area
│   │   ├── messages/
│   │   │   ├── SystemMessage.tsx     # Muted status message
│   │   │   ├── AlertMessage.tsx      # Warning/critical message
│   │   │   ├── StreamingText.tsx     # Character-by-character reveal
│   │   │   ├── PrecedentCard.tsx     # NERC incident similarity card
│   │   │   ├── RecommendationCard.tsx# Action card with Approve/Modify
│   │   │   ├── OperatorMessage.tsx   # Right-aligned operator input
│   │   │   └── EscalationQuestion.tsx# Clarifying question with chips
│   │   ├── CopilotInput.tsx          # Text input + send button
│   │   └── CollapsedPill.tsx         # Floating "WATT" reopen button
│   │
│   ├── bottom-strip/
│   │   ├── BottomStrip.tsx           # Container
│   │   ├── ShiftTimelineBar.tsx      # Horizontal event timeline
│   │   └── HandoffButton.tsx         # Generate Handoff Brief button
│   │
│   └── shared/
│       ├── Sparkline.tsx             # Tiny inline chart for metric chips
│       ├── StatusDot.tsx             # Colored pulsing dot indicator
│       ├── ConfidenceBadge.tsx       # Styled confidence score display
│       ├── SeverityBadge.tsx         # Severity level colored badge
│       └── GlassCard.tsx            # Reusable glassmorphism card wrapper
│
├── stores/
│   ├── gridStore.ts                  # Zustand — grid metrics, alarms, frequency
│   ├── copilotStore.ts               # Zustand — messages, agent status, streaming state
│   ├── shiftStore.ts                 # Zustand — shift events, notes, decisions
│   ├── incidentStore.ts              # Zustand — incidents, filters, selected
│   └── uiStore.ts                    # Zustand — active tab, panel widths, collapsed state
│
├── hooks/
│   ├── useSSE.ts                     # Hook for Server-Sent Events connection
│   ├── useGridData.ts                # Hook for polling CAISO/EIA data
│   ├── useStreamingText.ts           # Hook for character-by-character text reveal
│   └── useResizablePanel.ts          # Hook for panel resize logic
│
├── lib/
│   ├── api.ts                        # API client for backend endpoints
│   ├── formatters.ts                 # Number/date/metric formatting utilities
│   ├── constants.ts                  # Thresholds, colors, agent names
│   └── types.ts                      # TypeScript interfaces for all data models
│
└── types/
    ├── grid.ts                       # GridMetrics, Alarm, BalancingAuthority
    ├── incident.ts                   # Incident, IncidentFilter, Precedent
    ├── copilot.ts                    # Message, Recommendation, AgentStatus
    ├── shift.ts                      # ShiftEvent, Note, Decision, WatchItem
    └── playbook.ts                   # Playbook, Step, Category
```

---

## 10. Animation Guidelines

### Framer Motion Patterns

```tsx
// Page/tab entrance — staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

// Metric value change
<motion.span
  key={value}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 10 }}
  transition={{ duration: 0.2 }}
>
  {formattedValue}
</motion.span>

// Panel collapse/expand
<motion.div
  animate={{ width: collapsed ? 0 : panelWidth }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>

// Alert card entrance
<motion.div
  initial={{ opacity: 0, x: 20, scale: 0.95 }}
  animate={{ opacity: 1, x: 0, scale: 1 }}
  transition={{ type: "spring", stiffness: 500, damping: 25 }}
/>

// Streaming cursor
<motion.span
  animate={{ opacity: [1, 0] }}
  transition={{ duration: 0.53, repeat: Infinity, ease: "steps(1)" }}
>
  █
</motion.span>
```

### CSS Animations (for always-on effects)

```css
@keyframes pulse-glow {
  0%, 100% { text-shadow: 0 0 8px var(--accent-cyan-dim); }
  50% { text-shadow: 0 0 16px var(--accent-cyan), 0 0 32px var(--accent-cyan-dim); }
}

@keyframes status-sweep {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes alarm-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-red-dim); }
  50% { box-shadow: 0 0 0 4px var(--accent-red-dim); }
}
```

---

## 11. Key Interaction Flows

### Flow 1: Alarm → WATT → Approve

1. New alarm arrives → Alarm Feed (Grid Monitor tab) shows new entry with slide-in animation
2. MONITOR agent detects anomaly → Co-Pilot status changes to `● Analyzing` (amber)
3. DIAGNOSE fires → Precedent cards stream into Co-Pilot one by one
4. DRAFT fires → Co-Pilot status changes to `● Drafting` (cyan), recommendation text streams character-by-character
5. Recommendation card renders with Approve/Modify buttons
6. Operator clicks Approve → green sweep animation, logged to Shift Log, bottom strip timeline adds node
7. Co-Pilot status returns to `● Monitoring` (green)

### Flow 2: Operator asks a question

1. Operator types in Co-Pilot input: "What similar events have we seen in ERCOT this summer?"
2. Input cleared, operator message appears right-aligned
3. WATT status: `● Analyzing`, streaming text begins
4. ChromaDB results surface as Precedent Cards inline
5. WATT summarizes findings with narrative text
6. Status returns to `● Monitoring`

### Flow 3: Shift Handoff

1. Operator clicks "Generate Handoff Brief" (bottom strip or Shift Log tab)
2. Modal appears with progress: "Compiling shift events... Summarizing with WATT... Generating PDF..."
3. PDF preview renders in modal
4. Download button appears
5. PDF includes: shift summary, all events, all decisions with rationale, open watches, WATT recommendations and their outcomes, grid state at handoff time

---

## 12. Responsive Behavior

- **Primary target**: 1920×1080 and above (control room monitors).
- **Minimum**: 1366×768 (laptop).
- At narrow widths (<1400px):
  - Co-pilot panel defaults to collapsed.
  - Grid Monitor switches from 2-column to single column.
  - Bottom strip becomes scrollable with smaller nodes.
- **No mobile layout** — this is a control room application. Show a "Desktop Required" message on mobile.

---

## 13. Accessibility Notes

- All interactive elements must be keyboard navigable.
- Alarm severity must not rely solely on color — use icons/shapes alongside.
- High contrast ratios maintained (WCAG AA minimum) despite dark theme.
- Screen reader labels for all chart elements.
- Focus rings visible on all interactive elements (styled with accent cyan, not browser default).
- `aria-live` regions for: alarm feed, co-pilot message stream, metric updates.

---

## 14. Mock Data Strategy

For development and demo:
- Create `lib/mock-data/` with generators for: grid metrics (sinusoidal frequency with random perturbations), alarm sequences, incident histories, shift events.
- Use a `NEXT_PUBLIC_DEMO_MODE=true` env var to switch between live API calls and mock data.
- Mock data should include the **July 10 2024 replay scenario** as a pre-built sequence that can be triggered via a "Run Demo" button in Settings.
- Time-series mock data should use realistic CAISO-scale values (35,000–48,000 MW load range, 59.95–60.05 Hz normal frequency).
