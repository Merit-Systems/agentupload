# CLAUDE.md

## Project Overview

x402 Upload is a standalone Next.js service providing S3-backed file uploads via x402 micropayments. Agents pay USDC on Base to buy upload slots, upload via CloudFront CDN, and get permanent public download URLs.

**Tech Stack:**
- Next.js 15 (App Router)
- Prisma ORM with PostgreSQL (Neon for production, Docker for dev)
- AWS S3 for file storage
- x402 payment protocol (USDC on Base)
- SIWX (Sign-In-With-X) for wallet-based auth on read endpoints
- Tailwind CSS v4
- TypeScript
- pnpm as package manager

## Development Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm typecheck        # Type checking
pnpm check            # Lint + typecheck
./start-database.sh   # Start local Postgres in Docker
pnpm db:push          # Push schema changes to local dev DB
pnpm db:studio        # Open Prisma Studio
pnpm cf:deploy        # Update + publish CloudFront Function
```

## Architecture

### API Routes

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/x402/upload` | x402 payment | Buy upload slot |
| `GET /api/x402/uploads` | SIWX | List wallet's uploads |
| `GET /api/x402/download/[uploadId]` | SIWX | Get upload details |
| `GET /.well-known/x402` | None | Discovery document |
| `POST /api/cron/cleanup` | Cron secret | Cleanup expired uploads |

### Key Modules

- `src/server/x402/index.ts` — x402 server singleton
- `src/server/x402/siwx.ts` — SIWX auth verification
- `src/server/s3.ts` — S3 client, upload URLs, public URLs
- `src/server/upload-token.ts` — HMAC token generator for CDN uploads
- `src/server/db.ts` — Prisma singleton (Neon adapter)
- `src/lib/pricing.ts` — Tier prices + byte limits
- `src/lib/x402-extensions/sign-in-with-x/` — Vendored SIWX implementation

### Pricing

- `10mb` → $0.10
- `100mb` → $1.00
- `1gb` → $10.00

All uploads expire after 6 months.

## Environment Variables

See `.env.example` for required variables.

## CloudFront CDN (`f.agentupload.dev`)

Both uploads and downloads go through CloudFront at `f.agentupload.dev`. The origin is S3 (`x402-upload-prod`) with Origin Access Control (OAC) for writes.

**Upload flow:** API generates a short HMAC-signed token (20 chars). A CloudFront Function (`upload-auth`) validates the token on PUT requests, strips it, and forwards to S3 via OAC. GET/HEAD requests pass through for downloads.

**Key infra:**
- Distribution: `E1M0E43VZ51B6E` (origin path `/uploads`)
- CloudFront Function: `upload-auth` (source: `infra/upload-auth.js`)
- OAC: `EMVBS7V17VIYZ` (sigv4 signing for S3 PutObject)
- ACM cert: `0eae855e-...` (us-east-1)

**Updating the CF Function:** Edit `infra/upload-auth.js`, then run `pnpm cf:deploy`. The HMAC secret is hardcoded in the function (CF Functions have no env vars) and must match `CF_UPLOAD_SECRET` in Vercel.

**URL format:**
- Upload: `https://f.agentupload.dev/{id}/{filename}?t={20-char-token}`
- Download: `https://f.agentupload.dev/{id}/{filename}`

## Database

- Schema: `prisma/schema.prisma`
- Generated client: `generated/prisma/`
- Models: `User` (wallet-based), `Upload`
