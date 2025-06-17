import { FileUpload, QueryResult, ApiResponse, User, UserProfile, ChatSession, StorageConnection } from '../types';

const API_BASE_URL = 'https://api.anvita-app.com'; // Replace with your actual API URL

// Dummy data for demonstration
const DUMMY_FILES: FileUpload[] = [
  {
    id: 'file_1',
    name: 'Q4 Board Meeting.mp4',
    size: 45678901,
    type: 'video/mp4',
    status: 'completed',
    progress: 100,
    uploadedAt: new Date('2024-01-15'),
    summary: 'The Q4 board meeting covered financial performance, strategic initiatives for 2024, and budget allocations. Key decisions included expanding the marketing team by 30%, investing $2M in AI infrastructure, and launching three new product lines. The board approved the annual budget of $50M and discussed potential partnerships with tech companies.',
    transcription: 'Welcome everyone to our Q4 board meeting. Today we will discuss our financial performance, which has exceeded expectations with a 25% growth in revenue...',
    duration: 3600,
  },
  {
    id: 'file_2',
    name: 'Product Strategy Document.pdf',
    size: 2345678,
    type: 'application/pdf',
    status: 'completed',
    progress: 100,
    uploadedAt: new Date('2024-01-10'),
    summary: 'The product strategy document outlines our roadmap for 2024-2025, focusing on AI-powered features, user experience improvements, and market expansion. Key priorities include developing voice recognition capabilities, implementing real-time collaboration tools, and expanding to European markets.',
    duration: undefined,
  },
  {
    id: 'file_3',
    name: 'Team Standup Recording.mp3',
    size: 12345678,
    type: 'audio/mp3',
    status: 'processing',
    progress: 75,
    uploadedAt: new Date('2024-01-20'),
    duration: 1800,
  },
  {
    id: 'file_4',
    name: 'Customer Feedback Analysis.docx',
    size: 3456789,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    status: 'failed',
    progress: 0,
    uploadedAt: new Date('2024-01-18'),
  },
];

