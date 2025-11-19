'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Stats } from './components/Stats';
import { Timeline } from './components/Timeline';
import { TimeRangeSelector } from './components/TimeRangeSelector';
import { OutageDetailsPane } from './components/OutageDetailsPane';
import { useOutageData, useTimelineData, useStats } from '@/lib/hooks';
import { RefreshCw } from 'lucide-react';

// Dynamic imports for components that use client-side only libraries
const OutageMap = dynamic(() => import('./components/OutageMap').then((mod) => ({ default: mod.OutageMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-white rounded p-6 border-2 border-black">
      <div className="animate-pulse h-full bg-gray-100 rounded"></div>
    </div>
  ),
});

export default function DashboardPage() {
  const [selectedHours, setSelectedHours] = useState(24);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedOutage, setSelectedOutage] = useState<{
    zip_code: string;
    call_count: number;
    coordinates: {
      city: string;
      lat: number;
      lon: number;
    };
  } | null>(null);

  const {
    data: outageData,
    isLoading: outageLoading,
    refetch: refetchOutage,
  } = useOutageData(selectedHours);
  const {
    data: timelineData,
    isLoading: timelineLoading,
    refetch: refetchTimeline,
  } = useTimelineData(selectedHours);
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useStats(selectedHours);

  const handleRefresh = () => {
    refetchOutage();
    refetchTimeline();
    refetchStats();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-black"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-black">
                Outage Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time Technical Support Analytics
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black border-2 border-black rounded hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded border-black text-black focus:ring-black"
                />
                <span className="text-sm text-black">Auto-refresh</span>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <TimeRangeSelector selectedHours={selectedHours} onSelect={setSelectedHours} />
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          <Stats data={statsData} isLoading={statsLoading} />

          {/* Map */}
          <OutageMap 
            data={outageData} 
            isLoading={outageLoading}
            onSelectOutage={setSelectedOutage}
          />

          {/* Timeline Chart */}
          <Timeline data={timelineData} isLoading={timelineLoading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-black bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            Built with Next.js 14, React, TypeScript, Leaflet, and Tailwind CSS
          </p>
          <p className="mt-1">
            Last updated: {statsData?.last_call_time ? new Date(statsData.last_call_time).toLocaleString() : 'N/A'}
          </p>
        </div>
      </footer>

      {/* Outage Details Pane */}
      {selectedOutage && (
        <OutageDetailsPane
          selectedOutage={selectedOutage}
          selectedHours={selectedHours}
          onClose={() => setSelectedOutage(null)}
        />
      )}
    </div>
  );
}
