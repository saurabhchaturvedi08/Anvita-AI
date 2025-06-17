import React, { useState } from 'react';
import { User, Mail, Calendar, Settings, FileText, MessageSquare, HardDrive, Activity, Save, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notifications: user?.preferences.notifications || false,
    autoSummarize: user?.preferences.autoSummarize || false,
  });

  if (!user || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Please sign in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateProfile({
        ...user,
        name: formData.name,
        email: formData.email,
        preferences: {
          ...user.preferences,
          theme,
          notifications: formData.notifications,
          autoSummarize: formData.autoSummarize,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
              <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {user.createdAt.toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.stats.totalFiles}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Files</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.stats.totalQueries}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Queries</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBytes(profile.stats.storageUsed)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Storage</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.stats.lastActivity.toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Settings</h2>
        
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">Theme:</span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value as any)}
                    className={`px-3 py-1 rounded-md text-sm transition-all duration-200 ${
                      theme === value
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.notifications}
                  onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                  disabled={!isEditing}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Email notifications for processing completion
                </span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.autoSummarize}
                  onChange={(e) => setFormData({ ...formData, autoSummarize: e.target.checked })}
                  disabled={!isEditing}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Automatically generate summaries for uploaded files
                </span>
              </label>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Files</h3>
          <div className="space-y-3">
            {profile.recentFiles.slice(0, 5).map((file) => (
              <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {file.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  file.status === 'completed' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                }`}>
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {profile.recentSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.messages.length} messages • {session.updatedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}