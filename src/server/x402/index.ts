/**
 * x402 Server - Singleton using @x402/core and @x402/evm
 *
 * Mirrors StableStudio pattern.
 */

import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { facilitator } from "@coinbase/x402";
import {
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
  decodePaymentSignatureHeader,
} from "@x402/core/http";
import type {
  PaymentPayload,
  PaymentRequirements,
  PaymentRequired,
  Network,
} from "@x402/core/types";
import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createLogger } from "@/lib/logger";
import { env } from "@/env";

const log = createLogger("x402");

// Re-export types and helpers
export type { PaymentPayload, PaymentRequirements, PaymentRequired, Network };
export {
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
  decodePaymentSignatureHeader,
};

// Configuration
export const X402_NETWORK = (env.X402_NETWORK ?? "base-sepolia") as
  | "base"
  | "base-sepolia";
export const X402_ENABLED = env.X402_ENABLED === "true";
export const X402_PAYEE = (() => {
  const addr = env.X402_WALLET_ADDRESS;
  if (X402_ENABLED && !addr) {
    throw new Error(
      "X402_WALLET_ADDRESS environment variable is required when X402_ENABLED=true.",
    );
  }
  return addr ?? "";
})();

const NETWORK_TO_CAIP2: Record<string, Network> = {
  base: "eip155:8453" as Network,
  "base-sepolia": "eip155:84532" as Network,
};

export const X402_CAIP2_NETWORK =
  NETWORK_TO_CAIP2[X402_NETWORK] ?? ("eip155:8453" as Network);

// Create facilitator client
const facilitatorClient = new HTTPFacilitatorClient(
  process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET
    ? facilitator
    : undefined,
);

// Create and configure server singleton
export const x402Server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(x402Server);

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureInitialized(): Promise<void> {
  if (initialized) return;

  initPromise ??= (async () => {
    await x402Server.initialize();
    initialized = true;
  })();

  return initPromise;
}

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

export interface PaymentRequiredOptions {
  cost: number;
  description: string;
  resourceUrl: string;
  error?: string;
  inputSchema?: ZodType;
}

/**
 * Build a 402 Payment Required response (v2 compliant)
 */
export async function paymentRequiredResponse(
  options: PaymentRequiredOptions,
): Promise<NextResponse> {
  const {
    cost,
    description,
    resourceUrl,
    error = "Payment required",
    inputSchema,
  } = options;

  await ensureInitialized();

  const requirements = await x402Server.buildPaymentRequirements({
    scheme: "exact",
    network: X402_CAIP2_NETWORK,
    payTo: X402_PAYEE,
    price: cost,
  });

  const jsonSchema = inputSchema
    ? (zodToJsonSchema(inputSchema, { target: "openApi3" }) as Record<
        string,
        unknown
      >)
    : undefined;

  const outputSchema = {
    type: "object" as const,
    properties: {
      uploadId: { type: "string" as const },
      presignedUrl: { type: "string" as const },
      publicUrl: { type: "string" as const },
    },
    required: ["uploadId", "presignedUrl", "publicUrl"],
  };

  const paymentRequired = await x402Server.createPaymentRequiredResponse(
    requirements,
    { url: resourceUrl, description, mimeType: "application/json" },
    error,
    {
      ...declareDiscoveryExtension({
        bodyType: "json",
        ...(jsonSchema && { inputSchema: jsonSchema }),
        output: {
          example: {
            uploadId: "k7gm3nqp2",
            presignedUrl: "https://s3.amazonaws.com/...",
            publicUrl: "https://f.agentupload.dev/k7gm3nqp2/photo.png",
          },
          schema: outputSchema,
        },
      }),
    },
  );

  return new NextResponse(
    JSON.stringify({
      error,
      paymentRequired: true,
    }),
    {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "PAYMENT-REQUIRED": encodePaymentRequiredHeader(paymentRequired),
      },
    },
  );
}

/**
 * Extract wallet address from payment payload
 */
export function extractWalletFromPayment(
  payment: PaymentPayload,
): string | null {
  try {
    const payload = payment.payload;

    if (payload?.authorization && typeof payload.authorization === "object") {
      const auth = payload.authorization as Record<string, unknown>;
      if (typeof auth.from === "string") {
        return auth.from.toLowerCase();
      }
    }

    if (typeof payload?.from === "string") {
      return payload.from.toLowerCase();
    }

    return null;
  } catch (err) {
    log.error("Failed to extract wallet from payment", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export const DEV_MODE_WALLET = "dev-mode-no-payment";

export function isValidEvmAddress(address: string): boolean {
  if (address === DEV_MODE_WALLET) {
    return !X402_ENABLED;
  }
  return isAddress(address);
}
