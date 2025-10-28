// Safely coerce a string or number into a finite number
export function toNumberSafe(v: string | number): number {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

// Profit/Loss (absolute difference between current value and cost basis)
export function profitLoss(current: number, costBasis: number): number {
  return current - costBasis;
}

// Percent change between two values
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Compound Annual Growth Rate (CAGR)
export function cagr(
  finalValue: number,
  initialValue: number,
  years: number
): number {
  if (initialValue <= 0 || years <= 0) return 0;
  return Math.pow(finalValue / initialValue, 1 / years) - 1;
}

// Sum helper
export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

// 🔹 Optional: Dividend yield (annual dividends / current price)
export function dividendYield(
  annualDividends: number,
  currentPrice: number
): number {
  if (currentPrice <= 0) return 0;
  return (annualDividends / currentPrice) * 100;
}

// 🔹 Optional: Total return ((current + dividends - invested) / invested)
export function totalReturn(
  invested: number,
  currentValue: number,
  dividends: number
): number {
  if (invested <= 0) return 0;
  return ((currentValue + dividends - invested) / invested) * 100;
}
