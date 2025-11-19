'use client';

import { motion } from 'framer-motion';
import { X, Loader2, TrendingDown, Phone, Mail, DollarSign, AlertTriangle, Lightbulb } from 'lucide-react';
import { useChurnAnalysis } from '@/lib/churn-hooks';
import type { AtRiskCustomer } from '@/types';

interface CustomerChurnAnalysisProps {
  customer: AtRiskCustomer;
  onClose: () => void;
}

export function CustomerChurnAnalysis({ customer, onClose }: CustomerChurnAnalysisProps) {
  const { data: analysis, isLoading } = useChurnAnalysis(customer.customerId, 720);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
                <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${getRiskColor(customer.riskLevel)}`}>
                  {customer.riskLevel.toUpperCase()} RISK
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{customer.customerId}</span>
                <span>•</span>
                <span>{customer.location}</span>
                <span>•</span>
                <span>${customer.accountValue.toLocaleString()}/year</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Analyzing customer data...</span>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Risk Score Gauge */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Assessment</h3>
                <div className="flex items-center gap-8">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={analysis.riskScore >= 70 ? '#dc2626' : analysis.riskScore >= 40 ? '#f59e0b' : '#10b981'}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.riskScore / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <div className="text-3xl font-bold text-gray-900">{analysis.riskScore}</div>
                      <div className="text-xs text-gray-500">Risk Score</div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Total Calls:</span>
                      <span className="ml-2 text-gray-900">{analysis.callHistory.totalCalls}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Technical Issues:</span>
                      <span className="ml-2 text-gray-900">{analysis.callHistory.technicalCalls}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Billing Inquiries:</span>
                      <span className="ml-2 text-gray-900">{analysis.callHistory.billingCalls}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Service Plan:</span>
                      <span className="ml-2 text-gray-900">{analysis.customer.servicePlan}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Churn Signals */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Churn Risk Signals
                </h3>
                <div className="space-y-3">
                  {analysis.churnSignals.length === 0 && (
                    <p className="text-gray-600 text-sm">No significant churn signals detected.</p>
                  )}
                  {analysis.churnSignals.map((signal, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(signal.severity)}`}>
                          {signal.severity.toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {signal.type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-700">{signal.evidence}</div>
                          {signal.timestamp && (
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(signal.timestamp).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Sentiment Journey */}
              {analysis.sentimentJourney.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-purple-600" />
                    Sentiment Journey
                  </h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-end gap-2 h-32">
                      {analysis.sentimentJourney.map((point, index) => {
                        const height = (point.score / 100) * 100;
                        const color = point.score >= 70 ? 'bg-green-500' : point.score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center justify-end group relative">
                            <div
                              className={`w-full ${color} rounded-t transition-all hover:opacity-80`}
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {point.date}: {point.score} ({point.sentiment})
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                              {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Retention Strategy */}
              {analysis.retentionStrategy && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                    AI-Generated Retention Strategy
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Root Cause</h4>
                      <p className="text-gray-700 text-sm">{analysis.retentionStrategy.rootCause}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recommended Actions</h4>
                      <ul className="space-y-2">
                        {analysis.retentionStrategy.recommendedActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-green-600 font-bold">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Talking Points</h4>
                      <ul className="space-y-2">
                        {analysis.retentionStrategy.talkingPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-600 font-bold">→</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200">
                      <div>
                        <div className="text-xs text-gray-600">Estimated Cost</div>
                        <div className="text-lg font-bold text-gray-900">
                          ${analysis.retentionStrategy.estimatedCost}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Customer Value</div>
                        <div className="text-lg font-bold text-gray-900">
                          ${analysis.retentionStrategy.customerLifetimeValue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Success Rate</div>
                        <div className="text-lg font-bold text-green-600">
                          {(analysis.retentionStrategy.successProbability * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {analysis && (
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
            <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Customer
            </button>
            <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Send Retention Offer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

