# CLAUDE.md

## Project Overview

x402 Upload is a standalone Next.js service providing S3-backed file uploads via x402 micropayments. Agents pay USDC on Base to buy upload slots, upload directly to S3 via presigned PUT URLs, and get permanent public download URLs.

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
- `src/server/s3.ts` — S3 client + presigned URLs
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

## Database

- Schema: `prisma/schema.prisma`
- Generated client: `generated/prisma/`
- Models: `User` (wallet-based), `Upload`
