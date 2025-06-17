import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import FileCard from './components/FileCard';
import QueryInterface from './components/QueryInterface';
import SummaryModal from './components/SummaryModal';
import EmptyState from './components/EmptyState';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import { FileUpload } from './types';
import { apiClient } from './lib/api';
import { useAuth } from './contexts/AuthContext';

type ViewType = 'upload' | 'dashboard' | 'query' | 'profile' | 'admin';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('upload');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isGuest } = useAuth();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getAllFiles();
      if (response.success && response.data) {
        setFiles(response.data);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploaded = (newFile: FileUpload) => {
    setFiles(prev => [newFile, ...prev]);
    
    if (currentView === 'upload') {
      setCurrentView('dashboard');
    }
  };

  const handleViewSummary = (file: FileUpload) => {
    setSelectedFile(file);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Transform Your Content with AI
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Upload audio, video, or text files to get instant AI-powered summaries and insights
              </p>
              {isGuest && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    💡 <strong>Guest Mode:</strong> You can use all features without signing in, but your data won't be saved. 
                    Sign in to keep your files and chat history.
                  </p>
                </div>
              )}
            </div>
            <FileUploader onFileUploaded={handleFileUploaded} />
          </div>
        );

      case 'dashboard':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Files
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {files.length} file{files.length !== 1 ? 's' : ''} uploaded
                  {isGuest && ' (Guest Mode - not saved)'}
                </p>
              </div>
              
              <button
                onClick={() => setCurrentView('upload')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Upload New File</span>
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl h-48"></div>
                ))}
              </div>
            ) : files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onViewSummary={handleViewSummary}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="dashboard" />
            )}
          </div>
        );

      case 'query':
        return files.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            {isGuest && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  ⚠️ <strong>Guest Mode:</strong> Your chat history won't be saved. Sign in to keep your conversations.
                </p>
              </div>
            )}
            <QueryInterface />
          </div>
        ) : (
          <EmptyState type="query" />
        );

      case 'profile':
        return <ProfilePage />;

      case 'admin':
        return <AdminPage />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900 transition-colors duration-300">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>

      {selectedFile && (
        <SummaryModal
          file={selectedFile}
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;