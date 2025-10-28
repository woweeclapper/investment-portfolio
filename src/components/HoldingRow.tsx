import Button from './Button';
import { usePositionMetrics } from '../hooks/usePositionMetrics';

type Holding = {
  id: number;
  coin: string;
  amount: number;
  buyPrice: number;
  currentPrice?: number;
};

type Props = {
  holding: Holding;
  price: number | null;
  onRemove: (id: number) => void;
};

export function HoldingRow({ holding, price, onRemove }: Props) {
  const { costBasis, currentValue, pl, pct } = usePositionMetrics({
    amount: holding.amount,
    buyPrice: holding.buyPrice,
    currentPrice: price,
  });

  return (
    <li style={{ marginBottom: '0.5rem' }}>
      {holding.coin.toUpperCase()} — {holding.amount} @ $
      {holding.buyPrice.toFixed(2)} | Cost Basis: ${costBasis.toFixed(2)}
      {price != null && (
        <>
          {' '}
          | Current: ${price.toFixed(2)} | Value: {currentValue?.toFixed(2)} |
          P/L: {pl != null ? pl.toFixed(2) : '—'}
          {pct != null && ` (${pct.toFixed(2)}%)`}
        </>
      )}{' '}
      <Button
        variant="danger"
        onClick={() => onRemove(holding.id)}
        style={{ marginLeft: 8 }}
      >
        Remove
      </Button>
    </li>
  );
}
