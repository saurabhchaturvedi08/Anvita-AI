import React, { useState, useRef, useEffect } from 'react';
import { Search, Send, Loader2, FileText, Brain, Sparkles } from 'lucide-react';
import { apiClient } from '../lib/api';
import { QueryResult } from '../types';

interface QueryMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: QueryResult['sources'];
  timestamp: Date;
}

export default function QueryInterface() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: QueryMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await apiClient.queryContent(query);
      
      if (response.success && response.data) {
        const assistantMessage: QueryMessage = {
          id: `assistant_${Date.now()}`,
          type: 'assistant',
          content: response.data.answer,
          sources: response.data.sources,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'Query failed');
      }
    } catch (error) {
      const errorMessage: QueryMessage = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  const sampleQueries = [
    "What were the key decisions made in the last board meeting?",
    "Summarize the main action items from recent project discussions",
    "What concerns were raised about the Q4 budget?",
    "Who was assigned to lead the marketing initiative?"
  ];

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ask Anything About Your Content
        </h2>
        <p className="text-gray-600">
          Search through all your uploaded files with intelligent AI-powered queries
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {sampleQueries.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleQuery(sample)}
                  className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 group"
                >
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-purple-500 mt-0.5 group-hover:text-purple-600" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {sample}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}
                >
                  <p className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-gray-900'}`}>
                    {message.content}
                  </p>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        Sources ({message.sources.length})
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, index) => (
                          <div
                            key={index}
                            className="p-2 bg-gray-50 rounded-lg text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-700">
                                {source.fileName}
                              </span>
                              <span className="text-gray-500">
                                {Math.round(source.similarity * 100)}% match
                              </span>
                            </div>
                            <p className="text-gray-600 line-clamp-2">
                              {source.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your uploaded content..."
            className="flex-1 outline-none text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}