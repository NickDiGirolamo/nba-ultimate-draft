export interface TokenPackProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tokenAmount: number;
  usdCents: number;
  currency: string;
  stripePriceId: string | null;
  active: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
}

export const defaultTokenPackProducts: TokenPackProduct[] = [
  {
    id: "rookie-token-pack",
    slug: "rookie-token-pack",
    name: "Rookie Token Pack",
    description: "A small token boost for early Rogue upgrades and utility items.",
    tokenAmount: 10_000,
    usdCents: 199,
    currency: "usd",
    stripePriceId: "price_1TUApeF1dYAmNp1wRnxzWs1e",
    active: true,
    sortOrder: 10,
    metadata: {},
  },
  {
    id: "rotation-token-pack",
    slug: "rotation-token-pack",
    name: "Rotation Token Pack",
    description: "Enough tokens to unlock a meaningful permanent Rogue upgrade.",
    tokenAmount: 30_000,
    usdCents: 499,
    currency: "usd",
    stripePriceId: "price_1TUAsAF1dYAmNp1wDRXlxcgJ",
    active: true,
    sortOrder: 20,
    metadata: {},
  },
  {
    id: "playoff-token-pack",
    slug: "playoff-token-pack",
    name: "Playoff Token Pack",
    description: "A strong pack for starter upgrades, coach recruitment, and run utility.",
    tokenAmount: 75_000,
    usdCents: 999,
    currency: "usd",
    stripePriceId: "price_1TUAspF1dYAmNp1wr2v1YCup",
    active: true,
    sortOrder: 30,
    metadata: { popular: true },
  },
  {
    id: "finals-token-pack",
    slug: "finals-token-pack",
    name: "Finals Token Pack",
    description: "A premium pack for multiple permanent upgrades and future Rogue planning.",
    tokenAmount: 175_000,
    usdCents: 1_999,
    currency: "usd",
    stripePriceId: "price_1TUAtSF1dYAmNp1w7UlwjxL3",
    active: true,
    sortOrder: 40,
    metadata: {},
  },
  {
    id: "galaxy-token-pack",
    slug: "galaxy-token-pack",
    name: "Galaxy Token Pack",
    description: "A high-end pack that meaningfully accelerates the long-term Galaxy chase.",
    tokenAmount: 500_000,
    usdCents: 4_999,
    currency: "usd",
    stripePriceId: "price_1TUAu5F1dYAmNp1wv6Je2vel",
    active: true,
    sortOrder: 50,
    metadata: {},
  },
];
