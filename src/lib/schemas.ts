import { z } from "zod";
import { TIER_KEYS, type TierKey } from "@/lib/pricing";

export const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(512).describe("Name of the file to upload"),
  contentType: z
    .string()
    .describe("MIME type of the file (e.g. image/png, video/mp4)"),
  tier: z
    .enum(TIER_KEYS as [TierKey, ...TierKey[]])
    .describe("Upload tier: 10mb ($0.02), 100mb ($0.20), 1gb ($2.00)"),
});

export const uploadResponseSchema = z.object({
  uploadId: z.string(),
  uploadUrl: z.string(),
  publicUrl: z.string(),
  expiresAt: z.string(),
  maxSize: z.number(),
  txHash: z.string().optional(),
  curlExample: z.string(),
});
