import { query } from "@anthropic-ai/claude-code";
import { logger } from "@/lib/agents/logger";
import { metricTurns, metricLatency, metricErrors } from "@/lib/agents/metrics";

export type AgentOptions = {
  agentName: string;
  prompt: string;
  maxTurns?: number;
  systemPrompt?: string;
  appendSystemPrompt?: string;
  allowedTools?: string[];
  mcpConfig?: string;
  permissionPromptTool?: string;
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan";
  continueSession?: boolean;
  resumeSessionId?: string;
};

export type AgentRunSummary = {
  result: string;
  duration_ms?: number;
  duration_api_ms?: number;
  total_cost_usd?: number;
  session_id?: string;
  num_turns?: number;
};

export async function runAgent(opts: AgentOptions): Promise<AgentRunSummary> {
  const start = Date.now();
  let summary: AgentRunSummary = { result: "" };

  try {
    for await (const message of query({
      prompt: opts.prompt,
      options: {
        maxTurns: opts.maxTurns ?? 4,
        systemPrompt: opts.systemPrompt,
        appendSystemPrompt: opts.appendSystemPrompt,
        allowedTools: opts.allowedTools,
        mcpConfig: opts.mcpConfig,
        permissionPromptTool: opts.permissionPromptTool,
        permissionMode: opts.permissionMode ?? "plan",
        continueSession: opts.continueSession,
        resumeSessionId: opts.resumeSessionId,
      },
    })) {
      if (message.type === "result") {
        summary = {
          result: message.result ?? "",
          duration_ms: message.duration_ms ?? Date.now() - start,
          duration_api_ms: message.duration_api_ms,
          total_cost_usd: message.total_cost_usd,
          session_id: message.session_id,
          num_turns: message.num_turns,
        };
        metricTurns.inc({ agent: opts.agentName }, message.num_turns || 0);
        metricLatency.observe({ agent: opts.agentName }, summary.duration_ms || 0);
        logger.info({
          msg: "agent_run_complete",
          agent: opts.agentName,
          ...summary,
        });
      }
    }
    return summary;
  } catch (err: any) {
    metricErrors.inc({ agent: opts.agentName, type: err?.name || "Error" });
    logger.error({ msg: "agent_run_error", agent: opts.agentName, err: err?.message });
    throw err;
  }
}
