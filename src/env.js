import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    // AWS S3
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    AWS_REGION: z.string().default("us-east-1"),
    S3_BUCKET: z.string().default("x402-upload-prod"),
    // x402 Payment Protocol
    X402_WALLET_ADDRESS: z.string(),
    CDP_API_KEY_ID: z.string(),
    CDP_API_KEY_SECRET: z.string(),
    // CDN
    CDN_HOST: z.string().optional(),
    CF_UPLOAD_SECRET: z.string().optional(),
    // MPP (Micropayment Protocol on Tempo)
    MPP_SECRET_KEY: z.string().optional(),
    MPP_CURRENCY: z.string().optional(),
    MPP_RECIPIENT: z.string().optional(),
    TEMPO_RPC_URL: z.string().optional(),
    // Cron
    CRON_SECRET: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    X402_WALLET_ADDRESS: process.env.X402_WALLET_ADDRESS,
    CDP_API_KEY_ID: process.env.CDP_API_KEY_ID,
    CDP_API_KEY_SECRET: process.env.CDP_API_KEY_SECRET,
    CDN_HOST: process.env.CDN_HOST,
    CF_UPLOAD_SECRET: process.env.CF_UPLOAD_SECRET,
    MPP_SECRET_KEY: process.env.MPP_SECRET_KEY,
    MPP_CURRENCY: process.env.MPP_CURRENCY,
    MPP_RECIPIENT: process.env.MPP_RECIPIENT,
    TEMPO_RPC_URL: process.env.TEMPO_RPC_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
