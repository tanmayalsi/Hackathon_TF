'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { useGenerateResponses } from '@/lib/social-hooks';
import { getPlatformIcon, formatSocialTimestamp, getSentimentColor } from '@/lib/utils';
import type { SocialMediaPost, ResponseDraft } from '@/types';

interface ResponseGeneratorProps {
  posts: SocialMediaPost[];
  onClose: () => void;
}

export function ResponseGenerator({ posts, onClose }: ResponseGeneratorProps) {
  const [tone, setTone] = useState<'professional' | 'empathetic' | 'promotional'>('professional');
  const [responses, setResponses] = useState<ResponseDraft[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { mutate: generateResponses, isPending: isGenerating } = useGenerateResponses();

  const handleGenerate = () => {
    generateResponses(
      {
        postIds: posts.map((p) => p.id),
        tone,
      },
      {
        onSuccess: (data) => {
          setResponses(data.responses);
        },
      }
    );
  };

  const handleCopy = async (response: ResponseDraft) => {
    try {
      await navigator.clipboard.writeText(response.draftResponse);
      setCopiedId(response.postId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg border-2 border-black max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b-2 border-black">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  AI Response Generator
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Generate AI-powered responses for {posts.length} selected post(s)
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tone Selector */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Response Tone:
              </label>
              <div className="flex gap-2">
                {(['professional', 'empathetic', 'promotional'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-4 py-2 rounded border-2 transition-colors capitalize ${
                      tone === t
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            {responses.length === 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Responses...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Responses
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {responses.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700">
                  Posts to respond to:
                </p>
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 border-2 border-gray-200 rounded"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold">@{post.username}</span>
                      <span className="text-xs text-gray-500">
                        {getPlatformIcon(post.social_media)} {post.social_media}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {formatSocialTimestamp(post.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{post.comment}</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getSentimentColor(
                        post.category
                      )}`}
                    >
                      {post.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    Generated Responses:
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border-2 border-black rounded hover:bg-gray-100 transition-colors disabled:bg-gray-400"
                  >
                    <Sparkles className="w-4 h-4" />
                    Regenerate
                  </button>
                </div>
                {responses.map((response) => {
                  const post = posts.find((p) => p.id === response.postId);
                  if (!post) return null;

                  return (
                    <div
                      key={response.postId}
                      className="border-2 border-black rounded overflow-hidden"
                    >
                      {/* Original Post */}
                      <div className="p-4 bg-gray-50 border-b-2 border-black">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Original Post:
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold">@{post.username}</span>
                          <span className="text-xs text-gray-500">
                            {getPlatformIcon(post.social_media)} {post.social_media}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{post.comment}</p>
                      </div>

                      {/* Generated Response */}
                      <div className="p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-600">
                            Suggested Response ({response.tone}):
                          </p>
                          <button
                            onClick={() => handleCopy(response)}
                            className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            {copiedId === response.postId ? (
                              <>
                                <Check className="w-3 h-3 text-green-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm text-gray-800">
                            {response.draftResponse}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-black bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border-2 border-black rounded hover:bg-gray-100 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

