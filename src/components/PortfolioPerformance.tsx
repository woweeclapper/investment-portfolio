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
import Button from './Button';
import { chartColors } from '../utils/chartColors';
import { baseChartOptions } from '../utils/chartOptions';

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
  coin: string;
  amount: number;
  buyPrice: number;
  currentPrice: number;
};

type Snapshot = {
  date: string;
  stockValue: number;
  dividends: number;
  cryptoValue: number;
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

  // Re-load all modules on mount
  useEffect(() => {
    setDividends(loadData<Dividend[]>('dividends', []));
    setStocks(loadData<Stock[]>('stocks', []));
    setCryptoHoldings(loadData<Holding[]>('cryptoHoldings', []));
  }, []);

  // Helper: take a daily snapshot
  const takeSnapshot = () => {
    const stockValue = stocks.reduce(
      (sum, s) => sum + (s.currentPrice != null ? s.currentPrice * s.shares : 0),
      0
    );
    const totalDividends = dividends.reduce((sum, d) => sum + d.amount, 0);
    const cryptoValue = cryptoHoldings.reduce(
      (sum, h) => sum + (h.currentPrice ?? 0) * h.amount,
      0
    );

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (!history.find((h) => h.date === today)) {
      setHistory((prev) => [
        ...prev,
        { date: today, stockValue, dividends: totalDividends, cryptoValue },
      ]);
    }
  };

  // Take initial snapshot
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

    let interval: ReturnType<typeof setInterval>;
    const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
      takeSnapshot();
      interval = setInterval(takeSnapshot, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, stocks, dividends, cryptoHoldings]);

  // Monthly dividend totals
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
        borderColor: chartColors.stocks.border,
        backgroundColor: chartColors.stocks.background,
        hidden: !showCumulative,
      },
      {
        label: 'Crypto Value',
        data: showCumulative ? history.map((h) => h.cryptoValue) : [],
        borderColor: chartColors.crypto.border,
        backgroundColor: chartColors.crypto.background,
        hidden: !showCumulative,
      },
      {
        label: showCumulative ? 'Cumulative Dividends' : 'Monthly Dividends',
        data: showCumulative
          ? history.map((h) => h.dividends)
          : monthOrder.map((m) => monthlyMap[m]),
        borderColor: chartColors.dividends.border,
        backgroundColor: chartColors.dividends.background,
      },
      {
        label: 'Total Portfolio (Stocks + Crypto + Dividends)',
        data: showCumulative
          ? history.map((h) => h.stockValue + h.cryptoValue + h.dividends)
          : [],
        borderColor: chartColors.total.border,
        backgroundColor: chartColors.total.background,
        hidden: !showCumulative,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: {
        display: true,
        text: showCumulative
          ? 'Cumulative Portfolio Performance'
          : 'Monthly Dividend Summary',
      },
    },
  };

  
  return (
    <div>
      <h2>Portfolio Performance</h2>

      {/* 🔹 Latest snapshot summary */}
{/* 🔹 Latest snapshot summary with percentages */}
{history.length > 0 && (
  <div
    style={{
      display: 'flex',
      gap: '1.5rem',
      marginBottom: '1rem',
      padding: '0.75rem 1rem',
      background: '#2c2c3a',        // dark card background for semi-dark dashboard
      color: '#f1f1f1',
      borderRadius: '8px',
      fontSize: '0.95rem',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    }}
  >
    {(() => {
      const latest = history[history.length - 1];
      const total = latest.stockValue + latest.cryptoValue + latest.dividends;

      const pct = (val: number) =>
        total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '0%';

      return (
        <>
          <div style={{ color: chartColors.stocks.border }}>
            <strong>Stocks:</strong> ${latest.stockValue.toFixed(2)} ({pct(latest.stockValue)})
          </div>
          <div style={{ color: chartColors.crypto.border }}>
            <strong>Crypto:</strong> ${latest.cryptoValue.toFixed(2)} ({pct(latest.cryptoValue)})
          </div>
          <div style={{ color: chartColors.dividends.border }}>
            <strong>Dividends:</strong> ${latest.dividends.toFixed(2)} ({pct(latest.dividends)})
          </div>
          <div style={{ color: chartColors.total.border }}>
            <strong>Total:</strong> ${total.toFixed(2)} (100%)
          </div>
        </>
      );
    })()}
  </div>
)}


      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Button
          variant="muted"
          onClick={() => setShowCumulative((prev) => !prev)}
        >
          {showCumulative ? 'Switch to Monthly View' : 'Switch to Cumulative View'}
        </Button>

        <Button variant="primary" onClick={takeSnapshot}>
          Take Snapshot Now
        </Button>
      </div>

      <Line data={chartData} options={options} />
    </div>
  );
}

