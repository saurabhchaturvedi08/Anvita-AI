import React, { useState } from 'react';
import { Brain, MessageSquare, Upload, Search, User, Settings, LogOut, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import AuthModal from './AuthModal';

interface HeaderProps {
  currentView: 'upload' | 'dashboard' | 'query' | 'profile' | 'admin';
  onViewChange: (view: 'upload' | 'dashboard' | 'query' | 'profile' | 'admin') => void;
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  const { user, logout, isGuest } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleAuthClick = () => {
    if (isGuest) {
      setShowAuthModal(true);
    } else {
      setShowUserMenu(!showUserMenu);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    onViewChange('upload');
  };

  const navigationItems = [
    { id: 'upload', icon: Upload, label: 'Upload', show: true },
    { id: 'dashboard', icon: MessageSquare, label: 'Dashboard', show: true },
    { id: 'query', icon: Search, label: 'Query', show: true },
    { id: 'profile', icon: User, label: 'Profile', show: !isGuest },
    { id: 'admin', icon: Shield, label: 'Admin', show: user?.role === 'admin' },
  ] as const;

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Anvita
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Smart Meeting Summarizer</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map(({ id, icon: Icon, label, show }) => 
                show && (
                  <button
                    key={id}
                    onClick={() => onViewChange(id as any)}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                      currentView === id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                )
              )}
            </nav>

            {/* Right Side */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={handleAuthClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  {isGuest ? (
                    <>
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">Sign In</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">{user?.name}</span>
                    </>
                  )}
                </button>

                {/* User Dropdown */}
                {showUserMenu && !isGuest && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                    <button
                      onClick={() => {
                        onViewChange('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
              <nav className="space-y-2">
                {navigationItems.map(({ id, icon: Icon, label, show }) => 
                  show && (
                    <button
                      key={id}
                      onClick={() => {
                        onViewChange(id as any);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                        currentView === id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  )
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}