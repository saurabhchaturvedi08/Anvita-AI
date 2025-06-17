import React from 'react';
import { Upload, Brain, Search } from 'lucide-react';

interface EmptyStateProps {
  type: 'upload' | 'dashboard' | 'query';
}

export default function EmptyState({ type }: EmptyStateProps) {
  const config = {
    upload: {
      icon: Upload,
      title: 'Upload Your First File',
      subtitle: 'Start by uploading audio, video, or text files to generate AI-powered summaries',
      description: 'Drag and drop files or click to browse. Anvita will automatically transcribe, summarize, and index your content.',
    },
    dashboard: {
      icon: Brain,
      title: 'No Files Yet',
      subtitle: 'Your uploaded files and summaries will appear here',
      description: 'Once you upload files, you\'ll see their processing status, summaries, and be able to share them.',
    },
    query: {
      icon: Search,
      title: 'No Content to Search',
      subtitle: 'Upload some files first to start querying your content',
      description: 'Once you have uploaded files, you can ask questions and search through all your content using AI.',
    },
  };

  const { icon: Icon, title, subtitle, description } = config[type];

  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-2 text-lg">
        {subtitle}
      </p>
      
      <p className="text-gray-500 max-w-md mx-auto text-sm">
        {description}
      </p>
    </div>
  );
}