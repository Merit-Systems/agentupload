/**
 * Upload tier pricing and byte limits.
 *
 * 6-month retention.  ~2x markup on AWS costs (storage + 10 downloads).
 */

export const TIERS = {
  "10mb": {
    label: "10 MB",
    maxBytes: 10 * 1024 * 1024,
    priceUsd: 0.02,
  },
  "100mb": {
    label: "100 MB",
    maxBytes: 100 * 1024 * 1024,
    priceUsd: 0.2,
  },
  "1gb": {
    label: "1 GB",
    maxBytes: 1024 * 1024 * 1024,
    priceUsd: 2.0,
  },
} as const;

export type TierKey = keyof typeof TIERS;

export const TIER_KEYS = Object.keys(TIERS) as TierKey[];

/** 6 months in milliseconds */
export const EXPIRY_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export function getTier(key: string): (typeof TIERS)[TierKey] | undefined {
  return TIERS[key as TierKey];
}

export function tierFromPrice(priceUsd: number): TierKey | undefined {
  for (const [key, tier] of Object.entries(TIERS)) {
    if (Math.abs(tier.priceUsd - priceUsd) < 0.001) {
      return key as TierKey;
    }
  }
  return undefined;
}
