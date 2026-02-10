/**
 * GET /api/x402/uploads — List wallet's uploads (SIWX auth)
 */

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { X402_ENABLED, DEV_MODE_WALLET } from "@/server/x402";
import { requireSiwxAuth, siwxRequiredResponse } from "@/server/x402/siwx";

export async function GET(request: Request): Promise<NextResponse> {
  let walletAddress: string;

  if (X402_ENABLED) {
    try {
      const auth = await requireSiwxAuth(request);
      walletAddress = auth.walletAddress;
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      return siwxRequiredResponse(request, "Authentication required");
    }
  } else {
    walletAddress = DEV_MODE_WALLET;
  }

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

  return NextResponse.json({ uploads });
}
