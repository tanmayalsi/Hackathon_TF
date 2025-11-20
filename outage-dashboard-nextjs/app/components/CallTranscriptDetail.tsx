'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Phone, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Lightbulb, Clock, User } from 'lucide-react';
import { useAnalyzeCallTranscript } from '@/lib/churn-hooks';

interface CallTranscriptDetailProps {
  callId: number;
  callNumber: number;
  customerName: string;
  onClose: () => void;
}

export function CallTranscriptDetail({ callId, callNumber, customerName, onClose }: CallTranscriptDetailProps) {
  const { data, isLoading, error } = useAnalyzeCallTranscript(callId, true);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'very_positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'positive': return 'text-green-500 bg-green-50 border-green-200';
      case 'neutral': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'negative': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very_negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getChurnColor = (level: string) => {
    switch (level) {
      case 'very_low': return 'text-green-600 bg-green-50 border-green-200';
      case 'low': return 'text-green-500 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Call #{callNumber} - AI Analysis</h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {customerName}
                </span>
                <span>•</span>
                <span>Call ID: {callId}</span>
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
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-3" />
              <p className="text-gray-600">Analyzing call transcript with Claude AI...</p>
              <p className="text-sm text-gray-500 mt-1">This may take 10-15 seconds</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-600 mb-3" />
              <p className="text-gray-900 font-medium">Failed to analyze call</p>
              <p className="text-sm text-gray-600 mt-1">{String(error)}</p>
            </div>
          )}

          {data && data.analysis && (
            <div className="space-y-6">
              {/* Call Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Call Date</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(data.analysis.callDate).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Duration
                  </div>
                  <div className="font-semibold text-gray-900">{data.analysis.duration} minutes</div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  Call Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">{data.analysis.summary}</p>
              </div>

              {/* Sentiment & Churn in Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Sentiment Analysis */}
                <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Sentiment Analysis</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Overall Sentiment</div>
                      <span className={`px-4 py-2 rounded-lg border text-sm font-semibold inline-block ${getSentimentColor(data.analysis.sentimentAnalysis.sentiment)}`}>
                        {data.analysis.sentimentAnalysis.sentiment.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Sentiment Score</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              data.analysis.sentimentAnalysis.overallScore >= 70 ? 'bg-green-500' :
                              data.analysis.sentimentAnalysis.overallScore >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${data.analysis.sentimentAnalysis.overallScore}%` }}
                          />
                        </div>
                        <span className="text-lg font-bold text-gray-900 w-12">{data.analysis.sentimentAnalysis.overallScore}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Emotional Tone</div>
                      <div className="flex flex-wrap gap-2">
                        {data.analysis.sentimentAnalysis.emotionalTone.map((emotion, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Confidence: {(data.analysis.sentimentAnalysis.confidence * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {/* Churn Likelihood */}
                <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    Churn Likelihood
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Risk Level</div>
                      <span className={`px-4 py-2 rounded-lg border text-sm font-semibold inline-block ${getChurnColor(data.analysis.churnLikelihood.level)}`}>
                        {data.analysis.churnLikelihood.level.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Churn Score</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              data.analysis.churnLikelihood.score >= 70 ? 'bg-red-500' :
                              data.analysis.churnLikelihood.score >= 40 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${data.analysis.churnLikelihood.score}%` }}
                          />
                        </div>
                        <span className="text-lg font-bold text-gray-900 w-12">{data.analysis.churnLikelihood.score}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">AI Reasoning</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{data.analysis.churnLikelihood.reasoning}</p>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Confidence: {(data.analysis.churnLikelihood.confidence * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Key Insights</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-semibold text-gray-900">Main Issues</span>
                    </div>
                    <ul className="space-y-1">
                      {data.analysis.keyInsights.mainIssues.map((issue, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-semibold text-gray-900">Customer Concerns</span>
                    </div>
                    <ul className="space-y-1">
                      {data.analysis.keyInsights.customerConcerns.map((concern, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {data.analysis.keyInsights.positiveSignals.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-gray-900">Positive Signals</span>
                      </div>
                      <ul className="space-y-1">
                        {data.analysis.keyInsights.positiveSignals.map((signal, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.analysis.keyInsights.negativeSignals.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-semibold text-gray-900">Negative Signals</span>
                      </div>
                      <ul className="space-y-1">
                        {data.analysis.keyInsights.negativeSignals.map((signal, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    data.analysis.keyInsights.urgency === 'high' ? 'bg-red-100 text-red-700' :
                    data.analysis.keyInsights.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {data.analysis.keyInsights.urgency.toUpperCase()} URGENCY
                  </span>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-green-600" />
                  Recommended Actions
                </h3>
                <div className="space-y-3">
                  {data.analysis.recommendedActions.map((action, i) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(action.priority)}`}>
                          {action.priority.toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{action.action}</div>
                          <div className="text-sm text-gray-600">{action.rationale}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transcript (if included) */}
              {data.analysis.transcript && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Full Transcript</h3>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {data.analysis.transcript}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {data && `Analysis generated ${new Date(data.generatedAt).toLocaleTimeString()}`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

