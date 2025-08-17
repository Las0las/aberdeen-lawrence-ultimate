// Node runtime required (Claude Code uses local exec & streams)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/query";

type Body = {
  agent: string;
  prompt: string;
  opts?: {
    maxTurns?: number;
    systemPrompt?: string;
    appendSystemPrompt?: string;
    allowedTools?: string[];
    mcpConfig?: string; // e.g., "mcp/integrations.json"
    permissionPromptTool?: string;
    permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan";
    resumeSessionId?: string;
  };
};

// Minimal least-privilege default if caller doesn’t provide allowedTools
const DEFAULT_ALLOWED = ["Read", "Grep", "WebSearch"];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.agent || !body?.prompt) {
      return NextResponse.json({ error: "agent and prompt required" }, { status: 400 });
    }

    // Intersect with a conservative server default (tighten as needed)
    const callerTools = body.opts?.allowedTools?.length ? body.opts.allowedTools : DEFAULT_ALLOWED;

    const summary = await runAgent({
      agentName: body.agent,
      prompt: body.prompt,
      maxTurns: body.opts?.maxTurns,
      systemPrompt: body.opts?.systemPrompt,
      appendSystemPrompt: body.opts?.appendSystemPrompt,
      allowedTools: callerTools,
      mcpConfig: body.opts?.mcpConfig,
      permissionPromptTool: body.opts?.permissionPromptTool,
      permissionMode: body.opts?.permissionMode ?? "plan",
      resumeSessionId: body.opts?.resumeSessionId,
    });

    return NextResponse.json({ result: summary.result, meta: summary });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "internal error" }, { status: 500 });
  }
}
