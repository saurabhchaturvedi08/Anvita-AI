import React, { useCallback, useState } from 'react';
import {
  Upload, File, AlertCircle, CheckCircle2, Link, Plus
} from 'lucide-react';
import {
  getPresignedUploadUrl,
  uploadFileToS3
} from '../api/s3UploadAPI';
import { FileUpload, StorageConnection } from '../types';
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
  const [uploadedFileLinks, setUploadedFileLinks] = useState<{ name: string; url: string }[]>([]);

  const { isGuest } = useAuth();

  React.useEffect(() => {
    if (!isGuest) {
      loadStorageConnections();
    }
  }, [isGuest]);

  const loadStorageConnections = async () => {
    // Optional: fetch user storage destinations
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
      'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'text/plain', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (file.size > maxSize) return 'File size must be less than 100MB';
    if (!allowedTypes.includes(file.type)) return 'Unsupported file type.';
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
      setUploadingFiles(prev => new Map(prev).set(fileId, 0));

      let progressInterval: ReturnType<typeof setInterval> | undefined;

      try {
        progressInterval = setInterval(() => {
          setUploadingFiles(prev => {
            const updated = new Map(prev);
            const currentProgress = updated.get(fileId) || 0;
            if (currentProgress < 90) updated.set(fileId, currentProgress + 10);
            return updated;
          });
        }, 200);

        // 1. Get signed URL
        const presigned = await getPresignedUploadUrl({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        // 2. Upload file using presigned URL
        await uploadFileToS3(presigned.uploadUrl, file, file.type);

        // 3. Complete
        if (progressInterval) clearInterval(progressInterval);
        setUploadingFiles(prev => new Map(prev).set(fileId, 100));
        setUploadedFileLinks(prev => [...prev, { name: file.name, url: presigned.publicUrl }]);

        onFileUploaded({
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'completed',
          progress: 100,
          uploadedAt: new Date()
        });

        setTimeout(() => {
          setUploadingFiles(prev => {
            const updated = new Map(prev);
            updated.delete(fileId);
            return updated;
          });
        }, 1000);

      } catch (err: any) {
        if (progressInterval) clearInterval(progressInterval);
        setError(err.message || 'Upload failed');
        setUploadingFiles(prev => {
          const updated = new Map(prev);
          updated.delete(fileId);
          return updated;
        });
      }
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
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;
    const uploadId = `url_${Date.now()}`;
    setUploadingFiles(prev => new Map(prev).set(uploadId, 0));

    let interval: ReturnType<typeof setInterval> | undefined;
    try {
      interval = setInterval(() => {
        setUploadingFiles(prev => {
          const updated = new Map(prev);
          const progress = updated.get(uploadId) || 0;
          if (progress < 90) updated.set(uploadId, progress + 15);
          return updated;
        });
      }, 300);

      throw new Error('Upload from URL not implemented yet.');

    } catch (err: any) {
      if (interval) clearInterval(interval);
      setError(err.message || 'URL upload failed');
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        updated.delete(uploadId);
        return updated;
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!isGuest && storageConnections.length > 0 && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border">
          <div className="flex justify-between mb-3">
            <h3 className="text-sm font-medium">Storage Destination</h3>
            <button onClick={() => setShowStorageModal(true)} className="text-sm text-blue-600 flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add Storage
            </button>
          </div>
          <select
            value={selectedStorage}
            onChange={e => setSelectedStorage(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Default Storage</option>
            {storageConnections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setIsUrlMode(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              !isUrlMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload Files
          </button>
          <button
            onClick={() => setIsUrlMode(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isUrlMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
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
          <div className="p-6 border-2 border-dashed rounded-2xl text-center">
            <Link className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Upload from URL</h3>
            <p className="text-sm text-gray-500 mb-4">Enter a file URL to upload</p>
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/file.mp3"
                className="flex-1 px-4 py-3 border rounded-lg"
              />
              <button
                onClick={handleUrlUpload}
                disabled={!urlInput.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-lg font-semibold">Drop files here or browse</p>
            <p className="text-sm text-gray-500">Supported: Audio, Video, PDF, DOCX up to 100MB</p>
            <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl">
              <Upload className="w-4 h-4 inline mr-2" />
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
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {uploadingFiles.size > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium">Uploading Files</h3>
          {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => (
            <div key={fileId} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <File className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium truncate">{fileId.startsWith('url_') ? 'From URL...' : 'Uploading...'}</p>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {progress === 100 && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadedFileLinks.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border rounded-xl">
          <h4 className="text-sm font-medium mb-2">Uploaded Files</h4>
          <ul className="space-y-1">
            {uploadedFileLinks.map((file, idx) => (
              <li key={idx}>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <StorageConnectionModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        onConnectionAdded={loadStorageConnections}
      />
    </div>
  );
}
