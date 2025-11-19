'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { SentimentTrendChart } from '../components/SentimentTrendChart';
import { ActionItemsPanel } from '../components/ActionItemsPanel';
import { SocialMediaFeed } from '../components/SocialMediaFeed';
import { SocialMediaChat } from '../components/SocialMediaChat';
import { ResponseGenerator } from '../components/ResponseGenerator';
import { useSentimentData } from '@/lib/social-hooks';
import type { SocialMediaPost } from '@/types';

// Custom time ranges for social media (excluding Last Hour and Last 6 Hours)
const SOCIAL_MEDIA_TIME_RANGES = [
  { label: 'Last 24 Hours', hours: 24 },
  { label: 'Last Week', hours: 168 },
  { label: 'Last Month', hours: 720 },
  { label: 'Last 3 Months', hours: 2160 },
  { label: 'All Time', hours: 87600 }, // 10 years
];

export default function SocialMediaPage() {
  const [selectedHours, setSelectedHours] = useState(2160); // Default Last 3 Months to show all data
  const [selectedPosts, setSelectedPosts] = useState<SocialMediaPost[]>([]);
  const [showResponseGenerator, setShowResponseGenerator] = useState(false);
  const [filters, setFilters] = useState({
    platform: '',
    category: '',
    location: '',
    search: '',
  });

  const {
    data: sentimentData,
    isLoading: sentimentLoading,
    refetch: refetchSentiment,
  } = useSentimentData(selectedHours);

  const handleRefresh = () => {
    refetchSentiment();
  };

  const handleSelectPost = (post: SocialMediaPost, selected: boolean) => {
    if (selected) {
      setSelectedPosts((prev) => [...prev, post]);
    } else {
      setSelectedPosts((prev) => prev.filter((p) => p.id !== post.id));
    }
  };

  const handleGenerateResponses = () => {
    if (selectedPosts.length > 0) {
      setShowResponseGenerator(true);
    }
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
                Social Media Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                AI-Powered Social Media Monitoring & Response
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

              {selectedPosts.length > 0 && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerateResponses}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                >
                  Generate Responses ({selectedPosts.length})
                </motion.button>
              )}
            </div>
          </div>

          <div className="mt-6">
            <TimeRangeSelector 
              selectedHours={selectedHours} 
              onSelect={setSelectedHours} 
              ranges={SOCIAL_MEDIA_TIME_RANGES}
            />
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Charts and Action Items */}
          <div className="xl:col-span-2 space-y-8">
            {/* Sentiment & Trends */}
            <SentimentTrendChart data={sentimentData} isLoading={sentimentLoading} />

            {/* Action Items */}
            <ActionItemsPanel hours={selectedHours} />
          </div>

          {/* Right Column - Feed and Chat */}
          <div className="space-y-8">
            {/* Social Media Feed */}
            <SocialMediaFeed
              hours={selectedHours}
              filters={filters}
              onFiltersChange={setFilters}
              selectedPosts={selectedPosts}
              onSelectPost={handleSelectPost}
            />
          </div>
        </div>

        {/* Chat Interface - Full Width at Bottom */}
        <div className="mt-8">
          <SocialMediaChat hours={selectedHours} filters={filters} />
        </div>
      </main>

      {/* Response Generator Modal */}
      {showResponseGenerator && selectedPosts.length > 0 && (
        <ResponseGenerator
          posts={selectedPosts}
          onClose={() => {
            setShowResponseGenerator(false);
            setSelectedPosts([]);
          }}
        />
      )}
    </div>
  );
}

