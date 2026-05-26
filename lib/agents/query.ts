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
    const options: any = {
      maxTurns: opts.maxTurns ?? 4,
      permissionMode: opts.permissionMode ?? "plan",
    };
    
    // Only add optional fields if they exist
    if (opts.systemPrompt) options.systemPrompt = opts.systemPrompt;
    if (opts.appendSystemPrompt) options.appendSystemPrompt = opts.appendSystemPrompt;
    if (opts.allowedTools) options.allowedTools = opts.allowedTools;
    if (opts.mcpConfig) options.mcpConfig = opts.mcpConfig;
    if (opts.permissionPromptTool) options.permissionPromptTool = opts.permissionPromptTool;
    if (opts.continueSession !== undefined) options.continueSession = opts.continueSession;
    if (opts.resumeSessionId) options.resumeSessionId = opts.resumeSessionId;
    
    for await (const message of query({
      prompt: opts.prompt,
      options,
    })) {
      if (message.type === "result") {
        const msg = message as any;
        summary = {
          result: msg.result ?? msg.content ?? "",
          duration_ms: msg.duration_ms ?? Date.now() - start,
          duration_api_ms: msg.duration_api_ms,
          total_cost_usd: msg.total_cost_usd,
          session_id: msg.session_id,
          num_turns: msg.num_turns,
        };
        metricTurns.inc({ agent: opts.agentName }, msg.num_turns || 0);
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
