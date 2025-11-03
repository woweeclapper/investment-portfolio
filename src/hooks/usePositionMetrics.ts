// src/hooks/usePositionMetrics.ts
import { useMemo } from 'react';
import { profitLoss, percentChange } from '../utils/calculations';

type PositionInput = {
  amount: number;
  buyPrice: number;
  currentPrice?: number | null;
};

export function usePositionMetrics({
  amount,
  buyPrice,
  currentPrice,
}: PositionInput) {
  return useMemo(() => {
    const costBasis = amount * buyPrice;

    // If no current price yet, return safe defaults
    if (currentPrice == null) {
      return { costBasis, currentValue: 0, pl: 0, pct: 0 };
    }

    const currentValue = amount * currentPrice;
    return {
      costBasis,
      currentValue,
      pl: profitLoss(currentValue, costBasis),
      pct: percentChange(currentValue, costBasis),
    };
  }, [amount, buyPrice, currentPrice]);
}
