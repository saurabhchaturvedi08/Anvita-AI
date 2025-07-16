export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  uploadedAt: Date;
  summary?: string;
  transcription?: string;
  duration?: number;
  userId?: string;
  isPublic?: boolean;
  publicUrl?: string;
}

export interface QueryResult {
  answer: string;
  sources: SourceChunk[];
  confidence: number;
  queryId?: string;
  timestamp?: Date;
}

export interface SourceChunk {
  fileId: string;
  fileName: string;
  content: string;
  similarity: number;
  timestamp?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoSummarize: boolean;
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface ChatSession {
  id: string;
  title: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface StorageConnection {
  id: string;
  name: string;
  type: 's3' | 'gcs' | 'azure' | 'url';
  config: {
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
    url?: string;
  };
  userId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface UserProfile {
  user: User;
  stats: {
    totalFiles: number;
    totalQueries: number;
    storageUsed: number;
    lastActivity: Date;
  };
  recentFiles: FileUpload[];
  recentSessions: ChatSession[];
}