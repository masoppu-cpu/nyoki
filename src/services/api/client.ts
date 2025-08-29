/**
 * APIクライアント
 * チケット: FE-001 モックAPI層実装
 * 
 * モック/実API切り替え可能なAPIクライアント
 */

import { ApiResponse } from '../../types/api';
import { mockHandlers } from './mockHandlers';

export class ApiClient {
  private baseURL: string;
  private useMock: boolean;

  constructor() {
    this.useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || '';
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    if (this.useMock) {
      return this.mockRequest<T>(endpoint, options);
    }
    return this.realRequest<T>(endpoint, options);
  }

  private async mockRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // モックハンドラーを取得
    const handler = mockHandlers[endpoint];
    
    if (!handler) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Mock handler not found for ${endpoint}`,
        },
      };
    }

    try {
      // モックハンドラーを実行
      const result = await handler(options);
      return result as ApiResponse<T>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'MOCK_ERROR',
          message: error.message || 'Mock handler error',
        },
      };
    }
  }

  private async realRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: `HTTP error! status: ${response.status}`,
          },
        };
      }

      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error occurred',
        },
      };
    }
  }

  // Helper methods for common HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient();