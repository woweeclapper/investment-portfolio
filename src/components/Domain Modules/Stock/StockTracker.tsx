import { useState, useEffect, useMemo } from 'react';
import ConfirmModal from '../../Feedback & Safety/ConfirmModal';
import Badge from '../../UI Primitives/Badge';
import Button from '../../UI Primitives/Button';
import FormError from '../../Feedback & Safety/FormError';
import { fetchStockPrice } from '../../../utils/Data & API/api';
import {
  saveConfirmFlags,
  loadConfirmFlags,
} from '../../../utils/Data & API/storage';
import type { ConfirmFlags } from '../../../utils/Data & API/storage';
import { toNumberSafe } from '../../../utils/Math & Logic/calculations';
import {
  isValidTicker,
  isPositiveNumber,
} from '../../../utils/Data & API/validators';
import { debounce } from '../../../utils/Infrastructure/debounce';
import { StockRow } from './StockRow';
import { supabase } from '../../../utils/Infrastructure/supabaseClient';

// Import Holding from your shared types file
import type { Holding } from '../../../types/type';

type Prefs = {
  confirmRemove: boolean;
  confirmEdit: boolean;
};

export default function StockTracker() {
  const [stocks, setStocks] = useState<Holding[]>([]);
  const [prefs, setPrefs] = useState<Prefs>({
    confirmRemove: true,
    confirmEdit: true,
  });

  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // Load holdings from Supabase on mount
  useEffect(() => {
    // define the DB row type inside this effect (or at the top of the file if you prefer)
    type HoldingRowDB = {
      id: string;
      ticker: string;
      shares: number;
      buy_price: number;
      currentPrice?: number | null;
    };

    const fetchStocks = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('ticker');

      if (error) {
        console.error(error);
        return;
      }

      // normalize snake_case → camelCase and ensure currentPrice is number | null
      // After supabase fetch
      const normalized: Holding[] = (data as HoldingRowDB[]).map((r) => ({
        id: r.id,
        ticker: r.ticker,
        shares: r.shares,
        buyPrice: r.buy_price,
        currentPrice: r.currentPrice ?? undefined, // use undefined, not null
      }));

      setStocks(normalized);
    };

    fetchStocks();
  }, []);

  // Persist module-level skipConfirm into shared confirm flags
  useEffect(() => {
    const flags: ConfirmFlags = loadConfirmFlags();
    saveConfirmFlags({ ...flags, stocks: skipConfirm });
  }, [skipConfirm]);

  // Fetch current prices initially and every 5 minutes
  useEffect(() => {
    if (stocks.length === 0) return;
    let canceled = false;

    const loadPrices = async () => {
      const updated = await Promise.all(
        stocks.map(async (s) => {
          const price = await fetchStockPrice(s.ticker);
          //testing rendering and shit
          //console.log('Fetched price for', s.ticker, '=>', price);
          return price != null ? { ...s, currentPrice: price } : s;
        })
      );
      if (!canceled) setStocks(updated);
    };

    const debouncedFetch = debounce(loadPrices, 500);
    debouncedFetch();
    const interval = setInterval(debouncedFetch, 300_000);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [stocks]);
  
  const startEdit = (stock: Holding) => {
    setEditingId(stock.id);
    setTicker(stock.ticker);
    setShares(stock.shares.toString());
    setBuyPrice(stock.buyPrice.toString());
  };

  const isValidForm =
    isValidTicker(ticker) &&
    isPositiveNumber(shares) &&
    isPositiveNumber(buyPrice);

  const addOrUpdateStock = async () => {
    if (!isValidForm) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const doUpdate = async () => {
      if (editingId) {
        const { error } = await supabase
          .from('holdings')
          .update({
            ticker: ticker.toUpperCase(),
            shares: toNumberSafe(shares),
            buy_price: toNumberSafe(buyPrice), // store snake_case in DB
          })
          .eq('id', editingId)
          .eq('user_id', user.id);
        if (error) {
          console.error(error);
        } else {
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
        }
      } else {
        const { data, error } = await supabase
          .from('holdings')
          .insert([
            {
              user_id: user.id,
              ticker: ticker.toUpperCase(),
              shares: toNumberSafe(shares),
              buy_price: toNumberSafe(buyPrice),
            },
          ])
          .select()
          .single();
        if (error) {
          console.error(error);
        } else {
          // Normalize returned row to Holding shape
          const inserted: Holding = {
            id: data.id,
            ticker: data.ticker,
            shares: data.shares,
            buyPrice: data.buy_price ?? data.buyPrice,
            currentPrice: data.currentPrice ?? undefined, //  use undefined, not null
          };

          setStocks((prev) => [...prev, inserted]);
        }
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

  const removeStock = (id: string, t: string) => {
    const doRemove = async () => {
      const { error } = await supabase.from('holdings').delete().eq('id', id);
      if (error) {
        console.error(error);
      } else {
        setStocks((prev) => prev.filter((s) => s.id !== id));
      }
    };

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

  // Memoized portfolio totals: value, cost basis, and P/L
  const totalValue = useMemo(() => {
    return stocks.reduce((sum, s) => {
      const price = s.currentPrice ?? 0;
      return sum + s.shares * price;
    }, 0);
  }, [stocks]);

  const { totalCostBasis, totalPL } = useMemo(() => {
    return stocks.reduce(
      (acc, s) => {
        const price = s.currentPrice ?? 0;
        const costBasis = s.shares * s.buyPrice;
        const currentValue = s.shares * price;
        acc.totalCostBasis += costBasis;
        acc.totalPL += currentValue - costBasis;
        return acc;
      },
      { totalCostBasis: 0, totalPL: 0 }
    );
  }, [stocks]);

  // compute percentage separately
  const totalPct = totalCostBasis > 0 ? (totalPL / totalCostBasis) * 100 : 0;


//make it so a new holding added to an existing stocks adds to the amount instead of creating a new entry
//the math would be adding the holding together and averaging the buy price to update the cost basis
  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
        Stock Tracker
        {skipConfirm && <Badge label="Confirmations off" tone="danger" />}
      </h2>

      {/* Form */}


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

        <div style={{ display: 'flex', gap: '0.5rem', alignContent: 'center', justifyContent: 'center' }}>
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

      {stocks.length === 0 ? (
        <p style={{ color: '#9aa4ad' }}>
          No stocks yet. Add your first position above.
        </p>
      ) : (
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
      )}

      <div style={{ marginTop: '0.75rem' }}>
        <strong>Total Value:</strong> $
        {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} |{' '}
        <strong>Total Cost Basis:</strong> $
        {Number(totalCostBasis.toFixed(2)).toLocaleString()} |{' '}
        <strong>P/L:</strong>{' '}
        <span style={{ color: totalPL >= 0 ? 'green' : 'red' }}>
          {Number(totalPL.toFixed(2)).toLocaleString()}(
          {Number(totalPct.toFixed(2)).toLocaleString()}%)
        </span>
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