const DUMMY_USERS: User[] = [
  {
    id: 'user_1',
    email: 'admin@anvita.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date('2023-01-01'),
    lastLoginAt: new Date('2024-01-20'),
    preferences: {
      theme: 'system',
      notifications: true,
      autoSummarize: true,
    },
  },
  {
    id: 'user_2',
    email: 'john.doe@company.com',
    name: 'John Doe',
    role: 'user',
    createdAt: new Date('2023-06-15'),
    lastLoginAt: new Date('2024-01-19'),
    preferences: {
      theme: 'dark',
      notifications: false,
      autoSummarize: true,
    },
  },
  {
    id: 'user_3',
    email: 'jane.smith@company.com',
    name: 'Jane Smith',
    role: 'user',
    createdAt: new Date('2023-08-20'),
    lastLoginAt: new Date('2024-01-18'),
    preferences: {
      theme: 'light',
      notifications: true,
      autoSummarize: false,
    },
  },
];

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('anvita-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Mock API responses with dummy data
      if (endpoint === '/files' && options.method !== 'DELETE') {
        return {
          success: true,
          data: DUMMY_FILES as T,
        };
      }

      if (endpoint.startsWith('/summary/')) {
        const fileId = endpoint.split('/')[2];
        const file = DUMMY_FILES.find(f => f.id === fileId);
        if (file && file.status === 'completed') {
          return {
            success: true,
            data: {
              summary: file.summary,
              transcription: file.transcription,
            } as T,
          };
        }
      }

      if (endpoint === '/query' && options.method === 'POST') {
        const body = JSON.parse(options.body as string);
        const query = body.query.toLowerCase();
        
        let answer = "I found relevant information in your uploaded content.";
        let sources = [];

        if (query.includes('board meeting') || query.includes('q4')) {
          answer = "Based on the Q4 board meeting recording, the key decisions included expanding the marketing team by 30%, investing $2M in AI infrastructure, and launching three new product lines. The board also approved an annual budget of $50M.";
          sources = [{
            fileId: 'file_1',
            fileName: 'Q4 Board Meeting.mp4',
            content: 'Key decisions included expanding the marketing team by 30%, investing $2M in AI infrastructure, and launching three new product lines.',
            similarity: 0.95,
          }];
        } else if (query.includes('product') || query.includes('strategy')) {
          answer = "The product strategy focuses on AI-powered features, user experience improvements, and market expansion. Key priorities include developing voice recognition capabilities and expanding to European markets.";
          sources = [{
            fileId: 'file_2',
            fileName: 'Product Strategy Document.pdf',
            content: 'Key priorities include developing voice recognition capabilities, implementing real-time collaboration tools, and expanding to European markets.',
            similarity: 0.88,
          }];
        } else {
          answer = "I searched through your uploaded content but couldn't find specific information related to your query. Try asking about board meetings, product strategy, or team updates.";
        }

        return {
          success: true,
          data: {
            answer,
            sources,
            confidence: 0.85,
            queryId: `query_${Date.now()}`,
            timestamp: new Date(),
          } as T,
        };
      }

      if (endpoint === '/auth/login' && options.method === 'POST') {
        const body = JSON.parse(options.body as string);
        const user = DUMMY_USERS.find(u => u.email === body.email);
        
        if (user && body.password === 'password') {
          return {
            success: true,
            data: {
              token: `token_${user.id}_${Date.now()}`,
              user,
            } as T,
          };
        } else {
          return {
            success: false,
            error: 'Invalid credentials',
          };
        }
      }

      if (endpoint === '/auth/register' && options.method === 'POST') {
        const body = JSON.parse(options.body as string);
        const newUser: User = {
          id: `user_${Date.now()}`,
          email: body.email,
          name: body.name,
          role: 'user',
          createdAt: new Date(),
          preferences: {
            theme: 'system',
            notifications: true,
            autoSummarize: true,
          },
        };

        return {
          success: true,
          data: {
            token: `token_${newUser.id}_${Date.now()}`,
            user: newUser,
          } as T,
        };
      }

      if (endpoint === '/auth/me') {
        const token = localStorage.getItem('anvita-token');
        if (token) {
          const userId = token.split('_')[1];
          const user = DUMMY_USERS.find(u => u.id === userId) || DUMMY_USERS[0];
          return {
            success: true,
            data: user as T,
          };
        }
      }

      if (endpoint === '/profile') {
        const token = localStorage.getItem('anvita-token');
        if (token) {
          const userId = token.split('_')[1];
          const user = DUMMY_USERS.find(u => u.id === userId) || DUMMY_USERS[0];
          
          const profile: UserProfile = {
            user,
            stats: {
              totalFiles: DUMMY_FILES.length,
              totalQueries: 45,
              storageUsed: DUMMY_FILES.reduce((sum, file) => sum + file.size, 0),
              lastActivity: new Date(),
            },
            recentFiles: DUMMY_FILES.slice(0, 3),
            recentSessions: [],
          };

          return {
            success: true,
            data: profile as T,
          };
        }
      }

      if (endpoint === '/admin/users') {
        return {
          success: true,
          data: DUMMY_USERS as T,
        };
      }

      if (endpoint === '/admin/stats') {
        return {
          success: true,
          data: {
            totalUsers: DUMMY_USERS.length,
            totalFiles: DUMMY_FILES.length,
            totalQueries: 156,
            storageUsed: DUMMY_FILES.reduce((sum, file) => sum + file.size, 0),
          } as T,
        };
      }

      if (endpoint.includes('/role') && options.method === 'PUT') {
        const userId = endpoint.split('/')[3];
        const body = JSON.parse(options.body as string);
        const user = DUMMY_USERS.find(u => u.id === userId);
        
        if (user) {
          user.role = body.role;
          return {
            success: true,
            data: user as T,
          };
        }
      }

      if (endpoint === '/upload' && options.method === 'POST') {
        return {
          success: true,
          data: {
            fileId: `file_${Date.now()}`,
            uploadUrl: 'https://example.com/upload',
          } as T,
        };
      }

      if (endpoint === '/upload/url' && options.method === 'POST') {
        return {
          success: true,
          data: {
            fileId: `file_${Date.now()}`,
          } as T,
        };
      }

      if (endpoint === '/notify' && options.method === 'POST') {
        return {
          success: true,
          data: {
            message: 'Email sent successfully',
          } as T,
        };
      }

      if (endpoint === '/storage/connections') {
        return {
          success: true,
          data: [] as T,
        };
      }

      // Default success response
      return {
        success: true,
        data: {} as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request('/profile');
  }

  // File Management
  async uploadFile(file: File, storageId?: string): Promise<ApiResponse<{ fileId: string; uploadUrl?: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    if (storageId) {
      formData.append('storageId', storageId);
    }

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('anvita-token') || ''}`,
      },
    });
  }

  async uploadFromUrl(url: string, storageId?: string): Promise<ApiResponse<{ fileId: string }>> {
    return this.request('/upload/url', {
      method: 'POST',
      body: JSON.stringify({ url, storageId }),
    });
  }

  async getFileStatus(fileId: string): Promise<ApiResponse<FileUpload>> {
    return this.request(`/files/${fileId}`);
  }

  async getAllFiles(): Promise<ApiResponse<FileUpload[]>> {
    return this.request('/files');
  }

  async getSummary(fileId: string): Promise<ApiResponse<{ summary: string; transcription: string }>> {
    return this.request(`/summary/${fileId}`);
  }

  async deleteFile(fileId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Query and Chat
  async queryContent(query: string, sessionId?: string): Promise<ApiResponse<QueryResult>> {
    return this.request('/query', {
      method: 'POST',
      body: JSON.stringify({ query, sessionId }),
    });
  }

  async getChatSessions(): Promise<ApiResponse<ChatSession[]>> {
    return this.request('/chat/sessions');
  }

  async getChatSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    return this.request(`/chat/sessions/${sessionId}`);
  }

  async createChatSession(title?: string): Promise<ApiResponse<ChatSession>> {
    return this.request('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async deleteChatSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Storage Connections
  async getStorageConnections(): Promise<ApiResponse<StorageConnection[]>> {
    return this.request('/storage/connections');
  }

  async createStorageConnection(connection: Omit<StorageConnection, 'id' | 'userId' | 'createdAt'>): Promise<ApiResponse<StorageConnection>> {
    return this.request('/storage/connections', {
      method: 'POST',
      body: JSON.stringify(connection),
    });
  }

  async testStorageConnection(connectionId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/storage/connections/${connectionId}/test`);
  }

  async deleteStorageConnection(connectionId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/storage/connections/${connectionId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async sendEmailSummary(fileId: string, email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/notify', {
      method: 'POST',
      body: JSON.stringify({ fileId, email }),
    });
  }

  // Admin endpoints
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/admin/users');
  }

  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<ApiResponse<User>> {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getSystemStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalFiles: number;
    totalQueries: number;
    storageUsed: number;
  }>> {
    return this.request('/admin/stats');
  }
}

export const apiClient = new ApiClient();