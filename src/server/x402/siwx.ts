/**
 * SIWX Verification for x402 Read-Only Access
 *
 * Uses @x402/extensions/sign-in-with-x for CAIP-122 compliant
 * wallet authentication. Supports EVM and Solana wallets.
 */

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { encodePaymentRequiredHeader } from "@x402/core/http";
import type { PaymentRequired } from "@x402/core/types";
import {
  declareSIWxExtension,
  parseSIWxHeader,
  validateSIWxMessage,
  verifySIWxSignature,
} from "@x402/extensions/sign-in-with-x";
import { createLogger } from "@/lib/logger";

const log = createLogger("siwx");

export interface SiwxAuthResult {
  valid: boolean;
  walletAddress?: string;
  error?: string;
}

/**
 * Verify SIWX proof from SIGN-IN-WITH-X header
 */
export async function verifySiwxProof(
  headers: Headers,
  resourceUri: string,
): Promise<SiwxAuthResult> {
  const header = headers.get("SIGN-IN-WITH-X") ?? headers.get("sign-in-with-x");

  if (!header) {
    return { valid: false, error: "Missing SIGN-IN-WITH-X header" };
  }

  try {
    const payload = parseSIWxHeader(header);

    const validation = await validateSIWxMessage(payload, resourceUri);
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }

    const verification = await verifySIWxSignature(payload);
    if (!verification.valid) {
      return { valid: false, error: verification.error };
    }

    const walletAddress = verification.address!.toLowerCase();

    // JIT user creation
    await db.user.upsert({
      where: { walletAddress },
      create: { walletAddress },
      update: {},
    });

    return { valid: true, walletAddress };
  } catch (e) {
    log.error("Verification error", {
      error: e instanceof Error ? e.message : String(e),
    });
    return {
      valid: false,
      error: e instanceof Error ? e.message : "SIWX verification failed",
    };
  }
}

/**
 * Build 402 response requiring SIWX authentication (no payment)
 */
export function siwxRequiredResponse(
  request: Request,
  error?: string,
): NextResponse {
  const url = new URL(request.url);

  const extensions = declareSIWxExtension({
    domain: url.host,
    resourceUri: request.url,
    network: "eip155:8453",
    statement: "Sign in to access your uploads",
  });

  // declareSIWxExtension creates a static declaration without time-based
  // challenge fields (nonce/issuedAt). Normally these are added by
  // siwxResourceServerExtension.enrichPaymentRequiredResponse when going
  // through x402Server.createPaymentRequiredResponse(), but for auth-only
  // endpoints (accepts: []) we bypass that pipeline. Patch them in so
  // clients can construct a valid SIWX proof.
  const siwx = extensions["sign-in-with-x"];
  if (siwx?.info) {
    siwx.info.nonce = randomBytes(16).toString("hex");
    siwx.info.issuedAt = new Date().toISOString();
  }

  const body: PaymentRequired = {
    x402Version: 2,
    error,
    resource: {
      url: request.url,
      description: "SIWX authentication required",
      mimeType: "application/json",
    },
    accepts: [],
    extensions,
  };

  return new NextResponse(JSON.stringify({}), {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "PAYMENT-REQUIRED": encodePaymentRequiredHeader(body),
    },
  });
}

/**
 * Verify SIWX and return wallet address, or throw 402 response
 */
export async function requireSiwxAuth(
  request: Request,
): Promise<{ walletAddress: string }> {
  const result = await verifySiwxProof(
    new Headers(request.headers),
    request.url,
  );

  if (!result.valid || !result.walletAddress) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw siwxRequiredResponse(request, result.error);
  }

  return { walletAddress: result.walletAddress };
}
