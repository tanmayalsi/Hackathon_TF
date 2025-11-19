'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, Users, MapPin, DollarSign, Phone } from 'lucide-react';
import { useBatchChurnData } from '@/lib/churn-hooks';
import { CustomerChurnAnalysis } from './CustomerChurnAnalysis';
import type { AtRiskCustomer } from '@/types';

export function AtRiskCustomersList() {
  const { data: batchData } = useBatchChurnData();
  const [selectedCustomer, setSelectedCustomer] = useState<AtRiskCustomer | null>(null);
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium'>('all');

  if (!batchData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
          <p className="text-gray-600">
            Run the churn analysis to identify at-risk customers
          </p>
        </div>
      </div>
    );
  }

  const filteredCustomers = batchData.atRiskCustomers.filter(customer => {
    if (filterRisk === 'all') return true;
    return customer.riskLevel === filterRisk;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getRiskIcon = (level: string) => {
    return level === 'high' ? AlertTriangle : TrendingUp;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              At-Risk Customers
            </h2>
            <div className="text-sm text-gray-600">
              {filteredCustomers.length} customers
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRisk('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRisk === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({batchData.atRiskCustomers.length})
            </button>
            <button
              onClick={() => setFilterRisk('high')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRisk === 'high'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              High Risk ({batchData.summary.highRisk})
            </button>
            <button
              onClick={() => setFilterRisk('medium')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRisk === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Medium Risk ({batchData.summary.mediumRisk})
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center text-gray-600">
              No customers match the selected filter
            </div>
          )}

          {filteredCustomers.map((customer, index) => {
            const RiskIcon = getRiskIcon(customer.riskLevel);
            return (
              <motion.div
                key={customer.customerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1 ${getRiskColor(customer.riskLevel)}`}>
                        <RiskIcon className="w-3 h-3" />
                        {customer.riskLevel.toUpperCase()}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {customer.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({customer.customerId})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {customer.location}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        ${customer.accountValue.toLocaleString()}/year
                      </div>
                      <div className="col-span-2 text-gray-700">
                        <strong>Issue:</strong> {customer.primaryIssue}
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {customer.riskScore}
                    </div>
                    <div className="text-xs text-gray-500">Risk Score</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(customer);
                      }}
                      className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Last activity: {new Date(customer.lastActivity).toLocaleString()}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <CustomerChurnAnalysis
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

