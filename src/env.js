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
    X402_ENABLED: z.string().optional().default("true"),
    X402_WALLET_ADDRESS: z.string().optional(),
    X402_NETWORK: z.string().optional().default("base-sepolia"),
    // CDN
    CDN_HOST: z.string().optional(),
    CF_UPLOAD_SECRET: z.string().optional(),
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
    X402_ENABLED: process.env.X402_ENABLED,
    X402_WALLET_ADDRESS: process.env.X402_WALLET_ADDRESS,
    X402_NETWORK: process.env.X402_NETWORK,
    CDN_HOST: process.env.CDN_HOST,
    CF_UPLOAD_SECRET: process.env.CF_UPLOAD_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
