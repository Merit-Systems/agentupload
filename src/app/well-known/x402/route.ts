/**
 * x402 Discovery Document
 *
 * GET /.well-known/x402 → JSON listing all x402-enabled endpoints.
 */

import "@/lib/routes/barrel";
import { router } from "@/lib/router";
import { readFile } from "fs/promises";
import { join } from "path";
import { createLogger } from "@/lib/logger";

const log = createLogger("x402-discovery");

let instructions: string | undefined;

async function loadInstructions(): Promise<string> {
  if (instructions !== undefined) return instructions;
  try {
    const llmsTxtPath = join(process.cwd(), "public", "llms.txt");
    instructions = await readFile(llmsTxtPath, "utf-8");
  } catch (error) {
    log.error("Failed to load llms.txt", {
      error: error instanceof Error ? error.message : String(error),
    });
    instructions =
      "# x402 Upload API\n\nS3-backed file uploads via x402 micropayments. USDC on Base.";
  }
  return instructions;
}

export const GET = router.wellKnown({
  description:
    "S3-backed file uploads via x402 micropayments. Tiers: 10mb ($0.02), 100mb ($0.20), 1gb ($2.00).",
  instructions: loadInstructions,
});
