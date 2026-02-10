# Agent Upload

S3-backed file uploads via x402 micropayments. Pay with USDC. No API keys.

**Agents** upload files by paying USDC on Base via [x402](https://x402.org). Get a presigned S3 PUT URL, upload directly, receive a permanent public URL. Files live for 6 months.

**Pricing**: 10 MB ($0.10) · 100 MB ($1.00) · 1 GB ($10.00)

## For Agents

Add the [x402scan](https://github.com/merit-systems/x402scan-mcp) MCP server to Claude Code, Codex, Cursor, or Claude Desktop.

<details>
<summary><strong>Set up <code>x402scan</code> MCP server</strong></summary>

| App            | Command / Link                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code**     | <code>claude mcp add x402scan --scope user -- npx -y x402scan-mcp@latest</code>                                                                                                   |
| **Codex**           | <code>codex mcp add x402scan -- npx -y x402scan-mcp@latest</code>                                                                                                                |
| **Cursor**          | [<img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Install MCP Server" height="28"/>](https://cursor.com/en/install-mcp?name=x402scan&config=eyJjb21tYW5kIjoiL2Jpbi9iYXNoIiwiYXJncyI6WyItYyIsInNvdXJjZSAkSE9NRS8ubnZtL252bS5zaCAyPi9kZXYvbnVsbDsgZXhlYyBucHggLXkgeDQwMnNjYW4tbWNwQGxhdGVzdCJdfQ%3D%3D)            |
| **Claude Desktop**  | [<img src="https://img.shields.io/badge/Add_to_Claude-x402scan-blue?logo=anthropic" alt="Add to Claude" height="28"/>](https://github.com/merit-systems/x402scan-mcp/raw/main/x402scan.mcpb)          |

</details>

<br/>

Prompt:
`> Check agentupload.dev/llms.txt and upload this screenshot to the 10mb tier.`

A wallet is auto-generated at `~/.x402scan-mcp/wallet.json`. Deposit USDC on Base to start uploading.

Or use the x402 API directly:
- `GET /.well-known/x402` - discover endpoints and pricing
- `POST /api/x402/upload` - buy an upload slot with a signed x402 payment

## How It Works

1. `POST /api/x402/upload` with x402 payment → `{ presignedUrl, publicUrl, uploadId }`
2. `PUT presignedUrl` with file data → uploaded to S3
3. File is live at `publicUrl` for 6 months

## Development

**Prerequisites**: PostgreSQL, Node.js, pnpm

```bash
pnpm install
./start-database.sh
cp .env.example .env.local
# Fill in DATABASE_URL, AWS credentials, X402_WALLET_ADDRESS
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

**Useful commands**:
- `pnpm check` - Lint and typecheck
- `pnpm db:studio` - Open Prisma Studio
- `pnpm format:write` - Format code

## License

MIT
