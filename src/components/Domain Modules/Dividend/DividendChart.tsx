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
import { chartColors } from '../../../utils/Charts/chartColors';
import { baseChartOptions } from '../../../utils/Charts/chartOptions';
import type { Dividend } from '../../../types/type';   //use shared type

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DividendChart({
  dividends,
}: {
  dividends: Dividend[];
}) {
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
        label: 'Monthly Dividends',
        data: monthOrder.map((m) => monthlyMap[m]),
        borderColor: chartColors.dividends.border,
        backgroundColor: chartColors.dividends.background,
      },
    ],
  };

  return <Line data={chartData} options={baseChartOptions} />;
}
