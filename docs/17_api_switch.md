# チケット #17: モック→実API切り替え

**タスクID**: INT-002  
**担当**: Full-stack  
**推定時間**: 3時間  
**依存関係**: [FE-001: モックAPI, BE-002〜BE-006: 各API実装]  
**優先度**: 高（Phase 2）

## 概要
開発中のモックAPIから実際のSupabase APIへの切り替え実装。環境変数で切り替え可能にする。

## TODO リスト

- [ ] API切り替え機構実装
- [ ] 環境変数設定
- [ ] 各サービスの実API実装
- [ ] エラーハンドリング統一
- [ ] リトライ機構実装
- [ ] API レスポンスキャッシュ

## API切り替え実装

### APIクライアント基盤
```typescript
// src/services/api/apiClient.ts
import { supabase } from '../../lib/supabase';

export interface ApiConfig {
  useMock: boolean;
  mockDelay: number;
  retryCount: number;
  timeout: number;
}

export class ApiClient {
  private config: ApiConfig;

  constructor() {
    this.config = {
      useMock: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
      mockDelay: 500,
      retryCount: 3,
      timeout: 30000,
    };
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    if (this.config.useMock) {
      return this.mockRequest<T>(endpoint, options);
    }
    return this.realRequest<T>(endpoint, options);
  }

  private async realRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      // Supabase DB経由の場合
      if (endpoint.startsWith('/api/plants')) {
        return this.handlePlantsEndpoint<T>(endpoint, options);
      }
      if (endpoint.startsWith('/api/user/plants')) {
        return this.handleUserPlantsEndpoint<T>(endpoint, options);
      }
      if (endpoint.startsWith('/api/purchase-list')) {
        return this.handlePurchaseListEndpoint<T>(endpoint, options);
      }

      // Edge Functions は supabase.functions.invoke を使用（ユーザーJWTが自動付与）
      const fnMap: Record<string, string> = {
        '/api/rooms/analyze': 'analyze-room',
        '/api/rooms/generate': 'generate-ar-image',
        '/api/rooms/history': 'room-history',
      };
      const fn = fnMap[endpoint];
      if (!fn) throw new Error(`Unknown endpoint: ${endpoint}`);

      const payload = options?.body ? JSON.parse(options.body as string) : undefined;
      const { data, error } = await supabase.functions.invoke(fn, {
        body: payload,
      });
      if (error) throw error;
      return { success: true, data: data as T };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error.message,
        },
      };
    }
  }

  private async handlePlantsEndpoint<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      // GET /api/plants
      if (endpoint === '/api/plants' && options?.method === 'GET') {
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('is_available', true)
          .order('popularity_score', { ascending: false });

        if (error) throw error;
        return { success: true, data: data as T };
      }

      // GET /api/plants/:id
      const match = endpoint.match(/^\/api\/plants\/(.+)$/);
      if (match && options?.method === 'GET') {
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('id', match[1])
          .single();

        if (error) throw error;
        return { success: true, data: data as T };
      }

      // GET /api/plants/recommended
      if (endpoint === '/api/plants/recommended') {
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .eq('difficulty', '初心者向け')
          .limit(3);

        if (error) throw error;
        return { success: true, data: data as T };
      }

      throw new Error('Unknown plants endpoint');
    } catch (error: any) {
      return { 
        success: false, 
        error: { 
          code: 'SUPABASE_ERROR', 
          message: error.message 
        } 
      };
    }
  }

  private async handleUserPlantsEndpoint<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // GET /api/user/plants
      if (endpoint === '/api/user/plants' && options?.method === 'GET') {
        const { data, error } = await supabase
          .from('user_plants')
          .select(`
            *,
            plant:plants(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data as T };
      }

      // POST /api/user/plants
      if (endpoint === '/api/user/plants' && options?.method === 'POST') {
        const body = JSON.parse(options.body as string);
        const { data, error } = await supabase
          .from('user_plants')
          .insert({
            ...body,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, data: data as T };
      }

      throw new Error('Unknown user plants endpoint');
    } catch (error: any) {
      return { 
        success: false, 
        error: { 
          code: 'SUPABASE_ERROR', 
          message: error.message 
        } 
      };
    }
  }

  private async handlePurchaseListEndpoint<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      // GET /api/purchase-list
      if (endpoint === '/api/purchase-list' && (!options?.method || options.method === 'GET')) {
        const { data, error } = await supabase
          .from('purchase_items')
          .select('*, plant:plants(*)')
          .eq('status', 'considering')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, data: data as T };
      }

      // GET /api/purchase-list/purchased
      if (endpoint === '/api/purchase-list/purchased') {
        const { data, error } = await supabase
          .from('purchase_items')
          .select('*, plant:plants(*)')
          .eq('status', 'purchased')
          .order('purchased_at', { ascending: false });
        if (error) throw error;
        return { success: true, data: data as T };
      }

      // POST /api/purchase-list/add
      if (endpoint === '/api/purchase-list/add' && options?.method === 'POST') {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const { plantId, externalUrl } = body;
        if (!plantId) throw new Error('plantId is required');
        const { data, error } = await supabase
          .from('purchase_items')
          .insert({ plant_id: plantId, status: 'considering', external_url: externalUrl || null })
          .select()
          .single();
        if (error) throw error;
        return { success: true, data: data as T };
      }

      // DELETE /api/purchase-list/remove/:id
      const removeMatch = endpoint.match(/^\/api\/purchase-list\/remove\/(.+)$/);
      if (removeMatch && options?.method === 'DELETE') {
        const { error } = await supabase
          .from('purchase_items')
          .delete()
          .eq('id', removeMatch[1]);
        if (error) throw error;
        return { success: true, data: {} as T };
      }

      // PATCH /api/purchase-list/:id/purchased
      const purchasedMatch = endpoint.match(/^\/api\/purchase-list\/(.+)\/purchased$/);
      if (purchasedMatch && options?.method === 'PATCH') {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const { externalUrl } = body;
        const { data, error } = await supabase
          .from('purchase_items')
          .update({ status: 'purchased', purchased_at: new Date().toISOString(), external_url: externalUrl || null })
          .eq('id', purchasedMatch[1])
          .select()
          .single();
        if (error) throw error;
        return { success: true, data: data as T };
      }

      throw new Error('Unknown purchase-list endpoint');
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SUPABASE_ERROR',
          message: error.message,
        },
      };
    }
  }

  // 旧ショッピングカートAPIはMVPでは使用しない（購入検討リストに置換）

  private async mockRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // 既存のモック実装を使用
    await new Promise(resolve => setTimeout(resolve, this.config.mockDelay));
    
    const mockHandler = mockHandlers[endpoint];
    if (mockHandler) {
      return mockHandler(options);
    }
    
    return { 
      success: false, 
      error: { 
        code: 'NOT_FOUND', 
        message: `No mock handler for ${endpoint}` 
      } 
    };
  }
}

