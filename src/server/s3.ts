/**
 * S3 Client + Presigned URL Helpers
 *
 * - Presigned PUT with Content-Length constraints
 * - Public read URLs (no presigned GET needed)
 */

import {
  S3Client,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.S3_BUCKET;

/**
 * Generate a presigned PUT URL.
 *
 * Note: Presigned PUTs don't support max-size constraints (that's presigned POST
 * with conditions). We sign ContentType so S3 rejects mismatched types, but size
 * enforcement is done post-upload by the cleanup cron via HeadObject.
 */
export async function createPresignedPut(opts: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: opts.key,
    ContentType: opts.contentType,
  });

  return getSignedUrl(s3, command, {
    expiresIn: opts.expiresIn ?? 3600, // 1 hour default
  });
}

/**
 * Public URL for an S3 object.
 * Uses CDN_HOST (e.g. f.agentupload.dev) when set, falls back to raw S3 URL.
 * CDN origin path is /uploads, so we strip that prefix for CDN URLs.
 */
export function publicUrl(key: string): string {
  if (env.CDN_HOST) {
    const cdnPath = key.replace(/^uploads\//, "");
    return `https://${env.CDN_HOST}/${cdnPath}`;
  }
  return `https://${BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Check if an object exists and get its actual size.
 */
export async function headObject(
  key: string,
): Promise<{ exists: boolean; size?: number }> {
  try {
    const result = await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    return { exists: true, size: result.ContentLength };
  } catch {
    return { exists: false };
  }
}

/**
 * Delete an S3 object.
 */
export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
