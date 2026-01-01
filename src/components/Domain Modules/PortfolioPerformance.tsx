import { useEffect, useMemo, useState } from 'react';
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
import Button from '../UI Primitives/Button';
import { chartColors } from '../../utils/Charts/chartColors';
import { baseChartOptions } from '../../utils/Charts/chartOptions';
import { supabase } from '../../utils/Infrastructure/supabaseClient';
import type { Holding, Dividend, CryptoHolding, PortfolioSnapshot } from '../../types/type';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PortfolioPerformance() {
  // Live arrays from Supabase
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [stocks, setStocks] = useState<Holding[]>([]);
  const [cryptoHoldings, setCryptoHoldings] = useState<CryptoHolding[]>([]);

  // Snapshot history from Supabase
  const [history, setHistory] = useState<PortfolioSnapshot[]>([]);
  const [showCumulative, setShowCumulative] = useState(true);

  // Load live data + snapshots from Supabase on mount
  useEffect(() => {
    const loadAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Stocks
      type HoldingRowDB = {
        id: string;
        user_id: string;
        ticker: string;
        shares: number;
        buy_price: number;
        currentPrice?: number;
      };
      const { data: stockData, error: stockErr } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('ticker');
      if (!stockErr && stockData) {
        setStocks(
          (stockData as HoldingRowDB[]).map((r) => ({
            id: r.id,
            ticker: r.ticker,
            shares: r.shares,
            buyPrice: r.buy_price,
            currentPrice: r.currentPrice,
          }))
        );
      } else if (stockErr) console.error('Failed to load holdings', stockErr);

      // Dividends
      type DividendRowDB = {
        id: string;
        user_id: string;
        source: string;
        amount: number;
        date: string;
      };
      const { data: divData, error: divErr } = await supabase
        .from('dividends')
        .select('*')
        .eq('user_id', user.id)
        .order('date');
      if (!divErr && divData) {
        setDividends(
          (divData as DividendRowDB[]).map((r) => ({
            id: r.id,
            source: r.source,
            amount: r.amount,
            date: r.date,
          }))
        );
      } else if (divErr) console.error('Failed to load dividends', divErr);

      // Crypto
      type CryptoHoldingRowDB = {
        id: string;
        user_id: string;
        coin: string;
        amount: number;
        buy_price: number;
        currentPrice?: number;
      };
      const { data: cryptoData, error: cryptoErr } = await supabase
        .from('crypto_holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('coin');
      if (!cryptoErr && cryptoData) {
        setCryptoHoldings(
          (cryptoData as CryptoHoldingRowDB[]).map((r) => ({
            id: r.id,
            coin: r.coin,
            amount: r.amount,
            buyPrice: r.buy_price,
            currentPrice: r.currentPrice,
          }))
        );
      } else if (cryptoErr) console.error('Failed to load crypto holdings', cryptoErr);

      // Snapshots
      type PortfolioHistoryRowDB = {
        id: string;
        user_id: string;
        date: string;
        stock_value: number;
        crypto_value: number;
        dividends: number;
        inserted_at: string;
      };
      const { data: snapData, error: snapErr } = await supabase
        .from('portfolio_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date'); // sorted by string date (matches your display)
      if (!snapErr && snapData) {
        setHistory(
          (snapData as PortfolioHistoryRowDB[]).map((r) => ({
            id: r.id,
            date: r.date,
            stockValue: r.stock_value,
            cryptoValue: r.crypto_value,
            dividends: r.dividends,
          }))
        );
      } else if (snapErr) console.error('Failed to load portfolio history', snapErr);
    };

    loadAll();
  }, []);

  //  Memoize current aggregate values used in snapshots (live arrays)
  const stockValue = useMemo(() => {
    return stocks.reduce((sum, s) => sum + (s.currentPrice ?? 0) * s.shares, 0);
  }, [stocks]);

  const cryptoValue = useMemo(() => {
    return cryptoHoldings.reduce(
      (sum, h) => sum + (h.currentPrice ?? 0) * h.amount,
      0
    );
  }, [cryptoHoldings]);

  const totalDividends = useMemo(() => {
    return dividends.reduce((sum, d) => sum + d.amount, 0);
  }, [dividends]);

  // Helper: take a daily snapshot (Supabase insert + local reflect)
  const takeSnapshot = async () => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (history.find((h) => h.date === today)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('portfolio_history')
      .insert([
        {
          user_id: user.id,
          date: today,
          stock_value: stockValue,
          crypto_value: cryptoValue,
          dividends: totalDividends,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setHistory((prev) => [
        ...prev,
        {
          id: data.id,
          date: data.date,
          stockValue: data.stock_value,
          cryptoValue: data.crypto_value,
          dividends: data.dividends,
        },
      ]);
    } else if (error) {
      console.error('Failed to insert snapshot', error);
    }
  };

  // Take initial snapshot when we have any data
  useEffect(() => {
    if (
      stocks.length > 0 ||
      dividends.length > 0 ||
      cryptoHoldings.length > 0
    ) {
      // fire-and-forget; we don't await inside effect to avoid cleanup races
      void takeSnapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks, dividends, cryptoHoldings]);

  // Schedule daily snapshot at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();

    let interval: ReturnType<typeof setInterval>;
    const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
      void takeSnapshot();
      interval = setInterval(() => void takeSnapshot(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, stocks, dividends, cryptoHoldings]);

  //  Memoize monthly dividend totals
  const { monthlyMap, monthOrder } = useMemo(() => {
    const map: Record<string, number> = {};
    const order: string[] = [];

    dividends
      .slice()
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .forEach((d) => {
        const key = new Date(d.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        });
        if (!(key in map)) order.push(key);
        map[key] = (map[key] || 0) + d.amount;
      });

    return { monthlyMap: map, monthOrder: order };
  }, [dividends]);

  //  Memoize chart datasets (guard monthly array lengths)
  const chartData = useMemo(() => {
    const monthlyDividends = monthOrder.map((m) => monthlyMap[m] ?? 0);

    return {
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
            : monthlyDividends,
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
  }, [showCumulative, history, monthOrder, monthlyMap]);

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

  //  Memoize latest snapshot summary values
  const latestSummary = useMemo(() => {
    if (history.length === 0) return null;
    const latest = history[history.length - 1];
    const total = latest.stockValue + latest.cryptoValue + latest.dividends;

    const pct = (val: number) =>
      total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '0%';

    return { latest, total, pct };
  }, [history]);

  return (
    <div>
      <h2>Portfolio Performance</h2>

      {/*  Latest snapshot summary with percentages */}
      {latestSummary && (
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: '#2c2c3a',
            color: '#f1f1f1',
            borderRadius: '8px',
            fontSize: '0.95rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ color: chartColors.stocks.border }}>
            <strong>Stocks:</strong> $
            {latestSummary.latest.stockValue.toFixed(2)} (
            {latestSummary.pct(latestSummary.latest.stockValue)})
          </div>
          <div style={{ color: chartColors.crypto.border }}>
            <strong>Crypto:</strong> $
            {latestSummary.latest.cryptoValue.toFixed(2)} (
            {latestSummary.pct(latestSummary.latest.cryptoValue)})
          </div>
          <div style={{ color: chartColors.dividends.border }}>
            <strong>Dividends:</strong> $
            {latestSummary.latest.dividends.toFixed(2)} (
            {latestSummary.pct(latestSummary.latest.dividends)})
          </div>
          <div style={{ color: chartColors.total.border }}>
            <strong>Total:</strong> ${latestSummary.total.toFixed(2)} (100%)
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Button
          variant="muted"
          onClick={() => setShowCumulative((prev) => !prev)}
        >
          {showCumulative
            ? 'Switch to Monthly View'
            : 'Switch to Cumulative View'}
        </Button>

        <Button variant="primary" onClick={() => void takeSnapshot()}>
          Take Snapshot Now
        </Button>
      </div>

      <Line data={chartData} options={options} />
    </div>
  );
}
