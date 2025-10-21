import { useEffect, useState } from 'react';
import { saveData, loadData } from '../utils/storage';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Stock = {
  id: number;
  ticker: string;
  shares: number;
  buyPrice: number;
  currentPrice?: number;
};

type Dividend = {
  id: number;
  source: string;
  amount: number;
  date: string;
};

type Holding = {
  id: number;
  coin: string;       // e.g. 'btc', 'eth'
  amount: number;
  buyPrice: number;
  currentPrice: number;
};

type Snapshot = {
  date: string;          // e.g., "Oct 18, 2025"
  stockValue: number;    // current total stock value
  dividends: number;     // cumulative dividends to date
  cryptoValue: number;   // current crypto holds value
};

export default function PortfolioPerformance() {
  const [history, setHistory] = useState<Snapshot[]>(() =>
    loadData<Snapshot[]>('portfolioHistory', [])
  );
  const [dividends, setDividends] = useState<Dividend[]>(() =>
    loadData<Dividend[]>('dividends', [])
  );
  const [stocks, setStocks] = useState<Stock[]>(() =>
    loadData<Stock[]>('stocks', [])
  );
  const [cryptoHoldings, setCryptoHoldings] = useState<Holding[]>(() =>
    loadData<Holding[]>('cryptoHoldings', [])
  );

  const [showCumulative, setShowCumulative] = useState(true);

  // Persist history
  useEffect(() => {
    saveData('portfolioHistory', history);
  }, [history]);

  // Re-load all modules on mount (kept in sync with other components)
  useEffect(() => {
    setDividends(loadData<Dividend[]>('dividends', []));
    setStocks(loadData<Stock[]>('stocks', []));
    setCryptoHoldings(loadData<Holding[]>('cryptoHoldings', []));
  }, []);

  // Helper: take a daily snapshot (avoids duplicates per date)
  const takeSnapshot = () => {
    const stockValue = stocks.reduce(
      (sum, s) => sum + (s.currentPrice != null ? s.currentPrice * s.shares : 0),
      0
    );
    const totalDividends = dividends.reduce((sum, d) => sum + d.amount, 0);

    // calculate crypto value (requires currentPrice on each holding)
   const cryptoValue = cryptoHoldings.reduce((sum, h) => {
  const price = h.currentPrice ?? 0; // safe fallback if undefined
  return sum + price * h.amount;
}, 0);



    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (!history.find((h) => h.date === today)) {
      const newHistory = [
        ...history,
        { date: today, stockValue, dividends: totalDividends, cryptoValue },
      ];
      setHistory(newHistory);
    }
  };

  // Take initial snapshot when data loads
  useEffect(() => {
    if (stocks.length > 0 || dividends.length > 0 || cryptoHoldings.length > 0) {
      takeSnapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks, dividends, cryptoHoldings]);

  // Schedule daily snapshot at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

    const timeout = setTimeout(() => {
      takeSnapshot();
      const interval = setInterval(takeSnapshot, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, stocks, dividends, cryptoHoldings]);

  // Monthly dividend totals (for monthly view)
  const monthlyMap: Record<string, number> = {};
  const monthOrder: string[] = [];
  dividends
    .slice()
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .forEach((d) => {
      const key = new Date(d.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
      if (!(key in monthlyMap)) monthOrder.push(key);
      monthlyMap[key] = (monthlyMap[key] || 0) + d.amount;
    });

  // Chart datasets
  const chartData = {
    labels: showCumulative ? history.map((h) => h.date) : monthOrder,
    datasets: [
      {
        label: 'Stock Value',
        data: showCumulative ? history.map((h) => h.stockValue) : [],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        hidden: !showCumulative,
      },
      {
        label: 'Crypto Value',
        data: showCumulative ? history.map((h) => h.cryptoValue) : [],
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        hidden: !showCumulative,
      },
      {
        label: showCumulative ? 'Cumulative Dividends' : 'Monthly Dividends',
        data: showCumulative
          ? history.map((h) => h.dividends)
          : monthOrder.map((m) => monthlyMap[m]),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: 'Total Portfolio (Stocks + Crypto + Dividends)',
        data: showCumulative
          ? history.map((h) => h.stockValue + h.cryptoValue + h.dividends)
          : [],
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        hidden: !showCumulative,
      },
    ],
  };

  return (
    <div>
      <h2>Portfolio Performance</h2>
      <button
        onClick={() => setShowCumulative((prev) => !prev)}
        style={{ marginBottom: '0.5rem' }}
      >
        {showCumulative ? 'Switch to Monthly View' : 'Switch to Cumulative View'}
      </button>
      <Line data={chartData} />
    </div>
  );
}
