'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react';

interface Transcript {
  call_id: number;
  customer_id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  call_reason: string;
  transcript: string;
  customer_location: string;
  service_address: string;
}

interface TranscriptsResponse {
  zip_code: string;
  time_range_hours: number;
  call_count: number;
  transcripts: Transcript[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface OutageDetailsPaneProps {
  selectedOutage: {
    zip_code: string;
    call_count: number;
    coordinates: {
      city: string;
      lat: number;
      lon: number;
    };
  } | null;
  selectedHours: number;
  onClose: () => void;
}

export function OutageDetailsPane({
  selectedOutage,
  selectedHours,
  onClose,
}: OutageDetailsPaneProps) {
  const [transcriptsData, setTranscriptsData] = useState<TranscriptsResponse | null>(null);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(false);
  const [expandedCallIds, setExpandedCallIds] = useState<Set<number>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch transcripts when outage changes
  useEffect(() => {
    if (!selectedOutage) return;

    const fetchTranscripts = async () => {
      setIsLoadingTranscripts(true);
      try {
        const response = await fetch(
          `/api/outage-transcripts?zip=${selectedOutage.zip_code}&hours=${selectedHours}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch transcripts');
        }
        const data: TranscriptsResponse = await response.json();
        setTranscriptsData(data);
      } catch (error) {
        console.error('Error fetching transcripts:', error);
      } finally {
        setIsLoadingTranscripts(false);
      }
    };

    fetchTranscripts();
    // Reset chat when outage changes
    setMessages([]);
    setExpandedCallIds(new Set());
  }, [selectedOutage, selectedHours]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleCallExpanded = (callId: number) => {
    setExpandedCallIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(callId)) {
        newSet.delete(callId);
      } else {
        newSet.add(callId);
      }
      return newSet;
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedOutage || isSendingMessage) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/outage-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: selectedOutage.zip_code,
          hours: selectedHours,
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!selectedOutage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full lg:w-[600px] bg-white border-l-2 border-black shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-black bg-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black">
                Outage Details
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedOutage.coordinates.city} ({selectedOutage.zip_code})
              </p>
              <p className="text-sm text-gray-600">
                {transcriptsData?.call_count || selectedOutage.call_count} technical support calls
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Transcripts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoadingTranscripts ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : transcriptsData && transcriptsData.transcripts.length > 0 ? (
            transcriptsData.transcripts.map((transcript) => {
              const isExpanded = expandedCallIds.has(transcript.call_id);
              const startTime = new Date(transcript.started_at);

              return (
                <div
                  key={transcript.call_id}
                  className="border-2 border-black rounded bg-white"
                >
                  <button
                    onClick={() => toggleCallExpanded(transcript.call_id)}
                    className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-start justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">
                          Call #{transcript.call_id}
                        </span>
                        <span className="text-xs text-gray-500">
                          {transcript.duration_minutes} min
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {startTime.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {transcript.customer_location}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 flex-shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-3 border-t-2 border-black bg-gray-50">
                      <div className="text-xs space-y-2">
                        <div>
                          <span className="font-semibold">Customer ID:</span>{' '}
                          {transcript.customer_id}
                        </div>
                        <div>
                          <span className="font-semibold">Location:</span>{' '}
                          {transcript.customer_location}
                        </div>
                        <div className="mt-3">
                          <span className="font-semibold block mb-2">Transcript:</span>
                          <div className="bg-white p-3 rounded border border-gray-300 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs">
                            {transcript.transcript}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">
              No transcripts found for this outage.
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="border-t-2 border-black bg-white flex flex-col" style={{ height: '350px' }}>
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-bold text-sm">Ask Claude about this outage</h3>
            <p className="text-xs text-gray-500 mt-1">
              Ask questions about patterns, issues, or specific details
            </p>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-xs py-4">
                Start a conversation by asking a question below
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded p-2 text-xs ${
                      msg.role === 'user'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-black border border-gray-300'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            {isSendingMessage && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-black border border-gray-300 rounded p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask a question..."
                disabled={isSendingMessage || isLoadingTranscripts}
                className="flex-1 px-3 py-2 text-sm border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isSendingMessage || isLoadingTranscripts}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

