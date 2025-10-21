import { useEffect, useState } from 'react';
import { fetchCryptoPrices } from '../utils/api';

type Prices = { [key: string]: { usd: number } };

export default function CryptoPrices() {
  const [prices, setPrices] = useState<Prices>({});

  useEffect(() => {
    const load = async () => {
      const data = await fetchCryptoPrices();
      setPrices(data);
    };
    load();
    const interval = setInterval(load, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // Extract values safely
  const btc = prices.bitcoin?.usd ?? null;
  const eth = prices.ethereum?.usd ?? null;
  const sol = prices.solana?.usd ?? null;
  const xrp = prices.ripple?.usd ?? null;
  const doge = prices.dogecoin?.usd ?? null;
  const sui = prices.sui?.usd ?? null;
  const bnb = prices.binancecoin?.usd ?? null;

  return (
    <div>
      <h2>Crypto Prices</h2>

      <h3>Main Watchlist</h3>
      <p>BTC: {btc != null ? `$${btc.toLocaleString()}` : '—'}</p>
      <p>ETH: {eth != null ? `$${eth.toLocaleString()}` : '—'}</p>
      <p>SOL: {sol != null ? `$${sol.toLocaleString()}` : '—'}</p>

      <h3>Supplementary</h3>
      <p>XRP: {xrp != null ? `$${xrp.toLocaleString()}` : '—'}</p>
      <p>DOGE: {doge != null ? `$${doge.toLocaleString()}` : '—'}</p>
      <p>SUI: {sui != null ? `$${sui.toLocaleString()}` : '—'}</p>
      <p>BNB: {bnb != null ? `$${bnb.toLocaleString()}` : '—'}</p>
    </div>
  );
}
