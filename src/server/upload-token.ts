import { createHmac } from "crypto";
import { env } from "@/env";

const EPOCH = 1735689600; // 2025-01-01 00:00:00 UTC

export function generateUploadToken(path: string, expiresInHours = 1): string {
  const secret = env.CF_UPLOAD_SECRET;
  if (!secret) return "";

  const expiryHours =
    Math.floor((Date.now() / 1000 - EPOCH) / 3600) + expiresInHours;
  const expiryB36 = expiryHours.toString(36).padStart(4, "0");

  const hmac = createHmac("sha256", secret);
  hmac.update(path + ":" + expiryB36);
  const sig = hmac.digest("base64url").substring(0, 16);

  return expiryB36 + sig;
}