export const apiClient = new ApiClient();
```

### サービス層の更新

```typescript
// src/services/plants.ts の更新
import { apiClient } from './api/apiClient';
import { Plant } from '../types';

export class PlantService {
  async getAllPlants(): Promise<Plant[]> {
    const response = await apiClient.request<Plant[]>('/api/plants', {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch plants');
    }

    return response.data || [];
  }

  async getPlantById(id: string): Promise<Plant | null> {
    const response = await apiClient.request<Plant>(`/api/plants/${id}`, {
      method: 'GET',
    });

    if (!response.success) {
      return null;
    }

    return response.data || null;
  }

  async getRecommendedPlants(lightLevel?: string): Promise<Plant[]> {
    const response = await apiClient.request<Plant[]>('/api/plants/recommended', {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch recommendations');
    }

    return response.data || [];
  }

  async searchPlants(query: string): Promise<Plant[]> {
    const response = await apiClient.request<Plant[]>('/api/plants/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });

    if (!response.success) {
      return [];
    }

    return response.data || [];
  }
}

export const plantService = new PlantService();
```

## 環境変数設定

### .env.development
```env
# 開発環境（モック使用）
EXPO_PUBLIC_USE_MOCK=true
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

### .env.staging
```env
# ステージング環境（実API使用）
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_SUPABASE_URL=https://staging-xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

### .env.production
```env
# 本番環境（実API使用）
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_SUPABASE_URL=https://prod-xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

## リトライ機構

```typescript
// src/utils/apiRetry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}
```

## キャッシュ機構

```typescript
// src/utils/apiCache.ts
class ApiCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number = 60000; // 60秒

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
```

## 完了条件
- [ ] API切り替え機構実装
- [ ] 環境変数設定
- [ ] 全サービスの実API実装
- [ ] リトライ機構実装
- [ ] キャッシュ機構実装
- [ ] エラーハンドリング統一

## 備考
- 段階的に切り替え可能な設計
- 開発時はモック、本番は実APIを自動選択
- パフォーマンスを考慮したキャッシュ実装

## 関連ファイル
- `src/services/api/apiClient.ts` - APIクライアント（要更新）
- `src/services/*.ts` - 各サービス（要更新）
- `.env.*` - 環境変数ファイル（要作成）

最終更新: 2025-08-28
