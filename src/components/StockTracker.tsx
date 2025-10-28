import { useState, useEffect, useMemo } from 'react';
import ConfirmModal from './ConfirmModal';
import Badge from './Badge';
import Button from './Button';
import FormError from './FormError';
import { fetchStockPrice } from '../utils/api';
import {
  saveData,
  loadData,
  saveConfirmFlags,
  loadConfirmFlags,
} from '../utils/storage';
import type { ConfirmFlags } from '../utils/storage';
import { toNumberSafe } from '../utils/calculations';
import { isValidTicker, isPositiveNumber } from '../utils/validators';
import { debounce } from '../utils/debounce';
import { StockRow } from './StockRow';

type Stock = {
  id: number;
  ticker: string;
  shares: number;
  buyPrice: number;
  currentPrice?: number;
};

type Prefs = {
  confirmRemove: boolean;
  confirmEdit: boolean;
};

export default function StockTracker() {
  const [stocks, setStocks] = useState<Stock[]>(() =>
    loadData<Stock[]>('stocks', [])
  );
  const [prefs, setPrefs] = useState<Prefs>(() =>
    loadData<Prefs>('stockPrefs', { confirmRemove: true, confirmEdit: true })
  );

  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState<
    null | ((dontAskAgain: boolean) => void)
  >(null);

  // Per-module skipConfirm synced with global confirm flags
  const [skipConfirm, setSkipConfirm] = useState<boolean>(
    () => loadConfirmFlags().stocks
  );

  // Persist stocks & prefs
  useEffect(() => {
    saveData('stocks', stocks);
  }, [stocks]);

  useEffect(() => {
    saveData('stockPrefs', prefs);
  }, [prefs]);

  // Persist module-level skipConfirm into shared confirm flags
  useEffect(() => {
    const flags: ConfirmFlags = loadConfirmFlags();
    saveConfirmFlags({ ...flags, stocks: skipConfirm });
  }, [skipConfirm]);

  // Fetch current prices initially and every 5 minutes
  const tickers = stocks.map((s) => s.ticker).join(',');
  useEffect(() => {
    if (stocks.length === 0) return;
    let canceled = false;

    const loadPrices = async () => {
      const updated = await Promise.all(
        stocks.map(async (s) => {
          const price = await fetchStockPrice(s.ticker);
          return price != null ? { ...s, currentPrice: price } : s;
        })
      );
      if (!canceled) setStocks(updated);
    };

    const debouncedFetch = debounce(loadPrices, 500);
    debouncedFetch(); // run immediately once
    const interval = setInterval(debouncedFetch, 300_000);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [tickers]);

  // Editing
  const startEdit = (stock: Stock) => {
    setEditingId(stock.id);
    setTicker(stock.ticker);
    setShares(stock.shares.toString());
    setBuyPrice(stock.buyPrice.toString());
  };

  const isValidForm =
    isValidTicker(ticker) &&
    isPositiveNumber(shares) &&
    isPositiveNumber(buyPrice);

  const addOrUpdateStock = () => {
    if (!isValidForm) return;

    const doUpdate = () => {
      if (editingId) {
        setStocks((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  ticker: ticker.toUpperCase(),
                  shares: toNumberSafe(shares),
                  buyPrice: toNumberSafe(buyPrice),
                }
              : s
          )
        );
        setEditingId(null);
      } else {
        setStocks((prev) => [
          ...prev,
          {
            id: Date.now(),
            ticker: ticker.toUpperCase(),
            shares: toNumberSafe(shares),
            buyPrice: toNumberSafe(buyPrice),
          },
        ]);
      }
      setTicker('');
      setShares('');
      setBuyPrice('');
    };

    if (editingId && prefs.confirmEdit && !skipConfirm) {
      setModalMessage(`Update ${ticker.toUpperCase()} with new values?`);
      setModalAction(() => (dontAskAgain: boolean) => {
        doUpdate();
        if (dontAskAgain) {
          setPrefs((p) => ({ ...p, confirmEdit: false }));
          setSkipConfirm(true);
        }
      });
      setShowModal(true);
    } else {
      doUpdate();
    }
  };

  const removeStock = (id: number, t: string) => {
    const doRemove = () => setStocks((prev) => prev.filter((s) => s.id !== id));

    if (prefs.confirmRemove && !skipConfirm) {
      setModalMessage(`Are you sure you want to remove ${t}?`);
      setModalAction(() => (dontAskAgain: boolean) => {
        doRemove();
        if (dontAskAgain) {
          setPrefs((p) => ({ ...p, confirmRemove: false }));
          setSkipConfirm(true);
        }
      });
      setShowModal(true);
    } else {
      doRemove();
    }
  };

  const restoreConfirmations = () => {
    setPrefs({ confirmRemove: true, confirmEdit: true });
    setSkipConfirm(false);
  };

  // Memoized portfolio total
  const totalValue = useMemo(() => {
    return stocks.reduce((sum, s) => {
      const price = s.currentPrice ?? 0;
      return sum + s.shares * price;
    }, 0);
  }, [stocks]);

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Stock Tracker
        {skipConfirm && <Badge label="Confirmations off" tone="danger" />}
      </h2>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <input
            type="text"
            placeholder="Ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className={!isValidTicker(ticker) && ticker ? 'input-error' : ''}
          />
          {!isValidTicker(ticker) && ticker && (
            <FormError message="Ticker must be 1–5 letters." />
          )}
        </div>

        <div>
          <input
            type="number"
            placeholder="Shares"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className={!isPositiveNumber(shares) && shares ? 'input-error' : ''}
          />
          {!isPositiveNumber(shares) && shares && (
            <FormError message="Shares must be a positive number." />
          )}
        </div>

        <div>
          <input
            type="number"
            placeholder="Buy Price"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            className={
              buyPrice && !isPositiveNumber(buyPrice) ? 'input-error' : ''
            }
          />
          {buyPrice && !isPositiveNumber(buyPrice) && (
            <FormError message="Buy price must be positive." />
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button onClick={addOrUpdateStock} disabled={!isValidForm}>
            {editingId ? 'Update' : 'Add'}
          </Button>
          {editingId && (
            <Button
              variant="muted"
              onClick={() => {
                setEditingId(null);
                setTicker('');
                setShares('');
                setBuyPrice('');
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <ul>
        {stocks.map((s) => (
          <StockRow
            key={s.id}
            stock={s}
            onEdit={startEdit}
            onRemove={removeStock}
          />
        ))}
      </ul>

      <div style={{ marginTop: '0.75rem' }}>
        <strong>Total Value:</strong> $
        {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>

      {showModal && modalAction && (
        <ConfirmModal
          message={modalMessage}
          onConfirm={(dontAskAgain) => {
            modalAction(dontAskAgain);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div style={{ marginTop: '0.75rem' }}>
        <Button variant="muted" onClick={restoreConfirmations}>
          Restore Confirmations
        </Button>
      </div>
    </div>
  );
}
