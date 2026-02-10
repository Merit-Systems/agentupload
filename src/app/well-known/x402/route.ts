/**
 * x402 Discovery Document
 *
 * GET /.well-known/x402 → JSON listing all x402-enabled endpoints.
 */

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getBaseUrl } from "@/server/x402";
import { createLogger } from "@/lib/logger";

const log = createLogger("x402-discovery");

export async function GET(): Promise<NextResponse> {
  const baseUrl = getBaseUrl();

  const resources: string[] = [
    `${baseUrl}/api/x402/upload`,
    `${baseUrl}/api/x402/uploads`,
    `${baseUrl}/api/x402/download/{uploadId}`,
  ];

  // Load instructions from llms.txt
  let instructions = "";
  try {
    const llmsTxtPath = join(process.cwd(), "public", "llms.txt");
    instructions = await readFile(llmsTxtPath, "utf-8");
  } catch (error) {
    log.error("Failed to load llms.txt", {
      error: error instanceof Error ? error.message : String(error),
    });
    instructions = `# x402 Upload API\n\nS3-backed file uploads via x402 micropayments. USDC on Base.\n\nVisit ${baseUrl}/llms.txt for documentation.`;
  }

  return NextResponse.json(
    {
      version: 1,
      description:
        "S3-backed file uploads via x402 micropayments. Tiers: 10mb ($0.10), 100mb ($1.00), 1gb ($10.00).",
      resources,
      instructions,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}
