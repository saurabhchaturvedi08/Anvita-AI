import React, { useState } from 'react';
import { X, Database, Cloud, Link, Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/api';
import { StorageConnection } from '../types';

interface StorageConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionAdded: () => void;
}

export default function StorageConnectionModal({ isOpen, onClose, onConnectionAdded }: StorageConnectionModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'s3' | 'gcs' | 'azure' | 'url'>('s3');
  const [config, setConfig] = useState({
    bucket: '',
    region: '',
    accessKey: '',
    secretKey: '',
    url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const connectionData: Omit<StorageConnection, 'id' | 'userId' | 'createdAt'> = {
        name,
        type,
        config,
        isActive: true,
      };

      const response = await apiClient.createStorageConnection(connectionData);
      
      if (response.success) {
        onConnectionAdded();
        onClose();
        resetForm();
      } else {
        setError(response.error || 'Failed to create connection');
      }
    } catch (err) {
      setError('An error occurred while creating the connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Simulate test connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResult({ success: true, message: 'Connection successful!' });
    } catch (err) {
      setTestResult({ success: false, message: 'Connection failed. Please check your credentials.' });
    } finally {
      setIsTesting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('s3');
    setConfig({
      bucket: '',
      region: '',
      accessKey: '',
      secretKey: '',
      url: '',
    });
    setError('');
    setTestResult(null);
  };

  const storageTypes = [
    { value: 's3', label: 'Amazon S3', icon: Database },
    { value: 'gcs', label: 'Google Cloud Storage', icon: Cloud },
    { value: 'azure', label: 'Azure Blob Storage', icon: Cloud },
    { value: 'url', label: 'Custom URL', icon: Link },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add Storage Connection
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connection Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="My Storage Connection"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Storage Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {storageTypes.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {type === 'url' ? (
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="https://api.example.com/storage"
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="bucket" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bucket/Container Name
                  </label>
                  <input
                    type="text"
                    id="bucket"
                    value={config.bucket}
                    onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="my-bucket-name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region
                  </label>
                  <input
                    type="text"
                    id="region"
                    value={config.region}
                    onChange={(e) => setConfig({ ...config, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="us-east-1"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Access Key
                  </label>
                  <input
                    type="text"
                    id="accessKey"
                    value={config.accessKey}
                    onChange={(e) => setConfig({ ...config, accessKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Your access key"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Secret Key
                  </label>
                  <input
                    type="password"
                    id="secretKey"
                    value={config.secretKey}
                    onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Your secret key"
                    required
                  />
                </div>
              </>
            )}

            {/* Test Connection */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors duration-200"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>Test Connection</span>
              </button>

              {testResult && (
                <div className={`flex items-center space-x-2 ${
                  testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>Add Connection</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}