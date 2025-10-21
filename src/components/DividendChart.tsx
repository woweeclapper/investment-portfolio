import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

type Dividend = {
  id: number;
  source: string;
  amount: number;
  date: string;
};

interface Props {
  dividends: Dividend[];
}

export default function DividendChart({ dividends }: Props) {
  // Transform dividends into monthly totals
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    dividends.forEach((d) => {
      const month = d.date.slice(0, 7); // YYYY-MM
      map[month] = (map[month] || 0) + d.amount;
    });
    return Object.entries(map).map(([month, total]) => ({
      month,
      total,
    }));
  }, [dividends]);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3>Monthly Dividend Summary</h3>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#4CAF50" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
