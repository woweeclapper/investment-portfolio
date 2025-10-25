import { useEffect, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import Badge from './Badge';
import Button from './Button';
import {
  saveData,
  loadData,
  saveConfirmFlags,
  loadConfirmFlags,
} from '../utils/storage';
import type { ConfirmFlags } from '../utils/storage';   // ✅ type-only import
import { fetchCryptoPrices } from '../utils/api';
import { profitLoss, percentChange } from '../utils/calculations';

type Holding = {
  id: number;
  coin: string; // e.g. 'bitcoin', 'ethereum'
  amount: number;
  buyPrice: number;
  currentPrice?: number;
};

export default function CryptoHoldings() {

    // Force an error for testing
  //throw new Error("Test crash in CryptoHoldings");

  const [holdings, setHoldings] = useState<Holding[]>(() =>
    loadData<Holding[]>('cryptoHoldings', [])
  );
  const [prices, setPrices] = useState<Record<string, { usd: number }>>({});
  const [coin, setCoin] = useState('bitcoin');
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

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

  // Fetch live prices and update holdings
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchCryptoPrices();
      if (cancelled) return;
      setPrices(data);

      setHoldings((prev) =>
        prev.map((h) => ({
          ...h,
          currentPrice: data[h.coin]?.usd ?? h.currentPrice,
        }))
      );
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const addHolding = () => {
    const amt = parseFloat(amount);
    const bp = parseFloat(buyPrice) || 0;
    if (!coin || !Number.isFinite(amt) || amt <= 0) return;

    const newHolding: Holding = {
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

  const totalValue = holdings.reduce((sum, h) => {
    const p = h.currentPrice ?? prices[h.coin]?.usd ?? 0;
    return sum + h.amount * p;
  }, 0);

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Crypto Holdings
        {skipConfirm && <Badge label="Confirmations off" tone="danger" />}
      </h2>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <select value={coin} onChange={(e) => setCoin(e.target.value)}>
          <option value="bitcoin">BTC</option>
          <option value="ethereum">ETH</option>
          <option value="solana">SOL</option>
          <option value="ripple">XRP</option>
          <option value="dogecoin">DOGE</option>
          <option value="sui">SUI</option>
          <option value="binancecoin">BNB</option>
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="any"
        />

        <input
          type="number"
          placeholder="Buy Price (optional)"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          min="0"
          step="any"
        />

        <Button onClick={addHolding} disabled={!amount}>
          Add
        </Button>
      </div>

      {holdings.length === 0 ? (
        <p style={{ color: '#9aa4ad' }}>No holdings yet. Add your first crypto position above.</p>
      ) : (
        <ul>
          {holdings.map((h) => {
            const price = prices[h.coin]?.usd ?? h.currentPrice ?? null;
            const value = price ? h.amount * price : null;
            const pl = value != null ? profitLoss(value, h.buyPrice * h.amount) : null;
            const pct = value != null ? percentChange(value, h.buyPrice * h.amount) : null;

            return (
              <li key={h.id} style={{ marginBottom: '0.5rem' }}>
                {h.coin.toUpperCase()} — {h.amount} @ ${h.buyPrice.toFixed(2)}
                {price && (
                  <>
                    {' '}| Current: ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    {' '}| Value: ${value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    {' '}| P/L: {pl != null ? pl.toFixed(2) : '—'}
                    {pct != null && ` (${pct.toFixed(2)}%)`}
                  </>
                )}
                <Button
                  variant="danger"
                  onClick={() => removeHolding(h.id)}
                  style={{ marginLeft: 8 }}
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div style={{ marginTop: 12 }}>
        <strong>Total Value:</strong>{' '}
        ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
