# Agent Upload

S3-backed file uploads via x402 micropayments. Pay with USDC. No API keys.

**Agents** upload files by paying USDC on Base via [x402](https://x402.org). Get a short upload URL, PUT file data, receive a permanent public URL. Files live for 6 months.

**Pricing**: 10 MB ($0.02) · 100 MB ($0.20) · 1 GB ($2.00)

> **Note:** Current pricing does not include per-download egress charges. Download-limit enforcement (via CloudFront logs + KVS blocklist) is planned but not yet implemented. Until then, heavily-downloaded files could generate egress costs exceeding the upload fee.

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

1. `POST /api/x402/upload` with x402 payment → `{ uploadUrl, publicUrl, uploadId }`
2. `PUT uploadUrl` with file data → uploaded via CloudFront CDN to S3
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
- `pnpm cf:deploy` - Update and publish the CloudFront Function

## CloudFront CDN

All uploads and downloads are served through CloudFront at `f.agentupload.dev`.

**Downloads** are cached at the edge and served directly from CloudFront. **Uploads** go through a CloudFront Function that validates a short HMAC token before forwarding to S3 via Origin Access Control (OAC).

### How upload auth works

When an agent buys an upload slot, the API generates a 20-character token:

```
https://f.agentupload.dev/xg9jgwvfh5/photo.png?t=07i5epl8lswDZPEY1F1t
                                                  ^^^^^^^^^^^^^^^^^^^^
                                                  4-char    16-char
                                                  expiry    HMAC-SHA256
```

- **Expiry**: hours since 2025-01-01 in base36 (4 chars). Tokens expire after 1 hour.
- **HMAC**: SHA-256 over `{path}:{expiry}` with a shared secret, truncated to 96 bits, base64url-encoded (16 chars).

The CloudFront Function (`infra/upload-auth.js`) runs on every viewer-request:
- **GET/HEAD**: passes through (downloads)
- **PUT with valid token**: strips the `?t=` param, forwards to S3 via OAC
- **PUT without token / expired / invalid**: returns 403
- **Other methods**: returns 405

### Infrastructure

| Component | ID / Name | Purpose |
|-----------|-----------|---------|
| CloudFront Distribution | `E1M0E43VZ51B6E` | CDN for uploads + downloads |
| CloudFront Function | `upload-auth` | HMAC token validation on PUT |
| Origin Access Control | `EMVBS7V17VIYZ` | SigV4 signing for S3 writes |
| ACM Certificate | `0eae855e-...` (us-east-1) | TLS for `f.agentupload.dev` |
| S3 Bucket | `x402-upload-prod` | File storage |

The origin path is `/uploads`, so CDN URL `f.agentupload.dev/abc/file.txt` maps to S3 key `uploads/abc/file.txt`.

### Updating the CloudFront Function

The function source is version-controlled at `infra/upload-auth.js`. To deploy changes:

```bash
pnpm cf:deploy   # Updates and publishes the function
```

The HMAC secret is hardcoded in the function (CloudFront Functions have no env vars) and must match the `CF_UPLOAD_SECRET` environment variable in Vercel. To rotate the secret, update both and redeploy.

## License

MIT
