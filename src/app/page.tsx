export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Agent Upload</h1>
        <p className="text-muted-foreground text-lg">
          Pay USDC on Base, get a permanent download URL.
        </p>

        <div className="grid grid-cols-3 gap-4 text-left">
          <div className="border-border rounded border p-4">
            <div className="text-2xl font-bold">$0.02</div>
            <div className="text-muted-foreground text-sm">
              10 MB &middot; 6 months
            </div>
          </div>
          <div className="border-border rounded border p-4">
            <div className="text-2xl font-bold">$0.20</div>
            <div className="text-muted-foreground text-sm">
              100 MB &middot; 6 months
            </div>
          </div>
          <div className="border-border rounded border p-4">
            <div className="text-2xl font-bold">$2.00</div>
            <div className="text-muted-foreground text-sm">
              1 GB &middot; 6 months
            </div>
          </div>
        </div>

        <div className="text-muted-foreground space-y-2 text-left text-sm">
          <p className="text-foreground font-medium">How it works:</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              POST <code className="text-foreground">/api/upload</code>{" "}
              with payment
            </li>
            <li>Upload file via presigned PUT URL</li>
            <li>File is live at the public URL for 6 months</li>
          </ol>
        </div>

        <div className="flex justify-center gap-4 text-sm">
          <a
            href="/.well-known/x402"
            className="text-muted-foreground hover:text-foreground underline"
          >
            Discovery
          </a>
          <a
            href="/llms.txt"
            className="text-muted-foreground hover:text-foreground underline"
          >
            llms.txt
          </a>
        </div>
      </div>
    </main>
  );
}
