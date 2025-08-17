import { registry } from "@/lib/agents/metrics";
export async function dump() {
  console.log(await registry.metrics());
}
