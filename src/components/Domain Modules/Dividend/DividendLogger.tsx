import { useState, useEffect, useMemo } from 'react';
import {
  formatCurrency,
  formatDate,
} from '../../../utils/Math & Logic/formatters';
import {
  saveConfirmFlags,
  loadConfirmFlags,
} from '../../../utils/Data & API/storage';
import type { ConfirmFlags } from '../../../utils/Data & API/storage';
import { toNumberSafe } from '../../../utils/Math & Logic/calculations';
import ConfirmModal from '../../Feedback & Safety/ConfirmModal';
import Badge from '../../UI Primitives/Badge';
import DividendChart from './DividendChart';
import Button from '../../UI Primitives/Button';
import FormError from '../../Feedback & Safety/FormError';
import { supabase } from '../../../utils/Infrastructure/supabaseClient';
import type { Dividend } from '../../../types/type'; // single source of truth

export default function DividendLogger() {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [skipConfirm, setSkipConfirm] = useState<boolean>(
    () => loadConfirmFlags().dividends
  );

  // Load dividends from Supabase
  useEffect(() => {
    const fetchDividends = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('dividends')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
      if (error) console.error(error);
      else setDividends(data as Dividend[]);
    };
    fetchDividends();
  }, []);

  // Persist skipConfirm flag locally
  useEffect(() => {
    const flags: ConfirmFlags = loadConfirmFlags();
    saveConfirmFlags({ ...flags, dividends: skipConfirm });
  }, [skipConfirm]);

  // Validation
  const amountNum = useMemo(() => toNumberSafe(amount), [amount]);
  const isValidSource = source.trim().length > 0;
  const isValidAmount = Number.isFinite(amountNum) && amountNum > 0;
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  const isValid = isValidSource && isValidAmount && isValidDate;

  const addDividend = async () => {
    if (!isValid) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('dividends')
      .insert([
        {
          user_id: user.id,
          source: source.trim(),
          amount: amountNum,
          date,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setDividends((prev) => [...prev, data as Dividend]);
    setSource('');
    setAmount('');
    setDate('');
  };

  const removeDividend = (id: string) => {
    if (skipConfirm) {
      actuallyRemove(id);
    } else {
      setConfirmId(id);
    }
  };

  const actuallyRemove = async (id: string) => {
    const { error } = await supabase.from('dividends').delete().eq('id', id);
    if (error) {
      console.error(error);
      return;
    }
    setDividends((prev) => prev.filter((d) => d.id !== id));
  };

  const confirmRemove = (dontAskAgain: boolean) => {
    if (confirmId != null) {
      actuallyRemove(confirmId);
      setConfirmId(null);
      if (dontAskAgain) setSkipConfirm(true);
    }
  };

  const total = dividends.reduce((sum, d) => sum + d.amount, 0);

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
      {/* Form */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <input
            type="text"
            placeholder="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={!isValidSource && source ? 'input-error' : ''}
          />
          {!isValidSource && source && (
            <FormError message="Source is required." />
          )}
        </div>

        <div>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={!isValidAmount && amount ? 'input-error' : ''}
            min="0"
            step="0.01"
          />
          {!isValidAmount && amount && (
            <FormError message="Amount must be a positive number." />
          )}
        </div>

        <div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={!isValidDate && date ? 'input-error' : ''}
          />
          {!isValidDate && date && (
            <FormError message="Please select a valid date." />
          )}
        </div>

        <Button onClick={addDividend} disabled={!isValid}>
          Add
        </Button>
      </div>

      {/* List */}
      {dividends.length === 0 ? (
        <p style={{ color: '#9aa4ad' }}>
          No dividends yet. Add entries to see totals and charts.
        </p>
      ) : (
        <ul>
          {dividends.map((d) => {
            const pct = total > 0 ? (d.amount / total) * 100 : null;
            return (
              <li key={d.id} style={{ marginBottom: '0.5rem' }}>
                {d.source} — {formatCurrency(d.amount)} on {formatDate(d.date)}
                {pct != null && ` (${pct.toFixed(2)}% of total)`}{' '}
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
