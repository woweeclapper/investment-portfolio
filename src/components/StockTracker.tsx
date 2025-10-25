import { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import Badge from './Badge';
import Button from './Button';
import { fetchStockPrice } from '../utils/api';
import {
  saveData,
  loadData,
  saveConfirmFlags,
  loadConfirmFlags,
} from '../utils/storage';

import type { ConfirmFlags } from '../utils/storage';

import { toNumberSafe, percentChange, profitLoss } from '../utils/calculations';
import { isValidTicker, isPositiveNumber } from '../utils/validators';

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
  const [stocks, setStocks] = useState<Stock[]>(() => loadData<Stock[]>('stocks', []));
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
  const [modalAction, setModalAction] = useState<null | ((dontAskAgain: boolean) => void)>(null);

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

    const fetchPrices = async () => {
      const updated = await Promise.all(
        stocks.map(async (s) => {
          const price = await fetchStockPrice(s.ticker);
          return price != null ? { ...s, currentPrice: price } : s;
        })
      );
      if (!canceled) setStocks(updated);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 300_000);
    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [tickers]);

  const startEdit = (stock: Stock) => {
    setEditingId(stock.id);
    setTicker(stock.ticker);
    setShares(stock.shares.toString());
    setBuyPrice(stock.buyPrice.toString());
  };

  const addOrUpdateStock = () => {
    if (!ticker || !shares || !buyPrice) return;

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

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Stock Tracker
        {skipConfirm && <Badge label="Confirmations off" tone="danger" />}
      </h2>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          type="text"
          placeholder="Ticker"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className={!isValidTicker(ticker) && ticker ? "input-error" : ""}
        />

        <input
          type="number"
          placeholder="Shares"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className={!isPositiveNumber(shares) && shares ? "input-error" : ""}
        />

        <input
          type="number"
          placeholder="Buy Price"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
        />
        <Button onClick={addOrUpdateStock}>{editingId ? 'Update' : 'Add'}</Button>
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

      <ul>
        {stocks.map((s) => {
          const costBasis = s.shares * s.buyPrice;
          const currentValue = s.currentPrice != null ? s.shares * s.currentPrice : null;
          const pl = currentValue != null ? profitLoss(currentValue, costBasis) : null;
          const pct = currentValue != null ? percentChange(currentValue, costBasis) : null;

          return (
            <li key={s.id} style={{ marginBottom: '0.5rem' }}>
              {s.ticker} — {s.shares} shares @ ${s.buyPrice.toFixed(2)}
              {s.currentPrice != null && (
                <>
                  {' '}| Current: ${s.currentPrice.toFixed(2)}
                  {' '}| Value: ${currentValue?.toFixed(2)}
                  {' '}| P/L: {pl != null ? pl.toFixed(2) : '—'}
                  {pct != null && ` (${pct.toFixed(2)}%)`}
                </>
              )}
              {' '}
              <Button variant="muted" onClick={() => startEdit(s)}>Edit</Button>{' '}
              <Button variant="danger" onClick={() => removeStock(s.id, s.ticker)}>Remove</Button>
            </li>
          );
        })}
      </ul>

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
