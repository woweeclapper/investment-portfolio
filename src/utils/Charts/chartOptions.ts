import type { ChartOptions } from 'chart.js';

export const baseChartOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: 'Inter, sans-serif',
          size: 12,
        },
      },
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      ticks: {
        font: {
          family: 'Inter, sans-serif',
        },
      },
    },
    y: {
      ticks: {
        font: {
          family: 'Inter, sans-serif',
        },
      },
    },
  },
};
