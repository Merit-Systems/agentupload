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

import { router } from "@/lib/router";
import {
  uploadRequestSchema,
  uploadResponseSchema,
} from "@/lib/schemas";
import { db } from "@/server/db";
import { createPresignedPut, publicUrl, uploadUrl } from "@/server/s3";
import { TIERS, EXPIRY_MS } from "@/lib/pricing";
import { generateId } from "@/lib/id";
import { createLogger } from "@/lib/logger";

const log = createLogger("x402-upload");

/**
 * Strip path traversal, shell metacharacters, and limit length.
 */
function sanitizeFilename(raw: string): string {
  let name = raw.split(/[\\/]/).pop() ?? raw;
  name = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  name = name.replace(/\.{2,}/g, ".");
  name = name.replace(/^[.\-_]+/, "");
  if (!name) name = "upload";
  return name.slice(0, 255);
}

export const POST = router
  .route("upload")
  .paid({
    field: "tier",
    tiers: {
      "10mb": { price: "0.02", label: "10 MB" },
      "100mb": { price: "0.20", label: "100 MB" },
      "1gb": { price: "2.00", label: "1 GB" },
    },
  })
  .body(uploadRequestSchema)
  .output(uploadResponseSchema)
  .description("Buy an upload slot. Agent uploads file via returned URL.")
  .handler(async ({ body, wallet }) => {
    const filename = sanitizeFilename(body.filename);
    const tier = TIERS[body.tier];
    const walletAddress = wallet!.toLowerCase();

    const expiresAt = new Date(Date.now() + EXPIRY_MS);
    const uploadId = generateId();
    const s3Key = `uploads/${uploadId}/${filename}`;
    const filePublicUrl = publicUrl(s3Key);

    await db.user.upsert({
      where: { walletAddress },
      create: { walletAddress },
      update: { updatedAt: new Date() },
    });

    await db.upload.create({
      data: {
        id: uploadId,
        walletAddress,
        s3Key,
        filename,
        contentType: body.contentType,
        maxSize: tier.maxBytes,
        tier: body.tier,
        publicUrl: filePublicUrl,
        pricePaid: tier.priceUsd,
        expiresAt,
      },
    });

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

    return {
      uploadId,
      uploadUrl: finalUploadUrl,
      publicUrl: filePublicUrl,
      expiresAt: expiresAt.toISOString(),
      maxSize: tier.maxBytes,
      curlExample: `curl -X PUT "${finalUploadUrl}" -H "Content-Type: ${body.contentType}" --data-binary @'${filename}'`,
    };
  });
