import { useEffect, useState } from 'react';
import { saveData, loadData, saveConfirmFlags, loadConfirmFlags } from '../utils/storage';
import { fetchCryptoPrices } from '../utils/api';
import ConfirmModal from './ConfirmModal';

type Holding = {
  id: number;
  coin: string;       // e.g. 'bitcoin', 'ethereum'
  amount: number;
  buyPrice: number;
  currentPrice?: number;
};

export default function CryptoHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>(() =>
    loadData<Holding[]>('cryptoHoldings', [])
  );
  const [prices, setPrices] = useState<{ [key: string]: { usd: number } }>({});
  const [coin, setCoin] = useState('bitcoin');
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  // Confirmation modal state
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(() => loadConfirmFlags().crypto || false);

  // Persist skipConfirm flag
  useEffect(() => {
    const flags = loadConfirmFlags();
    saveConfirmFlags({ ...flags, crypto: skipConfirm });
  }, [skipConfirm]);

  // Persist holdings
  useEffect(() => {
    saveData('cryptoHoldings', holdings);
  }, [holdings]);

  // Fetch live prices and update holdings
  useEffect(() => {
    const load = async () => {
      const data = await fetchCryptoPrices();
      setPrices(data);

      // Update currentPrice for each holding
      setHoldings((prev) =>
        prev.map((h) => ({
          ...h,
          currentPrice: data[h.coin]?.usd ?? h.currentPrice,
        }))
      );
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const addHolding = () => {
    if (!amount) return;
    const newHolding: Holding = {
      id: Date.now(),
      coin,
      amount: parseFloat(amount),
      buyPrice: parseFloat(buyPrice) || 0,
      currentPrice: prices[coin]?.usd ?? undefined,
    };
    setHoldings([...holdings, newHolding]);
    setAmount('');
    setBuyPrice('');
  };

  const removeHolding = (id: number) => {
    if (skipConfirm) {
      setHoldings(holdings.filter((h) => h.id !== id));
    } else {
      setConfirmId(id);
    }
  };

  const confirmRemove = (dontAskAgain: boolean) => {
    if (confirmId != null) {
      setHoldings(holdings.filter((h) => h.id !== confirmId));
      setConfirmId(null);
      if (dontAskAgain) setSkipConfirm(true);
    }
  };

  return (
    <div>
      <h2>Crypto Holdings</h2>
      <div style={{ marginBottom: '1rem' }}>
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
        />
        <input
          type="number"
          placeholder="Buy Price (optional)"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
        />
        <button onClick={addHolding}>Add</button>
      </div>

      <ul>
        {holdings.map((h) => {
          const price = prices[h.coin]?.usd ?? h.currentPrice ?? null;
          const value = price ? h.amount * price : null;
          const pl = value != null ? value - h.buyPrice * h.amount : null;
          return (
            <li key={h.id}>
              {h.coin.toUpperCase()} — {h.amount} @ ${h.buyPrice}
              {price && (
                <>
                  {' '}| Current: ${price.toLocaleString()}
                  {' '}| Value: ${value?.toLocaleString()}
                  {' '}| P/L: {pl != null ? pl.toFixed(2) : '—'}
                </>
              )}
              <button onClick={() => removeHolding(h.id)}>Remove</button>
            </li>
          );
        })}
      </ul>

      {/* Restore confirmations */}
      <button
        style={{
          marginTop: '1rem',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
        }}
        onClick={() => setSkipConfirm(false)}
      >
        Restore Confirmations
      </button>

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
