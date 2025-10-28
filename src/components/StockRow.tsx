import Button from './Button';
import { usePositionMetrics } from '../hooks/usePositionMetrics';

type Stock = {
  id: number;
  ticker: string;
  shares: number;
  buyPrice: number;
  currentPrice?: number;
};

type Props = {
  stock: Stock;
  onEdit: (s: Stock) => void;
  onRemove: (id: number, ticker: string) => void;
};

export function StockRow({ stock, onEdit, onRemove }: Props) {
  const { costBasis, currentValue, pl, pct } = usePositionMetrics({
    amount: stock.shares,
    buyPrice: stock.buyPrice,
    currentPrice: stock.currentPrice,
  });

  return (
    <li>
      {stock.ticker} — {stock.shares} shares @ ${stock.buyPrice.toFixed(2)} |
      Cost Basis: ${costBasis.toFixed(2)}
      {currentValue != null && (
        <>
          {' '}
          | Current: ${stock.currentPrice?.toFixed(2)} | Value: $
          {currentValue.toFixed(2)} | P/L: {pl?.toFixed(2)} ({pct?.toFixed(2)}%)
        </>
      )}
      <Button onClick={() => onEdit(stock)}>Edit</Button>
      <Button variant="danger" onClick={() => onRemove(stock.id, stock.ticker)}>
        Remove
      </Button>
    </li>
  );
}
