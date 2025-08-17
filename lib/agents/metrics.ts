import client from "prom-client";
export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const metricTurns = new client.Counter({
  name: "claude_agent_turns_total",
  help: "Total conversation turns used by agents",
  labelNames: ["agent"],
});
export const metricLatency = new client.Histogram({
  name: "claude_agent_duration_ms",
  help: "SDK reported duration per run (ms)",
  labelNames: ["agent"],
  buckets: [100,250,500,1000,2000,5000,10000,30000],
});
export const metricErrors = new client.Counter({
  name: "claude_agent_errors_total",
  help: "Errors encountered running agents",
  labelNames: ["agent","type"],
});
registry.registerMetric(metricTurns);
registry.registerMetric(metricLatency);
registry.registerMetric(metricErrors);
