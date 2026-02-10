/**
 * POST /api/x402/upload — Buy an upload slot via x402 payment
 *
 * Returns an upload URL + permanent public URL.
 *
 * Agent workflow:
 * 1. POST /api/x402/upload with payment → { uploadUrl, publicUrl, uploadId }
 * 2. curl -X PUT "$uploadUrl" -H "Content-Type: image/png" --data-binary @file.png
 * 3. File live at publicUrl for 6 months
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import {
  x402Server,
  ensureInitialized,
  paymentRequiredResponse,
  extractWalletFromPayment,
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader,
  isValidEvmAddress,
  X402_ENABLED,
  X402_CAIP2_NETWORK,
  X402_PAYEE,
  DEV_MODE_WALLET,
  getBaseUrl,
} from "@/server/x402";
import { createPresignedPut, publicUrl, uploadUrl } from "@/server/s3";
import { TIERS, TIER_KEYS, EXPIRY_MS, type TierKey } from "@/lib/pricing";
import { generateId } from "@/lib/id";
import { createLogger } from "@/lib/logger";

const log = createLogger("x402-upload");

const uploadRequestSchema = z.object({
  filename: z.string().describe("Name of the file to upload"),
  contentType: z
    .string()
    .describe("MIME type of the file (e.g. image/png, video/mp4)"),
  tier: z
    .enum(TIER_KEYS as [TierKey, ...TierKey[]])
    .describe("Upload tier: 10mb ($0.10), 100mb ($1.00), 1gb ($10.00)"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    return await handleUpload(request);
  } catch (err) {
    log.error("Unhandled error in upload handler", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? (err.stack ?? "") : "",
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleUpload(request: Request): Promise<NextResponse> {
  const resourceUrl = `${getBaseUrl()}/api/x402/upload`;

  // Check for payment header FIRST
  const paymentHeader =
    request.headers.get("payment-signature") ??
    request.headers.get("PAYMENT-SIGNATURE") ??
    request.headers.get("x-payment") ??
    request.headers.get("X-PAYMENT");

  // Parse request body
  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    if (!paymentHeader && X402_ENABLED) {
      // Return 402 with schema for discovery (use cheapest tier as default price)
      return paymentRequiredResponse({
        cost: TIERS["10mb"].priceUsd,
        description:
          "Buy an upload slot. Tiers: 10mb ($0.10), 100mb ($1.00), 1gb ($10.00)",
        resourceUrl,
        inputSchema: uploadRequestSchema,
      });
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate input
  const parsed = uploadRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    if (!paymentHeader && X402_ENABLED) {
      return paymentRequiredResponse({
        cost: TIERS["10mb"].priceUsd,
        description:
          "Buy an upload slot. Tiers: 10mb ($0.10), 100mb ($1.00), 1gb ($10.00)",
        resourceUrl,
        inputSchema: uploadRequestSchema,
      });
    }
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const tier = TIERS[body.tier];
  const cost = tier.priceUsd;

  // Return 402 if no payment
  if (!paymentHeader && X402_ENABLED) {
    return paymentRequiredResponse({
      cost,
      description: `Upload slot (${tier.label}, 6 months)`,
      resourceUrl,
      inputSchema: uploadRequestSchema,
    });
  }

  let walletAddress: string;
  let paymentResponseHeader: string | undefined;
  let txHash: string | undefined;

  if (paymentHeader && X402_ENABLED) {
    await ensureInitialized();

    // Decode payment
    let payment;
    try {
      payment = decodePaymentSignatureHeader(paymentHeader);
    } catch (err) {
      log.error("Failed to decode payment", {
        error: err instanceof Error ? err.message : String(err),
      });
      return paymentRequiredResponse({
        cost,
        description: `Upload slot (${tier.label})`,
        resourceUrl,
        error: "Invalid payment format",
      });
    }

    // Build requirements
    const requirements = await x402Server.buildPaymentRequirements({
      scheme: "exact",
      network: X402_CAIP2_NETWORK,
      payTo: X402_PAYEE,
      price: cost,
    });

    // Find matching requirement
    const matchingReq = x402Server.findMatchingRequirements(
      requirements,
      payment,
    );
    if (!matchingReq) {
      return paymentRequiredResponse({
        cost,
        description: `Upload slot (${tier.label})`,
        resourceUrl,
        error: "Payment does not match requirements",
      });
    }

    // Verify payment
    const verifyResult = await x402Server.verifyPayment(payment, matchingReq);
    if (!verifyResult.isValid) {
      return paymentRequiredResponse({
        cost,
        description: `Upload slot (${tier.label})`,
        resourceUrl,
        error: verifyResult.invalidReason ?? "Verification failed",
      });
    }

    // Settle payment
    const settleResult = await x402Server.settlePayment(payment, matchingReq);
    if (!settleResult.success) {
      return paymentRequiredResponse({
        cost,
        description: `Upload slot (${tier.label})`,
        resourceUrl,
        error: settleResult.errorReason ?? "Settlement failed",
      });
    }

    walletAddress =
      extractWalletFromPayment(payment) ?? verifyResult.payer ?? "";
    if (!walletAddress) {
      return paymentRequiredResponse({
        cost,
        description: `Upload slot (${tier.label})`,
        resourceUrl,
        error: "Could not determine wallet address",
      });
    }

    paymentResponseHeader = encodePaymentResponseHeader(settleResult);
    txHash = settleResult.transaction;
  } else {
    walletAddress = DEV_MODE_WALLET;
  }

  // Validate wallet
  if (!isValidEvmAddress(walletAddress)) {
    return paymentRequiredResponse({
      cost,
      description: `Upload slot (${tier.label})`,
      resourceUrl,
      error: "Invalid wallet address format",
    });
  }

  // JIT user creation
  await db.user.upsert({
    where: { walletAddress },
    create: { walletAddress },
    update: { updatedAt: new Date() },
  });

  // Generate ID upfront so s3Key and publicUrl are deterministic
  const uploadId = generateId();
  const s3Key = `uploads/${uploadId}/${body.filename}`;
  const filePublicUrl = publicUrl(s3Key);

  // Single DB write with all fields
  await db.upload.create({
    data: {
      id: uploadId,
      walletAddress,
      s3Key,
      filename: body.filename,
      contentType: body.contentType,
      maxSize: tier.maxBytes,
      tier: body.tier,
      publicUrl: filePublicUrl,
      pricePaid: cost,
      txHash,
      expiresAt: new Date(Date.now() + EXPIRY_MS),
    },
  });

  // Generate upload URL: prefer CDN token, fallback to S3 presigned
  const cdnUploadUrl = uploadUrl(s3Key);
  const presignedUrl = cdnUploadUrl
    ? null
    : await createPresignedPut({
        key: s3Key,
        contentType: body.contentType,
      });
  const finalUploadUrl = cdnUploadUrl ?? presignedUrl!;

  log.info("Created upload slot", {
    uploadId,
    tier: body.tier,
    wallet: walletAddress.slice(0, 10),
  });

  const responseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (paymentResponseHeader) {
    responseHeaders["PAYMENT-RESPONSE"] = paymentResponseHeader;
  }

  return new NextResponse(
    JSON.stringify({
      uploadId,
      uploadUrl: finalUploadUrl,
      publicUrl: filePublicUrl,
      expiresAt: new Date(Date.now() + EXPIRY_MS).toISOString(),
      maxSize: tier.maxBytes,
      txHash,
      curlExample: `curl -X PUT "${finalUploadUrl}" -H "Content-Type: ${body.contentType}" --data-binary @${body.filename}`,
    }),
    { status: 200, headers: responseHeaders },
  );
}
