// src/types.ts

export type Dividend = {
  id: string;
  source: string;
  amount: number;
  date: string;
};

export type Holding = {
  id: string;
  ticker: string;
  shares: number;
  buyPrice: number;
  currentPrice?: number;
};

// ✅ New type for crypto holdings
export type CryptoHolding = {
  id: string;
  coin: string;
  amount: number;
  buyPrice: number;
  currentPrice?: number;
};

export type PortfolioSnapshot = {
  id: string;
  date: string;
  stockValue: number;
  cryptoValue: number;
  dividends: number;
};
