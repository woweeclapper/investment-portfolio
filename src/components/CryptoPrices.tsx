import { useEffect, useState, useMemo } from 'react';
import { fetchCryptoPrices } from '../utils/api';
import { debounce } from '../utils/debounce';
import Button from './Button';

type Prices = { [key: string]: { usd: number } };

const MAIN_COINS: string[] = ['bitcoin', 'ethereum', 'solana'];
const SUPP_COINS: string[] = ['ripple', 'dogecoin', 'sui', 'binancecoin'];

export default function CryptoPrices() {
  const [prices, setPrices] = useState<Prices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customCoins, setCustomCoins] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('customCoins') || '[]');
    } catch {
      return [];
    }
  });
  const [newCoin, setNewCoin] = useState('');

  // Persist custom watchlist
  useEffect(() => {
    localStorage.setItem('customCoins', JSON.stringify(customCoins));
  }, [customCoins]);

  // 🔹 Build full watchlist dynamically
  const allCoins = useMemo(
    () => [...MAIN_COINS, ...SUPP_COINS, ...customCoins],
    [customCoins]
  );

  // Debounced loader (safe for manual refreshes)
  const debouncedLoad = useMemo(
    () =>
      debounce(async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await fetchCryptoPrices(allCoins);
          setPrices(data);
        } catch (err) {
          console.error('Failed to fetch crypto prices', err);
          setError('Failed to load crypto prices. Please try again.');
        } finally {
          setLoading(false);
        }
      }, 500),
    [allCoins]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchCryptoPrices(allCoins);
        if (!cancelled) {
          setPrices(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch crypto prices', err);
        if (!cancelled) {
          setError('Failed to load crypto prices. Please try again.');
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 60_000); // refresh every 60s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [allCoins]);

  const renderPrice = (symbol: string, label: string, removable = false) => {
    const value = prices[symbol]?.usd ?? null;
    return (
      <div
        key={symbol}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <p style={{ margin: 0 }}>
          {label}:{' '}
          {value != null
            ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : '—'}
        </p>
        {removable && (
          <Button
            variant="danger"
            onClick={() =>
              setCustomCoins(customCoins.filter((c) => c !== symbol))
            }
          >
            Remove
          </Button>
        )}
      </div>
    );
  };

  const addCoin = () => {
    const coin = newCoin.trim().toLowerCase();
    if (coin && !customCoins.includes(coin)) {
      setCustomCoins([...customCoins, coin]);
    }
    setNewCoin('');
  };

  return (
    <div>
      <h2>Crypto Prices</h2>

      {loading && <p style={{ color: '#9aa4ad' }}>Loading latest prices…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <>
          <h3>Main Watchlist</h3>
          {MAIN_COINS.map((c) => renderPrice(c, c.toUpperCase().slice(0, 3)))}

          <h3>Supplementary</h3>
          {SUPP_COINS.map((c) => {
            const label =
              c === 'ripple'
                ? 'XRP'
                : c === 'dogecoin'
                  ? 'DOGE'
                  : c === 'sui'
                    ? 'SUI'
                    : c === 'binancecoin'
                      ? 'BNB'
                      : c.toUpperCase();
            return renderPrice(c, label);
          })}

          {customCoins.length > 0 && (
            <>
              <h3>Custom Watchlist</h3>
              {customCoins.map((c) => renderPrice(c, c.toUpperCase(), true))}
            </>
          )}
        </>
      )}

      {/* Add new coin input */}
      <div style={{ marginTop: '0.75rem' }}>
        <input
          type="text"
          placeholder="Add coin (e.g. cardano)"
          value={newCoin}
          onChange={(e) => setNewCoin(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <Button variant="primary" onClick={addCoin}>
          Add
        </Button>
      </div>

      {/* Manual refresh button */}
      <div style={{ marginTop: '0.75rem' }}>
        <Button variant="muted" onClick={debouncedLoad}>
          Refresh Now
        </Button>
      </div>
    </div>
  );
}
