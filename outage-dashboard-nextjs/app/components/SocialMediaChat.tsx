'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { useSocialChat } from '@/lib/social-hooks';
import type { ChatMessage } from '@/types';

interface SocialMediaChatProps {
  hours: number;
  filters: {
    platform: string;
    category: string;
    location: string;
    search: string;
  };
}

export function SocialMediaChat({ hours, filters }: SocialMediaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { mutate: sendMessage, isPending: isSending } = useSocialChat();

  const suggestedQuestions = [
    'What are the top 3 complaints this week?',
    'Show me all sales opportunities',
    'Which locations have the most service issues?',
    'Summarize positive feedback',
    'What are common billing problems?',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isSending) return;

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    sendMessage(
      {
        messages: [...messages, userMessage],
        filters: {
          platform: filters.platform || undefined,
          category: filters.category || undefined,
          location: filters.location || undefined,
          hours,
        },
      },
      {
        onSuccess: (data) => {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: data.reply,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: (error) => {
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your request. Please try again.',
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded border-2 border-black p-6"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Ask Claude About Social Media
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Get AI-powered insights about trends, patterns, and specific posts
        </p>
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Suggested Questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(question)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="bg-gray-50 rounded border border-gray-200 p-4 mb-4 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Ask a question to start analyzing social media posts
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-white text-black border-2 border-black'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white text-black border-2 border-black rounded px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
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
          placeholder="Ask a question about social media posts..."
          disabled={isSending}
          className="flex-1 px-4 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isSending}
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </motion.button>
      </div>
    </motion.div>
  );
}

