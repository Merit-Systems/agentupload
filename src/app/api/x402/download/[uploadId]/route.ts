/**
 * GET /api/x402/download/[uploadId] — Get upload details + public URL (SIWX auth)
 */

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { X402_ENABLED, DEV_MODE_WALLET } from "@/server/x402";
import {
  requireSiwxAuth,
  siwxRequiredResponse,
} from "@/server/x402/siwx";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> },
): Promise<NextResponse> {
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

  const { uploadId } = await params;

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
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  if (upload.walletAddress !== walletAddress) {
    return NextResponse.json(
      { error: "Upload belongs to different wallet" },
      { status: 403 },
    );
  }

  return NextResponse.json({
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
  });
}
