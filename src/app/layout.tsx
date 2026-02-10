import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Upload",
  description: "Pay USDC. Upload files. Get a link.",
  metadataBase: new URL("https://agentupload.dev"),
  openGraph: {
    title: "Agent Upload",
    description: "Pay USDC. Upload files. Get a link.",
    siteName: "Agent Upload",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Upload",
    description: "Pay USDC. Upload files. Get a link.",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      {
        url: "/favicon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-light.png",
        media: "(prefers-color-scheme: light)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
