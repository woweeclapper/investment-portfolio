import Button from '../../UI Primitives/Button';
import { usePositionMetrics } from '../../../hooks/usePositionMetrics';

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

  const assetLabel = holding.amount <= 1 ? 'asset' : 'assets';

  return (
    <li style={{ marginBottom: '0.5rem' }}>
      <strong>{holding.coin.toUpperCase()}</strong> — {holding.amount.toLocaleString()} {assetLabel} @ $
      {Number(holding.buyPrice.toFixed(2)).toLocaleString()} | Cost Basis: $
      {costBasis.toLocaleString()} | Current: ${price?.toLocaleString()}
      {price != null && (
        <>
          {' '}
          | Value: ${Number(currentValue.toFixed(2)).toLocaleString()} | Value: ${currentValue?.toLocaleString()} | P/L:{' '}
          <span style={{ color: pl >= 0 ? 'green' : 'red' }}>
            {pl != null ? pl.toLocaleString() : '—'}
            {pct != null && ` (${pct.toLocaleString()}%)`}
          </span>
        </>
      )}
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
