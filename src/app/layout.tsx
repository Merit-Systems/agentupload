import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "x402 Upload",
  description: "S3-backed file uploads via x402 micropayments",
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
