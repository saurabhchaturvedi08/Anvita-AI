import React, { useState } from 'react';
import { 
  File, Clock, Download, Mail, Eye, AlertCircle, 
  CheckCircle2, Loader2, Play, FileText 
} from 'lucide-react';
import { FileUpload } from '../types';
import { formatFileSize, formatDuration, getStatusColor, truncateText } from '../lib/utils';
import { apiClient } from '../lib/api';

interface FileCardProps {
  file: FileUpload;
  onViewSummary: (file: FileUpload) => void;
}

export default function FileCard({ file, onViewSummary }: FileCardProps) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  const getFileIcon = () => {
    if (file.type.startsWith('audio/')) {
      return <Play className="w-6 h-6 text-purple-600" />;
    } else if (file.type.startsWith('video/')) {
      return <Play className="w-6 h-6 text-red-600" />;
    } else {
      return <FileText className="w-6 h-6 text-blue-600" />;
    }
  };

  const handleViewSummary = async () => {
    if (file.status !== 'completed') return;
    
    setIsLoadingSummary(true);
    try {
      const response = await apiClient.getSummary(file.id);
      if (response.success && response.data) {
        const updatedFile = {
          ...file,
          summary: response.data.summary,
          transcription: response.data.transcription,
        };
        onViewSummary(updatedFile);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || file.status !== 'completed') return;

    setIsSendingEmail(true);
    try {
      const response = await apiClient.sendEmailSummary(file.id, email);
      if (response.success) {
        setEmailSent(true);
        setTimeout(() => {
          setIsEmailModalOpen(false);
          setEmailSent(false);
          setEmail('');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
              {getFileIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {file.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                {file.duration && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(file.duration)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
              {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {(file.status === 'uploading' || file.status === 'processing') && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${file.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Summary Preview */}
        {file.summary && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              {truncateText(file.summary, 150)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {file.uploadedAt.toLocaleDateString()}
          </span>
          
          <div className="flex items-center space-x-2">
            {file.status === 'completed' && (
              <>
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title="Send via email"
                >
                  <Mail className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleViewSummary}
                  disabled={isLoadingSummary}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoadingSummary ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span className="text-sm">View</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Send Summary via Email
              </h3>
              
              {emailSent ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-700 font-medium">Email sent successfully!</p>
                </div>
              ) : (
                <form onSubmit={handleSendEmail}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter recipient's email"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingEmail || !email.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isSendingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}