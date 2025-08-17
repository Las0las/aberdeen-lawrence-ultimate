export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { registry } from "@/lib/agents/metrics";

export async function GET() {
  const text = await registry.metrics();
  return new Response(text, {
    status: 200,
    headers: { "Content-Type": registry.contentType },
  });
}
