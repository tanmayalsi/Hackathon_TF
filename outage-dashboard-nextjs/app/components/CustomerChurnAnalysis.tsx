'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, TrendingDown, Phone, Mail, DollarSign, AlertTriangle, Lightbulb, Eye, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useChurnAnalysis } from '@/lib/churn-hooks';
import { CallTranscriptDetail } from './CallTranscriptDetail';
import type { AtRiskCustomer } from '@/types';

interface CustomerChurnAnalysisProps {
  customer: AtRiskCustomer;
  onClose: () => void;
}

export function CustomerChurnAnalysis({ customer, onClose }: CustomerChurnAnalysisProps) {
  const { data: analysis, isLoading } = useChurnAnalysis(customer.customerId, 720);
  const [selectedCallId, setSelectedCallId] = useState<number | null>(null);
  const [selectedCallNumber, setSelectedCallNumber] = useState<number>(0);
  const [isChurnSignalsExpanded, setIsChurnSignalsExpanded] = useState(false);

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

              {/* Overall Call History Analysis - AI Powered */}
              {analysis.overallCallAnalysis && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-indigo-600" />
                    AI Analysis: Complete Call History
                  </h3>

                  {/* Summary */}
                  <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-100">
                    <div className="text-sm font-semibold text-indigo-900 mb-2">Executive Summary</div>
                    <p className="text-gray-700 text-sm leading-relaxed">{analysis.overallCallAnalysis.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Key Themes */}
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <div className="text-sm font-semibold text-gray-900 mb-3">Key Themes</div>
                      <ul className="space-y-2">
                        {analysis.overallCallAnalysis.keyThemes.map((theme, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-indigo-600 font-bold mt-0.5">•</span>
                            <span>{theme}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sentiment Trend */}
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <div className="text-sm font-semibold text-gray-900 mb-3">Sentiment Trend</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{analysis.overallCallAnalysis.sentimentTrend}</p>
                    </div>

                    {/* Escalation Pattern */}
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <div className="text-sm font-semibold text-gray-900 mb-3">Issue Escalation</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{analysis.overallCallAnalysis.escalationPattern}</p>
                    </div>

                    {/* Churn Risk Factors */}
                    <div className="bg-white rounded-lg p-4 border border-red-100">
                      <div className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Churn Risk Factors
                      </div>
                      <ul className="space-y-2">
                        {analysis.overallCallAnalysis.churnRiskFactors.map((factor, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-red-600 font-bold mt-0.5">⚠</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Positive Indicators */}
                  {analysis.overallCallAnalysis.positiveIndicators.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Positive Indicators
                      </div>
                      <ul className="space-y-2">
                        {analysis.overallCallAnalysis.positiveIndicators.map((indicator, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-green-600 font-bold mt-0.5">✓</span>
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 mb-3">Recommended Actions</div>
                    <ul className="space-y-2">
                      {analysis.overallCallAnalysis.recommendedActions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-600 font-bold mt-0.5">{index + 1}.</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Churn Signals - Collapsible */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <button
                  onClick={() => setIsChurnSignalsExpanded(!isChurnSignalsExpanded)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Keyword-Based Churn Risk Signals
                    <span className="text-sm font-normal text-gray-500">
                      ({analysis.churnSignals.length} signal{analysis.churnSignals.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  {isChurnSignalsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {isChurnSignalsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-3"
                  >
                    {analysis.churnSignals.length === 0 && (
                      <p className="text-gray-600 text-sm">No significant churn signals detected.</p>
                    )}
                    {analysis.churnSignals.map((signal, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
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
                  </motion.div>
                )}
              </div>

              {/* Sentiment Journey */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-purple-600" />
                  AI-Powered Sentiment Journey
                </h3>
                {analysis.sentimentJourney && analysis.sentimentJourney.length > 0 && analysis.sentimentJourney[0].aiReasoning && (
                  <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <span className="font-semibold text-indigo-900">AI Analysis:</span>
                        <span className="text-indigo-800"> Each call has been analyzed by Claude AI for sentiment and churn indicators. Hover over any point to see detailed AI reasoning.</span>
                      </div>
                    </div>
                  </div>
                )}
                {analysis.sentimentJourney && analysis.sentimentJourney.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex gap-4">
                      {/* Y-axis */}
                      <div className="flex flex-col justify-between text-xs text-gray-500 py-2" style={{ width: '40px' }}>
                        <span>100</span>
                        <span>75</span>
                        <span>50</span>
                        <span>25</span>
                        <span>0</span>
                      </div>
                      
                      {/* Chart area */}
                      <div className="flex-1 relative" style={{ height: '200px' }}>
                        {/* Horizontal grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          {[100, 75, 50, 25, 0].map((val) => (
                            <div key={val} className="w-full border-t border-gray-200"></div>
                          ))}
                        </div>
                        
                        {/* Sentiment zones - background colors */}
                        <div className="absolute inset-0 flex flex-col pointer-events-none">
                          <div className="flex-[30] bg-green-50"></div>
                          <div className="flex-[20] bg-yellow-50"></div>
                          <div className="flex-[50] bg-red-50"></div>
                        </div>
                        
                        {/* SVG for line chart */}
                        <svg 
                          className="absolute inset-0 w-full h-full" 
                          viewBox="0 0 100 200"
                          preserveAspectRatio="none"
                          style={{ overflow: 'visible' }}
                        >
                          <defs>
                            <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                              <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.15" />
                              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.1" />
                            </linearGradient>
                          </defs>
                          
                          {/* Fill area under line */}
                          {analysis.sentimentJourney.length > 1 && (
                            <polygon
                              points={`0,200 ${analysis.sentimentJourney.map((point, index) => {
                                const x = (index / (analysis.sentimentJourney.length - 1)) * 100;
                                const y = (100 - point.score) * 2;
                                return `${x},${y}`;
                              }).join(' ')} 100,200`}
                              fill="url(#sentimentGradient)"
                            />
                          )}
                          
                          {/* Line path */}
                          {analysis.sentimentJourney.length > 1 && (
                            <polyline
                              points={analysis.sentimentJourney.map((point, index) => {
                                const x = (index / (analysis.sentimentJourney.length - 1)) * 100;
                                const y = (100 - point.score) * 2;
                                return `${x},${y}`;
                              }).join(' ')}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="0.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                        </svg>
                        
                        {/* Data points */}
                        <div className="absolute inset-0">
                          {analysis.sentimentJourney.map((point: any, index) => {
                            const xPercent = analysis.sentimentJourney.length === 1 
                              ? 50 
                              : (index / (analysis.sentimentJourney.length - 1)) * 100;
                            const yPercent = 100 - point.score;
                            const color = point.score >= 70 ? 'bg-green-500' : point.score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                            
                            return (
                              <div
                                key={index}
                                className="absolute group"
                                style={{
                                  left: `${xPercent}%`,
                                  top: `${yPercent}%`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                              >
                                {/* Point */}
                                <button
                                  onClick={() => {
                                    setSelectedCallId(point.callId);
                                    setSelectedCallNumber(point.callNumber || index + 1);
                                  }}
                                  className={`w-4 h-4 ${color} rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform z-10`}
                                />
                                
                                {/* Tooltip with AI reasoning and View Details button */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-gray-900 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg pointer-events-none group-hover:pointer-events-auto max-w-xs">
                                  <div className="font-semibold">Call #{point.callNumber || index + 1}</div>
                                  <div>{new Date(point.timestamp || point.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                                  <div>Score: {point.score}/100</div>
                                  <div className="capitalize">{point.sentiment.replace('_', ' ')}</div>
                                  {point.aiReasoning && (
                                    <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300 text-xs">
                                      <div className="font-semibold text-indigo-300">AI Analysis:</div>
                                      <div className="whitespace-normal">{point.aiReasoning}</div>
                                    </div>
                                  )}
                                  {point.churnIndicators && point.churnIndicators.length > 0 && (
                                    <div className="mt-1 text-red-300 text-xs">
                                      <div className="font-semibold">⚠️ Churn Signals:</div>
                                      <div className="whitespace-normal">{point.churnIndicators.join(', ')}</div>
                                    </div>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCallId(point.callId);
                                      setSelectedCallNumber(point.callNumber || index + 1);
                                    }}
                                    className="mt-2 w-full px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Full AI Analysis
                                  </button>
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                    <div className="border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* X-axis labels - show call numbers with dates */}
                        <div className="absolute -bottom-10 left-0 right-0 flex justify-between text-xs text-gray-500">
                          {analysis.sentimentJourney.map((point: any, index) => {
                            const xPercent = analysis.sentimentJourney.length === 1 
                              ? 50 
                              : (index / (analysis.sentimentJourney.length - 1)) * 100;
                            return (
                              <div 
                                key={index} 
                                className="absolute text-center transform -translate-x-1/2"
                                style={{ left: `${xPercent}%` }}
                              >
                                <div className="font-medium text-gray-700">Call #{point.callNumber || index + 1}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex justify-center gap-6 mt-20 text-xs text-gray-600">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        Positive (70-100)
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                        Neutral (50-69)
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        Negative (0-49)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                    <p className="text-gray-600 text-sm">
                      No sentiment journey data available. Customer may have limited recent interaction history.
                    </p>
                  </div>
                )}
              </div>

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

      {/* Call Transcript Detail Modal */}
      {selectedCallId && (
        <CallTranscriptDetail
          callId={selectedCallId}
          callNumber={selectedCallNumber}
          customerName={customer.name}
          onClose={() => setSelectedCallId(null)}
        />
      )}
    </motion.div>
  );
}

