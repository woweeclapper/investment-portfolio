import axios from 'axios';

const FINNHUB_KEY = 'd3pfn4pr01qq6ml8jv3gd3pfn4pr01qq6ml8jv40';

// Stocks
export async function fetchStockPrice(ticker: string): Promise<number | null> {
  try {
    const res = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`
    );
    return res.data?.c ?? null;
  } catch {
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
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${query}&vs_currencies=usd`
    );
    return res.data;
  } catch {
    return {};
  }
}
