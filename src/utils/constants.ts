// Module keys (used for confirm flags, storage, etc.)
export const MODULE_KEYS = {
  crypto: 'crypto',
  stocks: 'stocks',
  dividends: 'dividends',
} as const;

export type ModuleKey = keyof typeof MODULE_KEYS;

// Shared color palette
export const COLORS = {
  primary: '#4CAF50',
  danger: '#dc3545',
  muted: '#6c757d',
  bgCard: '#1f2428',
  textPrimary: '#eaecef',
  textMuted: '#9aa4ad',
} as const;

// Crypto lists
export const COINS_MAIN = ['BTC', 'ETH'] as const;
export const COINS_SUPP = ['SOL', 'ADA', 'AVAX', 'MATIC'] as const;

// 🔹 Optional: unified export for all supported coins
export const SUPPORTED_COINS = [...COINS_MAIN, ...COINS_SUPP] as const;

// 🔹 Optional: chart palette (ties directly to your chartColors.ts)
export const CHART_COLORS = {
  stocks: {
    border: 'rgba(54, 162, 235, 1)',
    background: 'rgba(54, 162, 235, 0.2)',
  },
  crypto: {
    border: 'rgba(153, 102, 255, 1)',
    background: 'rgba(153, 102, 255, 0.2)',
  },
  dividends: {
    border: 'rgba(75, 192, 192, 1)',
    background: 'rgba(75, 192, 192, 0.2)',
  },
  total: {
    border: 'rgba(255, 159, 64, 1)',
    background: 'rgba(255, 159, 64, 0.2)',
  },
} as const;
