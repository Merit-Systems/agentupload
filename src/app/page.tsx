export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Agent Upload</h1>
        <p className="text-lg text-muted-foreground">
          Pay USDC on Base, get a permanent download URL.
        </p>

        <div className="grid grid-cols-3 gap-4 text-left">
          <div className="rounded border border-border p-4">
            <div className="text-2xl font-bold">$0.10</div>
            <div className="text-sm text-muted-foreground">10 MB &middot; 6 months</div>
          </div>
          <div className="rounded border border-border p-4">
            <div className="text-2xl font-bold">$1.00</div>
            <div className="text-sm text-muted-foreground">
              100 MB &middot; 6 months
            </div>
          </div>
          <div className="rounded border border-border p-4">
            <div className="text-2xl font-bold">$10.00</div>
            <div className="text-sm text-muted-foreground">1 GB &middot; 6 months</div>
          </div>
        </div>

        <div className="space-y-2 text-left text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How it works:</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              POST <code className="text-foreground">/api/x402/upload</code>{" "}
              with x402 payment
            </li>
            <li>
              Upload file via presigned PUT URL
            </li>
            <li>File is live at the public URL for 6 months</li>
          </ol>
        </div>

        <div className="flex justify-center gap-4 text-sm">
          <a
            href="/.well-known/x402"
            className="text-muted-foreground underline hover:text-foreground"
          >
            Discovery
          </a>
          <a
            href="/llms.txt"
            className="text-muted-foreground underline hover:text-foreground"
          >
            llms.txt
          </a>
        </div>
      </div>
    </main>
  );
}
