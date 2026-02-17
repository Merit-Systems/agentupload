/**
 * GET /api/uploads — List wallet's uploads (SIWX auth)
 */

import { router } from "@/lib/router";
import { db } from "@/server/db";

export const GET = router
  .route("uploads")
  .siwx()
  .description("List uploads for the authenticated wallet")
  .handler(async ({ wallet }) => {
    const walletAddress = wallet!.toLowerCase();

    await db.user.upsert({
      where: { walletAddress },
      create: { walletAddress },
      update: {},
    });

    const uploads = await db.upload.findMany({
      where: { walletAddress },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        contentType: true,
        tier: true,
        maxSize: true,
        actualSize: true,
        publicUrl: true,
        status: true,
        pricePaid: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return { uploads };
  });
