import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { saveData, loadData, saveConfirmFlags, loadConfirmFlags } from '../utils/storage';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ConfirmModal from './ConfirmModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Dividend = {
  id: number;
  source: string;
  amount: number;
  date: string; // YYYY-MM-DD
};

export default function DividendLogger() {
  const [dividends, setDividends] = useState<Dividend[]>(() =>
    loadData<Dividend[]>('dividends', [])
  );
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  // Confirmation state with persistent flag
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(() => loadConfirmFlags().dividends || false);

  // Persist dividends
  useEffect(() => {
    saveData('dividends', dividends);
  }, [dividends]);

  // Persist skipConfirm flag
  useEffect(() => {
    const flags = loadConfirmFlags();
    saveConfirmFlags({ ...flags, dividends: skipConfirm });
  }, [skipConfirm]);

  const addDividend = () => {
    if (!source || !amount || !date) return;
    const newDividend: Dividend = {
      id: Date.now(),
      source,
      amount: parseFloat(amount),
      date,
    };
    setDividends((prev) => [...prev, newDividend]);
    setSource('');
    setAmount('');
    setDate('');
  };

  const removeDividend = (id: number) => {
    if (skipConfirm) {
      setDividends((prev) => prev.filter((d) => d.id !== id));
    } else {
      setConfirmId(id);
    }
  };

  const confirmRemove = (dontAskAgain: boolean) => {
    if (confirmId != null) {
      setDividends((prev) => prev.filter((d) => d.id !== confirmId));
      setConfirmId(null);
      if (dontAskAgain) setSkipConfirm(true);
    }
  };

  const total = dividends.reduce((sum, d) => sum + d.amount, 0);

  // Monthly breakdown (labels order by date)
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

  const chartData = {
    labels: monthOrder,
    datasets: [
      {
        label: 'Dividends per Month',
        data: monthOrder.map((m) => monthlyMap[m]),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return (
    <div>
      <h2>Dividend Logger</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          type="text"
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button onClick={addDividend}>Add</button>
      </div>

      <ul>
        {dividends.map((d) => (
          <li key={d.id} style={{ marginBottom: '0.5rem' }}>
            {d.source} — {formatCurrency(d.amount)} on {formatDate(d.date)}
            {' '}
            <button onClick={() => removeDividend(d.id)}>Remove</button>
          </li>
        ))}
      </ul>

      <h3>Total Dividends: {formatCurrency(total)}</h3>

      <h3>Monthly Summary</h3>
      <ul>
        {monthOrder.map((m) => (
          <li key={m}>
            {m}: {formatCurrency(monthlyMap[m])}
          </li>
        ))}
      </ul>

      <div style={{ maxWidth: '640px', marginTop: '1rem' }}>
        <Bar data={chartData} />
      </div>

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
          message="Are you sure you want to remove this dividend entry?"
          onConfirm={confirmRemove}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
