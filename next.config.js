/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Rewrite .well-known paths to regular routes
  async rewrites() {
    return [
      {
        source: "/.well-known/x402",
        destination: "/well-known/x402",
      },
    ];
  },
  // CORS for x402 API endpoints (agents call from various origins)
  async headers() {
    return [
      {
        source: "/api/x402/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, SIGN-IN-WITH-X",
          },
          {
            key: "Access-Control-Expose-Headers",
            value: "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
          },
        ],
      },
    ];
  },
};

export default config;
