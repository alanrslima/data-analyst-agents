import { useState, useRef, useCallback } from "react";
import {
  AgentId,
  AgentStatus,
  PipelineResults,
  LogEntry,
} from "../types/index.js";
import { runPipeline } from "../services/api.js";

export type AgentStatuses = Record<AgentId, AgentStatus>;
export type AgentResultsMap = Record<string, unknown>;

const AGENT_IDS: AgentId[] = ["parser", "statistician", "analyst", "reporter"];

const initialStatuses = (): AgentStatuses =>
  Object.fromEntries(AGENT_IDS.map((id) => [id, "idle"])) as AgentStatuses;

export function usePipeline() {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [agentStatuses, setAgentStatuses] = useState<AgentStatuses>(initialStatuses());
  const [agentResults, setAgentResults] = useState<AgentResultsMap>({});
  const [pipelineResults, setPipelineResults] = useState<PipelineResults | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, color = "#666") => {
    setLog((prev) => [
      ...prev,
      { msg, color, ts: new Date().toLocaleTimeString() },
    ]);
    setTimeout(() => logRef.current?.scrollTo(0, 99999), 50);
  }, []);

  const reset = useCallback(() => {
    setAgentStatuses(initialStatuses());
    setAgentResults({});
    setPipelineResults(null);
    setLog([]);
  }, []);

  const execute = useCallback(
    async (data: string) => {
      reset();
      setIsRunning(true);
      setPhase("running");
      addLog("▶ Pipeline initiated", "#00d4ff");

      await runPipeline(data, {
        onAgentStart(agentId) {
          setAgentStatuses((prev) => ({ ...prev, [agentId]: "running" }));
        },
        onAgentDone(agentId, result) {
          setAgentStatuses((prev) => ({ ...prev, [agentId]: "done" }));
          setAgentResults((prev) => ({ ...prev, [agentId]: result }));
        },
        onAgentError(agentId, message) {
          setAgentStatuses((prev) => ({ ...prev, [agentId]: "error" }));
          addLog(`✗ ${message}`, "#ff4444");
        },
        onLog: addLog,
        onComplete(results) {
          setPipelineResults(results);
          setPhase("done");
          setIsRunning(false);
        },
        onError(message) {
          addLog(`✗ Pipeline error: ${message}`, "#ff4444");
          setPhase("idle");
          setIsRunning(false);
        },
      });
    },
    [reset, addLog]
  );

  return {
    isRunning,
    phase,
    agentStatuses,
    agentResults,
    pipelineResults,
    log,
    logRef,
    execute,
  };
}
