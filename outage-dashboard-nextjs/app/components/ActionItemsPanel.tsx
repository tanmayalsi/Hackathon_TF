'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X,
  AlertCircle,
} from 'lucide-react';
import { useGenerateActionItems, useActionItems } from '@/lib/social-hooks';
import { getPriorityColor, getDepartmentColor, formatSocialTimestamp } from '@/lib/utils';
import type { ActionItem } from '@/types';

interface ActionItemsPanelProps {
  hours: number;
}

export function ActionItemsPanel({ hours }: ActionItemsPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [localActionItems, setLocalActionItems] = useState<ActionItem[]>([]);
  
  const { mutate: generateActionItems, isPending: isGenerating } = useGenerateActionItems();
  const { data: actionItemsData } = useActionItems();

  const handleGenerate = () => {
    generateActionItems(hours, {
      onSuccess: (data) => {
        setLocalActionItems(data.actionItems);
      },
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const updateItemStatus = (id: string, status: 'done' | 'dismissed') => {
    setLocalActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const displayItems = localActionItems.length > 0 
    ? localActionItems 
    : actionItemsData?.actionItems || [];

  const pendingItems = displayItems.filter((item) => item.status !== 'done' && item.status !== 'dismissed');
  const completedItems = displayItems.filter((item) => item.status === 'done' || item.status === 'dismissed');

  // Group by department
  const itemsByDepartment = pendingItems.reduce((acc, item) => {
    if (!acc[item.department]) {
      acc[item.department] = [];
    }
    acc[item.department].push(item);
    return acc;
  }, {} as Record<string, ActionItem[]>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded border-2 border-black p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            AI Action Items
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-generated prioritized tasks from social media analysis
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate
            </>
          )}
        </motion.button>
      </div>

      {displayItems.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Click "Generate" to create AI-powered action items from social media posts
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Items by Department */}
          {Object.entries(itemsByDepartment).map(([department, items]) => (
            <div key={department}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className={`px-3 py-1 rounded text-sm font-medium border ${getDepartmentColor(department as any)}`}>
                  {department}
                </span>
                <span className="text-sm text-gray-500">({items.length})</span>
              </h3>
              <div className="space-y-3">
                {items.map((item) => {
                  const isExpanded = expandedItems.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="border-2 border-black rounded bg-white"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(item.priority)}`}>
                                {item.priority.toUpperCase()}
                              </span>
                              <h4 className="font-semibold text-sm">{item.title}</h4>
                            </div>
                            <p className="text-sm text-gray-700">{item.description}</p>
                            {item.relatedPosts && item.relatedPosts.length > 0 && (
                              <p className="text-xs text-gray-500 mt-2">
                                Related to {item.relatedPosts.length} post(s)
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => updateItemStatus(item.id, 'done')}
                              className="p-2 hover:bg-green-50 rounded transition-colors"
                              title="Mark as done"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              onClick={() => updateItemStatus(item.id, 'dismissed')}
                              className="p-2 hover:bg-red-50 rounded transition-colors"
                              title="Dismiss"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                            {item.relatedPosts && item.relatedPosts.length > 0 && (
                              <button
                                onClick={() => toggleExpanded(item.id)}
                                className="p-2 hover:bg-gray-50 rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Related Posts */}
                        <AnimatePresence>
                          {isExpanded && item.relatedPosts && item.relatedPosts.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <p className="text-xs font-semibold text-gray-600 mb-2">
                                Related Posts:
                              </p>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {item.relatedPosts.map((post) => (
                                  <div
                                    key={post.id}
                                    className="p-2 bg-gray-50 rounded text-xs"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">@{post.username}</span>
                                      <span className="text-gray-500">•</span>
                                      <span className="text-gray-500">{post.social_media}</span>
                                      <span className="text-gray-500">•</span>
                                      <span className="text-gray-500">
                                        {formatSocialTimestamp(post.timestamp)}
                                      </span>
                                    </div>
                                    <p className="text-gray-700">{post.comment}</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-500">
                Completed ({completedItems.length})
              </h3>
              <div className="space-y-2">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 rounded border border-gray-200 opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      {item.status === 'done' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm line-through">{item.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

