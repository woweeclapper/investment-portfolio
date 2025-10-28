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
    if (currentPrice == null) {
      return { costBasis, currentValue: null, pl: null, pct: null };
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
