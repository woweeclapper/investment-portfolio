import { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  saveData,
  loadData,
  saveConfirmFlags,
  loadConfirmFlags,
} from '../utils/storage';
import type { ConfirmFlags } from '../utils/storage';   // ✅ type-only import
import { toNumberSafe } from '../utils/calculations';
import ConfirmModal from './ConfirmModal';
import Badge from './Badge';
import DividendChart from './DividendChart';
import Button from './Button';

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
  const [skipConfirm, setSkipConfirm] = useState<boolean>(
    () => loadConfirmFlags().dividends
  );

  // Persist dividends
  useEffect(() => {
    saveData('dividends', dividends);
  }, [dividends]);

  // Persist skipConfirm flag
  useEffect(() => {
    const flags: ConfirmFlags = loadConfirmFlags();
    saveConfirmFlags({ ...flags, dividends: skipConfirm });
  }, [skipConfirm]);

  // Basic input validation
  const amountNum = useMemo(() => toNumberSafe(amount), [amount]);

  const isValid =
    source.trim().length > 0 &&
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date);

  const addDividend = () => {
    if (!isValid) return;
    const newDividend: Dividend = {
      id: Date.now(),
      source: source.trim(),
      amount: amountNum,
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

  // Monthly breakdown (labels ordered by date)
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

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Dividend Logger
        {skipConfirm && <Badge label="Confirmations off" tone="danger" />}
      </h2>

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
          min="0"
          step="0.01"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button onClick={addDividend} disabled={!isValid}>
          Add
        </Button>
      </div>

      {dividends.length === 0 ? (
        <p style={{ color: '#9aa4ad' }}>No dividends yet. Add entries to see totals and charts.</p>
      ) : (
        <ul>
          {dividends.map((d) => {
            const pct = total > 0 ? (d.amount / total) * 100 : null;
            return (
              <li key={d.id} style={{ marginBottom: '0.5rem' }}>
                {d.source} — {formatCurrency(d.amount)} on {formatDate(d.date)}
                {pct != null && ` (${pct.toFixed(2)}% of total)`}
                {' '}
                <Button variant="danger" onClick={() => removeDividend(d.id)}>
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <h3>Total Dividends: {formatCurrency(total)}</h3>

      <h3>Monthly Summary</h3>
      {monthOrder.length === 0 ? (
        <p style={{ color: '#9aa4ad' }}>No monthly data yet.</p>
      ) : (
        <ul>
          {monthOrder.map((m) => (
            <li key={m}>
              {m}: {formatCurrency(monthlyMap[m])}
            </li>
          ))}
        </ul>
      )}

      <div style={{ maxWidth: '640px', marginTop: '1rem' }}>
        <DividendChart dividends={dividends} />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Button variant="muted" onClick={() => setSkipConfirm(false)}>
          Restore Confirmations
        </Button>
      </div>

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
