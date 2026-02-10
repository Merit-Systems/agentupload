/**
 * POST /api/cron/cleanup — Clean up expired/empty uploads
 *
 * Called by Vercel Cron or external scheduler.
 * - Verifies actual uploads via S3 HeadObject
 * - Marks expired uploads
 * - Deletes expired S3 objects
 */

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { headObject, deleteObject } from "@/server/s3";
import { env } from "@/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("cron-cleanup");

export async function POST(request: Request): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let verified = 0;
  let oversized = 0;
  let expired = 0;
  let deleted = 0;

  // 1. Verify pending uploads (check if file was actually uploaded)
  const pendingUploads = await db.upload.findMany({
    where: {
      status: "pending",
      createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) }, // > 1 hour old
    },
    take: 100,
  });

  for (const upload of pendingUploads) {
    const head = await headObject(upload.s3Key);
    if (head.exists) {
      // Enforce tier size limit: delete objects that exceed maxSize
      if (head.size && head.size > upload.maxSize) {
        log.warn("Upload exceeds tier limit, deleting", {
          uploadId: upload.id,
          actualSize: head.size,
          maxSize: upload.maxSize,
        });
        try {
          await deleteObject(upload.s3Key);
        } catch (err) {
          log.error("Failed to delete oversized object", {
            key: upload.s3Key,
            error: err instanceof Error ? err.message : String(err),
          });
        }
        await db.upload.update({
          where: { id: upload.id },
          data: { status: "expired", actualSize: head.size },
        });
        oversized++;
        continue;
      }

      await db.upload.update({
        where: { id: upload.id },
        data: { status: "uploaded", actualSize: head.size },
      });
      verified++;
    }
  }

  // 2. Mark expired uploads
  const expiredUploads = await db.upload.findMany({
    where: {
      status: { not: "expired" },
      expiresAt: { lt: new Date() },
    },
    take: 100,
  });

  for (const upload of expiredUploads) {
    await db.upload.update({
      where: { id: upload.id },
      data: { status: "expired" },
    });
    expired++;

    // Delete from S3
    try {
      await deleteObject(upload.s3Key);
      deleted++;
    } catch (err) {
      log.error("Failed to delete S3 object", {
        key: upload.s3Key,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.info("Cleanup complete", { verified, oversized, expired, deleted });

  return NextResponse.json({ verified, oversized, expired, deleted });
}
