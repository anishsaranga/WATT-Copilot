// ============================================================
// /app/api/grid/route.ts  — Next.js App Router API route
//
// Proxies all external API calls server-side (keeps keys safe,
// avoids CORS on CAISO/ERCOT endpoints).
//
// GET /api/grid?iso=ERCO&lat=30.27&lon=-97.74
// Returns: DashboardSnapshot (without incident — that's mock only)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { fetchDashboardLive } from "../../../src/api/fetchers";
import type { ISOCode } from "../../../src/types/grid";

export const runtime = "nodejs";        // needs Node for env vars
export const revalidate = 0;            // always fresh

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const iso = (searchParams.get("iso") ?? "ERCO") as ISOCode;
  const lat = parseFloat(searchParams.get("lat") ?? "30.2672");
  const lon = parseFloat(searchParams.get("lon") ?? "-97.7431");

  try {
    const data = await fetchDashboardLive(iso, lat, lon);

    return NextResponse.json(
      { ...data, incident: null },
      {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("[/api/grid]", err);
    return NextResponse.json(
      { error: "Failed to fetch grid data" },
      { status: 500 }
    );
  }
}
