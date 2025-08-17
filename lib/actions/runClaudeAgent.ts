export async function runClaudeAgent(prompt: string) {
  const res = await fetch("/api/agents/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agent: "sre",
      prompt,
      opts: {
        permissionMode: "plan",
        allowedTools: ["mcp__slack__postMessage"], // tighten per use
        mcpConfig: "mcp/integrations.json"
      }
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
