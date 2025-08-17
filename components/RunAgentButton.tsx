"use client";

import { useState } from "react";
import { runClaudeAgent } from "@/lib/actions/runClaudeAgent";

export function RunAgentButton() {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string>("");

  async function handleClick() {
    setBusy(true);
    try {
      const r = await runClaudeAgent("Investigate error rate for Job #123");
      setOut(r?.result || "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        disabled={busy}
        onClick={handleClick}
        className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
      >
        {busy ? "Running..." : "Run SRE Agent"}
      </button>
      {out && (
        <pre className="p-3 rounded bg-neutral-100 text-sm whitespace-pre-wrap">
          {out}
        </pre>
      )}
    </div>
  );
}
