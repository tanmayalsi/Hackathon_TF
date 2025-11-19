'use client';

import { motion } from 'framer-motion';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SentimentDataResponse } from '@/types';
import { formatNumber } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SentimentTrendChartProps {
  data: SentimentDataResponse | undefined;
  isLoading: boolean;
}

export function SentimentTrendChart({ data, isLoading }: SentimentTrendChartProps) {
  if (isLoading || !data) {
    return (
      <div className="bg-white rounded border-2 border-black p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const { timeSeriesData, categoryBreakdown, platformDistribution, overallStats } = data;

  // Time series chart data
  const timeSeriesChartData = {
    labels: timeSeriesData.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Positive',
        data: timeSeriesData.map((d) => d.positive),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Negative',
        data: timeSeriesData.map((d) => d.negative),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Neutral',
        data: timeSeriesData.map((d) => d.neutral),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Category breakdown chart
  const categoryChartData = {
    labels: categoryBreakdown.map((c) => c.category),
    datasets: [
      {
        data: categoryBreakdown.map((c) => c.count),
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#ef4444',
          '#10b981',
          '#3b82f6',
          '#8b5cf6',
          '#6366f1',
          '#ec4899',
        ],
        borderColor: '#000',
        borderWidth: 2,
      },
    ],
  };

  // Platform distribution chart
  const platformChartData = {
    labels: platformDistribution.map((p) => p.platform),
    datasets: [
      {
        label: 'Posts',
        data: platformDistribution.map((p) => p.count),
        backgroundColor: ['#1da1f2', '#ff4500', '#1877f2'],
        borderColor: '#000',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded border-2 border-black p-6"
    >
      <h2 className="text-2xl font-bold mb-6">Sentiment & Trends</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-gray-50 rounded border-2 border-black">
          <p className="text-sm text-gray-600 mb-1">Total Posts</p>
          <p className="text-2xl font-bold">{formatNumber(overallStats.totalPosts)}</p>
        </div>
        <div className="p-4 bg-green-50 rounded border-2 border-green-200">
          <p className="text-sm text-gray-600 mb-1">Positive</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-green-600">
              {overallStats.positivePercentage}%
            </p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded border-2 border-red-200">
          <p className="text-sm text-gray-600 mb-1">Negative</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-red-600">
              {overallStats.negativePercentage}%
            </p>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded border-2 border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Neutral</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-blue-600">
              {overallStats.neutralPercentage}%
            </p>
            <Minus className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Sentiment Over Time</h3>
        <div className="h-64">
          <Line data={timeSeriesChartData} options={chartOptions} />
        </div>
      </div>

      {/* Category and Platform Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="h-64">
            <Doughnut data={categoryChartData} options={doughnutOptions} />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
          <div className="h-64">
            <Bar data={platformChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

