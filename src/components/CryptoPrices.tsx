import { useEffect, useState } from 'react';
import { fetchCryptoPrices } from '../utils/api';

type Prices = { [key: string]: { usd: number } };

// ✅ Explicitly type as string[] so .toUpperCase() works
const MAIN_COINS: string[] = ['bitcoin', 'ethereum', 'solana'];
const SUPP_COINS: string[] = ['ripple', 'dogecoin', 'sui', 'binancecoin'];

export default function CryptoPrices() {
  const [prices, setPrices] = useState<Prices>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchCryptoPrices();
        if (!cancelled) {
          setPrices(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch crypto prices', err);
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 60_000); // refresh every 60s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const renderPrice = (symbol: string, label: string) => {
    const value = prices[symbol]?.usd ?? null;
    return (
      <p key={symbol}>
        {label}: {value != null ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
      </p>
    );
  };

  return (
    <div>
      <h2>Crypto Prices</h2>

      {loading && <p style={{ color: '#9aa4ad' }}>Loading latest prices…</p>}

      {!loading && (
        <>
          <h3>Main Watchlist</h3>
          {MAIN_COINS.map((c) =>
            renderPrice(c, c.toUpperCase().slice(0, 3)) // BTC, ETH, SOL
          )}

          <h3>Supplementary</h3>
          {SUPP_COINS.map((c) => {
            const label =
              c === 'ripple' ? 'XRP' :
              c === 'dogecoin' ? 'DOGE' :
              c === 'sui' ? 'SUI' :
              c === 'binancecoin' ? 'BNB' : c.toUpperCase();
            return renderPrice(c, label);
          })}
        </>
      )}
    </div>
  );
}
