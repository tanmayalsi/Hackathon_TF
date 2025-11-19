'use client';

import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, MapPin, AlertCircle } from 'lucide-react';
import { useChurnInsights } from '@/lib/churn-hooks';

interface ChurnInsightsPanelProps {
  hours: number;
}

export function ChurnInsightsPanel({ hours }: ChurnInsightsPanelProps) {
  const { data: insights, isLoading } = useChurnInsights(hours);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 space-y-6"
    >
      {/* Top Churn Reasons */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          Top Churn Reasons
        </h3>
        <div className="space-y-3">
          {insights.topChurnReasons.map((reason, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{reason.reason}</span>
                <span className="text-gray-600">{reason.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${reason.percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                />
              </div>
              <div className="text-xs text-gray-500">
                {reason.percentage.toFixed(1)}% of customers
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Geographic Patterns */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Geographic Hotspots
        </h3>
        <div className="space-y-3">
          {insights.geographicPatterns.slice(0, 5).map((pattern, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{pattern.location}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {pattern.highRiskCount} high risk, {pattern.mediumRiskCount} medium risk
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {pattern.avgRiskScore}
                </div>
                <div className="text-xs text-gray-500">Avg Score</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trends */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Trends
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                insights.trends.weekOverWeek.direction === 'increasing'
                  ? 'bg-red-100 text-red-700'
                  : insights.trends.weekOverWeek.direction === 'decreasing'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {insights.trends.weekOverWeek.direction === 'increasing' && '↑'}
                {insights.trends.weekOverWeek.direction === 'decreasing' && '↓'}
                {insights.trends.weekOverWeek.direction === 'stable' && '→'}
                {' '}{insights.trends.weekOverWeek.change}
              </div>
              <span className="text-sm text-gray-600">week over week</span>
            </div>
            <p className="text-sm text-gray-700">{insights.trends.prediction}</p>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          AI Recommendations
        </h3>
        <div className="space-y-3">
          {insights.recommendations.map((recommendation, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <p className="text-sm text-gray-700 flex-1">{recommendation}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

