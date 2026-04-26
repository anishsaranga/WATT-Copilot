// ============================================================
// useGridDashboard — React hook
//
// Drop into any Next.js component. Manages live polling vs
// mock incident playback. Single toggle switches modes.
//
// Usage:
//   const { snapshot, isMock, startMock, stopMock } = useGridDashboard();
// ============================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DashboardSnapshot } from "../types/grid";
import { createMockFrameIterator } from "../mock/incident-frames";

const LIVE_POLL_MS = 10_000;   // 10s — EIA updates hourly but poll more for freq
const MOCK_FRAME_MS = 5_000;   // 5s per frame in mock mode

interface UseGridDashboardOptions {
  iso?: string;
  lat?: number;
  lon?: number;
}

interface UseGridDashboardReturn {
  snapshot: DashboardSnapshot | null;
  isLoading: boolean;
  error: string | null;
  isMock: boolean;
  mockFrameIndex: number;
  mockTotalFrames: number;
  startMock: () => void;
  stopMock: () => void;
  seekMock: (index: number) => void;
}

export function useGridDashboard(
  options: UseGridDashboardOptions = {}
): UseGridDashboardReturn {
  const { iso = "ERCO", lat = 30.2672, lon = -97.7431 } = options;

  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [mockFrameIndex, setMockFrameIndex] = useState(0);

  const mockIterator = useRef(createMockFrameIterator());
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -- Live fetcher (calls your Next.js API route) -----------------
  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/grid?iso=${iso}&lat=${lat}&lon=${lon}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DashboardSnapshot = await res.json();
      setSnapshot(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setIsLoading(false);
    }
  }, [iso, lat, lon]);

  // -- Mock stepper ------------------------------------------------
  const stepMock = useCallback(() => {
    const frame = mockIterator.current.next();
    setMockFrameIndex(mockIterator.current.currentIndex);
    setSnapshot(frame);
    setIsLoading(false);
    setError(null);
  }, []);

  // -- Start/stop live polling ------------------------------------
  const startLivePolling = useCallback(() => {
    fetchLive();
    liveIntervalRef.current = setInterval(fetchLive, LIVE_POLL_MS);
  }, [fetchLive]);

  const stopLivePolling = useCallback(() => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
  }, []);

  // -- Start/stop mock playback -----------------------------------
  const startMock = useCallback(() => {
    stopLivePolling();
    mockIterator.current.reset();
    stepMock(); // show first frame immediately
    setIsMock(true);
    mockIntervalRef.current = setInterval(stepMock, MOCK_FRAME_MS);
  }, [stopLivePolling, stepMock]);

  const stopMock = useCallback(() => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
    setIsMock(false);
    setIsLoading(true);
    startLivePolling();
  }, [startLivePolling]);

  const seekMock = useCallback(
    (index: number) => {
      const frame = mockIterator.current.seek(index);
      setMockFrameIndex(index);
      setSnapshot(frame);
    },
    []
  );

  // -- Bootstrap ---------------------------------------------------
  useEffect(() => {
    startLivePolling();
    return () => {
      stopLivePolling();
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
    };
  }, [startLivePolling, stopLivePolling]);

  return {
    snapshot,
    isLoading,
    error,
    isMock,
    mockFrameIndex,
    mockTotalFrames: mockIterator.current.totalFrames,
    startMock,
    stopMock,
    seekMock,
  };
}
