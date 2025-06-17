import React from 'react';
import { X, Download, Mail, Copy, Check } from 'lucide-react';
import { FileUpload } from '../types';
import { formatFileSize, formatDuration } from '../lib/utils';

interface SummaryModalProps {
  file: FileUpload;
  isOpen: boolean;
  onClose: () => void;
}

export default function SummaryModal({ file, isOpen, onClose }: SummaryModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (file.summary) {
      await navigator.clipboard.writeText(file.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (file.summary) {
      const blob = new Blob([file.summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.split('.')[0]}_summary.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{file.name}</h2>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>{formatFileSize(file.size)}</span>
              {file.duration && (
                <>
                  <span>•</span>
                  <span>{formatDuration(file.duration)}</span>
                </>
              )}
              <span>•</span>
              <span>{file.uploadedAt.toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Copy summary"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Download summary"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              Summary
              <div className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                AI Generated
              </div>
            </h3>
            <div className="prose prose-gray max-w-none">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {file.summary || 'Summary is being generated...'}
                </p>
              </div>
            </div>
          </div>

          {/* Transcription */}
          {file.transcription && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                Full Transcription
                <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Complete Text
                </div>
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                  {file.transcription}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {file.summary ? `${file.summary.length} characters` : 'Generating summary...'}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}