'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSocialMediaData } from '@/lib/social-hooks';
import {
  getSentimentColor,
  getCategoryIcon,
  getPlatformIcon,
  formatSocialTimestamp,
} from '@/lib/utils';
import type { SocialMediaPost } from '@/types';

interface SocialMediaFeedProps {
  hours: number;
  filters: {
    platform: string;
    category: string;
    location: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
  selectedPosts: SocialMediaPost[];
  onSelectPost: (post: SocialMediaPost, selected: boolean) => void;
}

export function SocialMediaFeed({
  hours,
  filters,
  onFiltersChange,
  selectedPosts,
  onSelectPost,
}: SocialMediaFeedProps) {
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 10;

  const { data, isLoading } = useSocialMediaData({
    ...filters,
    hours,
    page,
    pageSize,
  });

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
    setPage(1); // Reset to first page when filters change
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded border-2 border-black p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Social Media Feed</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 border-2 border-black rounded hover:bg-gray-100 transition-colors text-sm"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-4 p-4 bg-gray-50 rounded border border-gray-200 space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Platform
            </label>
            <select
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Platforms</option>
              <option value="Twitter">Twitter</option>
              <option value="Reddit">Reddit</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Categories</option>
              <option value="Service Issue">Service Issue</option>
              <option value="Billing Issue">Billing Issue</option>
              <option value="Customer Service Complaint">Customer Service Complaint</option>
              <option value="Positive Feedback">Positive Feedback</option>
              <option value="Sales Opportunity">Sales Opportunity</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Network Coverage">Network Coverage</option>
              <option value="Corporate/PR Issue">Corporate/PR Issue</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-10 pr-3 py-2 text-sm border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Feed */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            {data.data.map((post) => {
              const isSelected = selectedPosts.some((p) => p.id === post.id);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 border-2 rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => onSelectPost(post, !isSelected)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded border-black text-black focus:ring-black"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-semibold">@{post.username}</span>
                        <span className="text-xs text-gray-500">
                          {getPlatformIcon(post.social_media)} {post.social_media}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {formatSocialTimestamp(post.timestamp)}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{post.location}</span>
                      </div>
                      <p className="text-sm text-gray-800 mb-2">{post.comment}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getSentimentColor(
                            post.category
                          )}`}
                        >
                          {getCategoryIcon(post.category)} {post.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-black rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-black rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No posts found matching your filters
          </div>
        )}
      </div>

      {/* Selected Posts Summary */}
      {selectedPosts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {selectedPosts.length} post(s) selected for response generation
          </p>
        </div>
      )}
    </motion.div>
  );
}

