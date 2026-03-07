import { useState, useEffect, useCallback } from "react";
import { UsageStats, PipelineRun } from "../types/metrics.js";
import { fetchMetrics, fetchRuns } from "../services/api.js";

interface MetricsState {
  stats: UsageStats | null;
  runs: PipelineRun[];
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
}

export function useMetrics(autoRefreshMs = 0) {
  const [state, setState] = useState<MetricsState>({
    stats: null,
    runs: [],
    loading: false,
    error: null,
    lastRefreshed: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [stats, runs] = await Promise.all([fetchMetrics(), fetchRuns(50)]);
      setState({ stats, runs, loading: false, error: null, lastRefreshed: new Date() });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load metrics",
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefreshMs) return;
    const id = setInterval(refresh, autoRefreshMs);
    return () => clearInterval(id);
  }, [autoRefreshMs, refresh]);

  return { ...state, refresh };
}
