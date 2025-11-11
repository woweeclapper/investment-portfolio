import { useEffect, useState, useMemo } from 'react';
import ConfirmModal from '../../Feedback & Safety/ConfirmModal';
import Badge from '../../UI Primitives/Badge';
import Button from '../../UI Primitives/Button';
import FormError from '../../Feedback & Safety/FormError';
import {
  saveData,
  loadData,
  saveConfirmFlags,
  loadConfirmFlags,
} from '../../../utils/Data & API/storage';
import type { ConfirmFlags } from '../../../utils/Data & API/storage';
import { fetchCryptoPrices } from '../../../utils/Data & API/api';
import { HoldingRow } from './HoldingRow';
import { debounce } from '../../../utils/Infrastucture/debounce';
import { isPositiveNumber } from '../../../utils/Data & API/validators';

// ✅ Rename the type to avoid confusion with stock "Holding"
type CryptoHolding = {
  id: number;            // keep number for localStorage (Date.now())
  coin: string;          // e.g., "bitcoin"
  amount: number;
  buyPrice: number;
  currentPrice?: number;
};

export default function CryptoHoldings() {
  const [holdings, setHoldings] = useState<CryptoHolding[]>(() =>
    loadData<CryptoHolding[]>('cryptoHoldings', [])
  );
  const [prices, setPrices] = useState<Record<string, { usd: number }>>({});
  const [coin, setCoin] = useState('bitcoin');
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [skipConfirm, setSkipConfirm] = useState<boolean>(
    () => loadConfirmFlags().crypto
  );

  // Persist skipConfirm flag
  useEffect(() => {
    const flags: ConfirmFlags = loadConfirmFlags();
    saveConfirmFlags({ ...flags, crypto: skipConfirm });
  }, [skipConfirm]);

  // Persist holdings
  useEffect(() => {
    saveData('cryptoHoldings', holdings);
  }, [holdings]);

  // Debounced fetch for live prices
  const debouncedLoad = useMemo(
    () =>
      debounce(async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await fetchCryptoPrices();
          setPrices(data);
          setHoldings((prev) =>
            prev.map((h) => ({
              ...h,
              currentPrice: data[h.coin]?.usd ?? h.currentPrice,
            }))
          );
        } catch (err) {
          console.error('Failed to fetch crypto prices', err);
          setError('Failed to load crypto prices. Please try again.');
        } finally {
          setLoading(false);
        }
      }, 500),
    []
  );

  // Initial + interval fetch
  useEffect(() => {
    debouncedLoad();
    const interval = setInterval(debouncedLoad, 60_000);
    return () => clearInterval(interval);
  }, [debouncedLoad]);

  const addHolding = () => {
    const amt = parseFloat(amount);
    const bp = parseFloat(buyPrice) || 0;
    if (!coin || !Number.isFinite(amt) || amt <= 0) return;

    const newHolding: CryptoHolding = {
      id: Date.now(),
      coin,
      amount: amt,
      buyPrice: bp,
      currentPrice: prices[coin]?.usd ?? undefined,
    };

    setHoldings((prev) => [...prev, newHolding]);
    setAmount('');
    setBuyPrice('');
  };

  const removeHolding = (id: number) => {
    if (skipConfirm) {
      setHoldings((prev) => prev.filter((h) => h.id !== id));
    } else {
      setConfirmId(id);
    }
  };

  const confirmRemove = (dontAskAgain: boolean) => {
    if (confirmId != null) {
      setHoldings((prev) => prev.filter((h) => h.id !== confirmId));
      setConfirmId(null);
      if (dontAskAgain) setSkipConfirm(true);
    }
  };

  const totalValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const p = h.currentPrice ?? prices[h.coin]?.usd ?? 0;
      return sum + h.amount * p;
    }, 0);
  }, [holdings, prices]);

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Crypto Holdings
        {skipConfirm && <Badge label="Confirmations off" tone="danger" />}
      </h2>

      <div
        style={{
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div>
          <select value={coin} onChange={(e) => setCoin(e.target.value)}>
            <option value="bitcoin">BTC</option>
            <option value="ethereum">ETH</option>
            <option value="solana">SOL</option>
            <option value="ripple">XRP</option>
            <option value="dogecoin">DOGE</option>
            <option value="sui">SUI</option>
            <option value="binancecoin">BNB</option>
          </select>
        </div>

        <div>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={!isPositiveNumber(amount) && amount ? 'input-error' : ''}
            min="0"
            step="any"
          />
          {!isPositiveNumber(amount) && amount && (
            <FormError message="Amount must be a positive number." />
          )}
        </div>

        <div>
          <input
            type="number"
            placeholder="Buy Price (optional)"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            className={
              buyPrice && !isPositiveNumber(buyPrice) ? 'input-error' : ''
            }
            min="0"
            step="any"
          />
          {buyPrice && !isPositiveNumber(buyPrice) && (
            <FormError message="Buy price must be positive." />
          )}
        </div>

        <Button onClick={addHolding} disabled={!amount}>
          Add
        </Button>
      </div>

      {loading && <p style={{ color: '#9aa4ad' }}>Loading latest prices…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {holdings.length === 0 && !loading && !error ? (
        <p style={{ color: '#9aa4ad' }}>
          No holdings yet. Add your first crypto position above.
        </p>
      ) : (
        <ul>
          {holdings.map((h) => (
            <HoldingRow
              key={h.id}
              holding={h}
              price={prices[h.coin]?.usd ?? h.currentPrice ?? null}
              onRemove={removeHolding}
            />
          ))}
        </ul>
      )}

      <div style={{ marginTop: 12 }}>
        <strong>Total Value:</strong> $
        {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Button variant="muted" onClick={() => setSkipConfirm(false)}>
          Restore Confirmations
        </Button>
      </div>

      {confirmId != null && (
        <ConfirmModal
          message="Are you sure you want to remove this holding?"
          onConfirm={confirmRemove}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
