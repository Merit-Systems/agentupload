/**
 * GET /api/download/[uploadId] — Get upload details + public URL (SIWX auth)
 */

import { router } from "@/lib/router";
import { db } from "@/server/db";

export const GET = router
  .route("download")
  .siwx()
  .description("Get upload details by ID")
  .handler(async ({ wallet, request }) => {
    const walletAddress = wallet!.toLowerCase();
    const uploadId = new URL(request.url).pathname.split("/").pop()!;

    const upload = await db.upload.findUnique({
      where: { id: uploadId },
      select: {
        id: true,
        walletAddress: true,
        filename: true,
        contentType: true,
        tier: true,
        maxSize: true,
        actualSize: true,
        publicUrl: true,
        status: true,
        pricePaid: true,
        txHash: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!upload) {
      throw Object.assign(new Error("Upload not found"), { status: 404 });
    }

    if (upload.walletAddress !== walletAddress) {
      throw Object.assign(new Error("Upload belongs to different wallet"), {
        status: 403,
      });
    }

    return {
      upload: {
        id: upload.id,
        filename: upload.filename,
        contentType: upload.contentType,
        tier: upload.tier,
        maxSize: upload.maxSize,
        actualSize: upload.actualSize,
        publicUrl: upload.publicUrl,
        status: upload.status,
        pricePaid: upload.pricePaid,
        txHash: upload.txHash,
        expiresAt: upload.expiresAt,
        createdAt: upload.createdAt,
      },
    };
  });
