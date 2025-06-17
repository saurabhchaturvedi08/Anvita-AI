import React, { useCallback, useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle2, Link, Plus } from 'lucide-react';
import { apiClient } from '../lib/api';
import { FileUpload, StorageConnection } from '../types';
import { formatFileSize } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import StorageConnectionModal from './StorageConnectionModal';

interface FileUploaderProps {
  onFileUploaded: (file: FileUpload) => void;
}

export default function FileUploader({ onFileUploaded }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [storageConnections, setStorageConnections] = useState<StorageConnection[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string>('');
  const [showStorageModal, setShowStorageModal] = useState(false);
  
  const { isGuest } = useAuth();

  React.useEffect(() => {
    if (!isGuest) {
      loadStorageConnections();
    }
  }, [isGuest]);

  const loadStorageConnections = async () => {
    try {
      const response = await apiClient.getStorageConnections();
      if (response.success && response.data) {
        setStorageConnections(response.data);
      }
    } catch (error) {
      console.error('Failed to load storage connections:', error);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg',
      // Video
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      // Text
      'text/plain', 'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      return 'File size must be less than 100MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload audio, video, or text files.';
    }

    return null;
  };

  const processFiles = async (files: FileList) => {
    setError(null);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(fileId, 0);
        return newMap;
      });

      try {
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const currentProgress = newMap.get(fileId) || 0;
            if (currentProgress < 90) {
              newMap.set(fileId, currentProgress + 10);
            }
            return newMap;
          });
        }, 200);

        const response = await apiClient.uploadFile(file, selectedStorage);
        
        clearInterval(progressInterval);

        if (response.success && response.data) {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.set(fileId, 100);
            return newMap;
          });

          const fileUpload: FileUpload = {
            id: response.data.fileId || fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'processing',
            progress: 100,
            uploadedAt: new Date(),
          };

          onFileUploaded(fileUpload);

          setTimeout(() => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(fileId);
              return newMap;
            });
          }, 1000);
        } else {
          throw new Error(response.error || 'Upload failed');
        }
      } catch (err) {
        clearInterval(progressInterval);
        setError(err instanceof Error ? err.message : 'Upload failed');
        
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;

    setError(null);
    const uploadId = `url_${Date.now()}`;
    
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.set(uploadId, 0);
      return newMap;
    });

    try {
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          const currentProgress = newMap.get(uploadId) || 0;
          if (currentProgress < 90) {
            newMap.set(uploadId, currentProgress + 15);
          }
          return newMap;
        });
      }, 300);

      const response = await apiClient.uploadFromUrl(urlInput, selectedStorage);
      
      clearInterval(progressInterval);

      if (response.success && response.data) {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(uploadId, 100);
          return newMap;
        });

        const fileUpload: FileUpload = {
          id: response.data.fileId,
          name: urlInput.split('/').pop() || 'URL Content',
          size: 0,
          type: 'url',
          status: 'processing',
          progress: 100,
          uploadedAt: new Date(),
        };

        onFileUploaded(fileUpload);
        setUrlInput('');
        setIsUrlMode(false);

        setTimeout(() => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(uploadId);
            return newMap;
          });
        }, 1000);
      } else {
        throw new Error(response.error || 'URL upload failed');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'URL upload failed');
      
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(uploadId);
        return newMap;
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Storage Selection */}
      {!isGuest && storageConnections.length > 0 && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Storage Destination</h3>
            <button
              onClick={() => setShowStorageModal(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Storage</span>
            </button>
          </div>
          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Default Storage</option>
            {storageConnections.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.name} ({connection.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Upload Mode Toggle */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setIsUrlMode(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              !isUrlMode
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload Files
          </button>
          <button
            onClick={() => setIsUrlMode(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isUrlMode
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Link className="w-4 h-4 inline mr-2" />
            From URL
          </button>
        </div>
      </div>

      {/* URL Upload */}
      {isUrlMode ? (
        <div className="space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl">
            <div className="text-center">
              <Link className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Upload from URL
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Enter a URL to audio, video, or document content
              </p>
              
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/file.mp3"
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleUrlUpload}
                  disabled={!urlInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* File Upload */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
            isDragOver
              ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isDragOver ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Upload className={`w-8 h-8 transition-colors duration-300 ${
                isDragOver ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`} />
            </div>
            
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Drop your files here, or browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Support for audio, video, and text files up to 100MB
              </p>
              
              <label htmlFor="file-upload" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105">
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                multiple
                accept="audio/*,video/*,text/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.size > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Uploading Files</h3>
          {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => (
            <div key={fileId} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <File className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {fileId.startsWith('url_') ? 'Processing URL...' : 'Uploading...'}
                    </p>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                {progress === 100 && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supported File Types */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Supported File Types</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <strong>Audio:</strong> MP3, WAV, AAC, OGG
          </div>
          <div>
            <strong>Video:</strong> MP4, AVI, MOV, WMV
          </div>
          <div>
            <strong>Text:</strong> TXT, PDF, DOC, DOCX
          </div>
        </div>
      </div>

      {/* Storage Connection Modal */}
      <StorageConnectionModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        onConnectionAdded={loadStorageConnections}
      />
    </div>
  );
}