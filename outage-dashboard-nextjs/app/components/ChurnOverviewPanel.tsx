'use client';

import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { useBatchChurnAnalysis, useBatchChurnData } from '@/lib/churn-hooks';

interface ChurnOverviewPanelProps {
  hours: number;
}

export function ChurnOverviewPanel({ hours }: ChurnOverviewPanelProps) {
  const { mutate: analyzeBatch, isPending } = useBatchChurnAnalysis();
  const { data: batchData } = useBatchChurnData();

  const handleAnalyze = () => {
    analyzeBatch({
      hours,
      riskThreshold: 'medium',
      limit: 50,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Churn Risk Analysis
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered analysis of customer behavior and engagement
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isPending}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze All Customers
            </>
          )}
        </button>
      </div>

      {isPending && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span>Reading customer call transcripts...</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse animation-delay-200" />
            <span>Correlating with social media sentiment...</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse animation-delay-400" />
            <span>Calculating churn risk scores...</span>
          </div>
        </div>
      )}

      {!isPending && !batchData && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 text-lg mb-2">
            Ready to identify at-risk customers
          </p>
          <p className="text-gray-500 text-sm">
            Click "Analyze All Customers" to start AI-powered churn prediction
          </p>
        </div>
      )}

      {batchData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">Analysis Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Customers</p>
                <p className="text-xl font-bold text-gray-900">{batchData.summary.totalCustomers}</p>
              </div>
              <div>
                <p className="text-gray-600">Analyzed</p>
                <p className="text-xl font-bold text-gray-900">{batchData.summary.analyzed}</p>
              </div>
              <div>
                <p className="text-gray-600">At Risk</p>
                <p className="text-xl font-bold text-red-600">
                  {batchData.summary.highRisk + batchData.summary.mediumRisk}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Revenue at Risk</p>
                <p className="text-xl font-bold text-orange-600">
                  ${(batchData.summary.totalRevAtRisk / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Analysis completed at {new Date(batchData.generatedAt).toLocaleString()}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

