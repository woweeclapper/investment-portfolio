// src/hooks/usePositionMetrics.ts
import { useMemo } from 'react';
import { profitLoss, percentChange } from '../utils/Math & Logic/calculations';

type PositionInput = {
  amount: number;
  buyPrice: number;
  currentPrice?: number | null;
};

type PositionMetrics = {
  costBasis: number;
  currentValue: number;
  pl: number;
  pct: number;
};

export function usePositionMetrics({
  amount,
  buyPrice,
  currentPrice,
}: PositionInput): PositionMetrics {
  return useMemo(() => {
    const costBasis = amount * buyPrice;

    if (currentPrice == null) {
      // Safe defaults when no price yet
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
