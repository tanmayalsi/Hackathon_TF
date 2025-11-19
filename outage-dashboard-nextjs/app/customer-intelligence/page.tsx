'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Users, DollarSign } from 'lucide-react';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { ChurnOverviewPanel } from '../components/ChurnOverviewPanel';
import { AtRiskCustomersList } from '../components/AtRiskCustomersList';
import { ChurnInsightsPanel } from '../components/ChurnInsightsPanel';
import { useBatchChurnData, useChurnInsights } from '@/lib/churn-hooks';

const CHURN_TIME_RANGES = [
  { label: 'Last 24 Hours', hours: 24 },
  { label: 'Last Week', hours: 168 },
  { label: 'Last Month', hours: 720 },
];

export default function CustomerIntelligencePage() {
  const [selectedHours, setSelectedHours] = useState(720); // Default to last month
  const { data: batchData } = useBatchChurnData();
  const { data: insights } = useChurnInsights(selectedHours);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-10 h-10 text-blue-600" />
                Customer Intelligence
              </h1>
              <p className="mt-2 text-gray-600 text-lg">
                AI-powered churn prediction and retention strategies
              </p>
            </div>
          </div>

          <div className="mt-6">
            <TimeRangeSelector
              selectedHours={selectedHours}
              onSelect={setSelectedHours}
              ranges={CHURN_TIME_RANGES}
            />
          </div>

          {/* Quick Stats */}
          {batchData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">High Risk</p>
                    <p className="text-3xl font-bold text-red-900 mt-1">
                      {batchData.summary.highRisk}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Medium Risk</p>
                    <p className="text-3xl font-bold text-yellow-900 mt-1">
                      {batchData.summary.mediumRisk}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Stable</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">
                      {batchData.summary.totalCustomers - batchData.summary.highRisk - batchData.summary.mediumRisk}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Revenue at Risk</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      ${(batchData.summary.totalRevAtRisk / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Overview Panel */}
          <ChurnOverviewPanel hours={selectedHours} />

          {/* Two-column layout for customers and insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* At-Risk Customers List */}
            <div className="lg:col-span-2">
              <AtRiskCustomersList />
            </div>

            {/* Insights Panel */}
            <div className="lg:col-span-1">
              <ChurnInsightsPanel hours={selectedHours} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

