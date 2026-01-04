import Button from '../../UI Primitives/Button';
import { usePositionMetrics } from '../../../hooks/usePositionMetrics';
import type { Holding } from '../../../types/type';

type Props = {
  stock: Holding;
  onEdit: (s: Holding) => void;
  onRemove: (id: string, ticker: string) => void;
};

export function StockRow({ stock, onEdit, onRemove }: Props) {
  const { costBasis, currentValue, pl, pct } = usePositionMetrics({
    amount: stock.shares,
    buyPrice: stock.buyPrice,
    currentPrice: stock.currentPrice,
  });

  const shareLabel = stock.shares <= 1 ? 'share' : 'shares';

  return (
    <li style={{ marginBottom: '0.5rem' }}>
      <strong>{stock.ticker}</strong> — {Number(stock.shares).toLocaleString()}{' '}
      {shareLabel} @ ${Number(stock.buyPrice.toFixed(2)).toLocaleString()}| Cost
      Basis: ${Number(costBasis.toFixed(2)).toLocaleString()} | Current:{' '}
      {stock.currentPrice !== undefined
        ? `$${Number(stock.currentPrice.toFixed(2)).toLocaleString()}`
        : '—'}{' '}
      | Value: ${Number(currentValue.toFixed(2)).toLocaleString()} | P/L:{' '}
      <span style={{ color: pl >= 0 ? 'green' : 'red' }}>
        {Number(pl.toFixed(2)).toLocaleString()}({pct.toFixed(2)}%)
      </span>{' '}
      <Button onClick={() => onEdit(stock)}>Edit</Button>
      <Button variant="danger" onClick={() => onRemove(stock.id, stock.ticker)}>
        Remove
      </Button>
    </li>
  );
}
