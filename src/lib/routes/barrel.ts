/**
 * Barrel import — forces all route modules to register with the router.
 * Import this BEFORE router.wellKnown() or router.openapi() calls.
 */

import "@/app/api/x402/upload/route";
import "@/app/api/x402/uploads/route";
import "@/app/api/x402/download/[uploadId]/route";
import "@/app/api/cron/cleanup/route";
