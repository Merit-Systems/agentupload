/**
 * Barrel import — forces all route modules to register with the router.
 * Import this BEFORE router.wellKnown() or router.openapi() calls.
 */

import "@/app/api/upload/route";
import "@/app/api/uploads/route";
import "@/app/api/download/[uploadId]/route";
import "@/app/api/cron/cleanup/route";
