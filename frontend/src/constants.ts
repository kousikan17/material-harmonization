export const ALLOWED_CPSE_SECTORS = [
  "Agriculture",
  "Mining & Exploration",
  "Manufacturing, Processing & Generation",
  "Services",
] as const;

export type CPSESector = typeof ALLOWED_CPSE_SECTORS[number];
