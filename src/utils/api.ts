import axios from 'axios';

// ✅ Use environment variables instead of hardcoding
const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY;
const FINNHUB_URL =
  import.meta.env.VITE_FINNHUB_URL || 'https://finnhub.io/api/v1';
const COINGECKO_URL =
  import.meta.env.VITE_COINGECKO_URL || 'https://api.coingecko.com/api/v3';

// Stocks
export async function fetchStockPrice(ticker: string): Promise<number | null> {
  try {
    const res = await axios.get(`${FINNHUB_URL}/quote`, {
      params: {
        symbol: ticker.toUpperCase(), // ensure uppercase
        token: FINNHUB_KEY,
      },
    });

    const price = Number(res.data?.c);
    return isNaN(price) || price <= 0 ? null : price;
  } catch (err) {
    console.error('Error fetching stock price:', err);
    return null;
  }
}

// Crypto
export async function fetchCryptoPrices(
  ids: string[] = [
    'bitcoin',
    'ethereum',
    'solana',
    'ripple',
    'dogecoin',
    'sui',
    'binancecoin',
  ]
): Promise<{ [key: string]: { usd: number } }> {
  try {
    const query = ids.join(',');
    const res = await axios.get(`${COINGECKO_URL}/simple/price`, {
      params: {
        ids: query,
        vs_currencies: 'usd',
      },
    });
    return res.data;
  } catch {
    return {};
  }
}
