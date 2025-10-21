import { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import { fetchStockPrice } from '../utils/api';
import { saveData, loadData } from '../utils/storage';

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

  // Persist stocks & prefs
  useEffect(() => {
    saveData('stocks', stocks);
  }, [stocks]);

  useEffect(() => {
    saveData('stockPrefs', prefs);
  }, [prefs]);

  // Fetch current prices initially and every 5 minutes
  useEffect(() => {
    const fetchPrices = async () => {
      if (stocks.length === 0) return;
      const updated = await Promise.all(
        stocks.map(async (s) => {
          const price = await fetchStockPrice(s.ticker);
          return price != null ? { ...s, currentPrice: price } : s;
        })
      );
      setStocks(updated);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 300_000);
    return () => clearInterval(interval);
  }, [stocks.map((s) => s.ticker).join(',')]);

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
                  shares: parseFloat(shares),
                  buyPrice: parseFloat(buyPrice),
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
            shares: parseFloat(shares),
            buyPrice: parseFloat(buyPrice),
          },
        ]);
      }
      setTicker('');
      setShares('');
      setBuyPrice('');
    };

    if (editingId && prefs.confirmEdit) {
      setModalMessage(`Update ${ticker.toUpperCase()} with new values?`);
      setModalAction(() => (dontAskAgain: boolean) => {
        doUpdate();
        if (dontAskAgain) setPrefs((p) => ({ ...p, confirmEdit: false }));
      });
      setShowModal(true);
    } else {
      doUpdate();
    }
  };

  const removeStock = (id: number, t: string) => {
    const doRemove = () => setStocks((prev) => prev.filter((s) => s.id !== id));

    if (prefs.confirmRemove) {
      setModalMessage(`Are you sure you want to remove ${t}?`);
      setModalAction(() => (dontAskAgain: boolean) => {
        doRemove();
        if (dontAskAgain) setPrefs((p) => ({ ...p, confirmRemove: false }));
      });
      setShowModal(true);
    } else {
      doRemove();
    }
  };

  const restoreConfirmations = () => {
    setPrefs({ confirmRemove: true, confirmEdit: true });
  };

  return (
    <div>
      <h2>Stock Tracker</h2>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          type="text"
          placeholder="Ticker"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />
        <input
          type="number"
          placeholder="Shares"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
        />
        <input
          type="number"
          placeholder="Buy Price"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
        />
        <button onClick={addOrUpdateStock}>{editingId ? 'Update' : 'Add'}</button>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setTicker('');
              setShares('');
              setBuyPrice('');
            }}
          >
            Cancel
          </button>
        )}
      </div>

      <ul>
        {stocks.map((s) => {
          const costBasis = s.shares * s.buyPrice;
          const currentValue = s.currentPrice != null ? s.shares * s.currentPrice : null;
          const profitLoss = currentValue != null ? currentValue - costBasis : null;

          return (
            <li key={s.id} style={{ marginBottom: '0.5rem' }}>
              {s.ticker} — {s.shares} shares @ ${s.buyPrice.toFixed(2)}
              {s.currentPrice != null && (
                <>
                  {' '}| Current: ${s.currentPrice.toFixed(2)}
                  {' '}| Value: ${currentValue?.toFixed(2)}
                  {' '}| P/L: {profitLoss != null ? profitLoss.toFixed(2) : '—'}
                </>
              )}
              {' '}
              <button onClick={() => startEdit(s)}>Edit</button>
              <button onClick={() => removeStock(s.id, s.ticker)}>Remove</button>
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

      <button onClick={restoreConfirmations} style={{ marginTop: '0.75rem' }}>
        Restore Confirmations
      </button>
    </div>
  );
}
