/**
 * モックAPIハンドラー
 * チケット: FE-001 モックAPI層実装
 * 
 * 各エンドポイントのモックレスポンスを定義
 */

import { ApiResponse } from '../../types/api';
import { Plant, UserPlant, PurchaseListItem } from '../../types';
import { plantService } from '../plants';
import { ErrorSimulator } from './errorSimulator';

// 遅延シミュレーション
const simulateDelay = (min: number = 200, max: number = 800): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// モックユーザー
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'テストユーザー',
  isPremium: false,
  createdAt: new Date().toISOString(),
};

// モックデータストア（メモリ内）
const mockDataStore = {
  userPlants: [] as UserPlant[],
  purchaseList: [] as PurchaseListItem[],
  roomAnalyses: [] as any[],
};

// モックハンドラーの型定義
type MockHandler = (options?: RequestInit) => Promise<ApiResponse<any>>;

export const mockHandlers: Record<string, MockHandler> = {
  // ===== 植物関連 =====
  '/api/plants': async () => {
    await simulateDelay();
    
    // エラーシミュレーション
    if (ErrorSimulator.shouldFail(0.05)) {
      return {
        success: false,
        error: ErrorSimulator.getRandomError(),
      };
    }

    const plants = await plantService.getAllPlants();
    return {
      success: true,
      data: plants,
    };
  },

  '/api/plants/search': async (options) => {
    await simulateDelay();
    
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const query = body.query?.keyword || '';
    
    const plants = await plantService.searchPlants(query);
    return {
      success: true,
      data: plants,
    };
  },

  '/api/plants/recommended': async () => {
    await simulateDelay();
    
    const plants = await plantService.getRecommendedPlants();
    return {
      success: true,
      data: plants,
    };
  },

  // ===== ユーザー植物管理 =====
  '/api/user/plants': async () => {
    await simulateDelay();
    
    return {
      success: true,
      data: mockDataStore.userPlants,
    };
  },

  '/api/user/plants/add': async (options) => {
    await simulateDelay();
    
    const body = options?.body ? JSON.parse(options.body as string) : {};
    
    const newUserPlant: UserPlant = {
      id: Date.now().toString(),
      plantId: body.plantId,
      name: body.name || '新しい植物',
      nickname: body.nickname,
      location: body.location || 'リビング',
      lastWatered: new Date().toISOString(),
      daysUntilWatering: 7,
      health: 'healthy',
      image: require('../../../assets/images/your-room-after-plant1.png'),
      purchaseDate: body.purchaseDate || new Date().toISOString(),
    };
    
    mockDataStore.userPlants.push(newUserPlant);
    
    return {
      success: true,
      data: newUserPlant,
    };
  },

  '/api/user/plants/water': async (options) => {
    await simulateDelay();
    
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const plantId = body.plantId;
    
    const plant = mockDataStore.userPlants.find(p => p.id === plantId);
    if (plant) {
      plant.lastWatered = new Date().toISOString();
      plant.daysUntilWatering = 7;
    }
    
    return {
      success: true,
      data: { message: '水やりを記録しました' },
    };
  },

  // ===== 購入検討リスト =====
  '/api/purchase-list': async () => {
    await simulateDelay();
    
    return {
      success: true,
      data: {
        items: mockDataStore.purchaseList,
        total: mockDataStore.purchaseList.length,
      },
    };
  },

  '/api/purchase-list/add': async (options) => {
    await simulateDelay();
    
    const body = options?.body ? JSON.parse(options.body as string) : {};
    
    // 植物情報を取得
    const plant = await plantService.getPlantById(body.plantId);
    if (!plant) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '植物が見つかりません',
        },
      };
    }
    
    const newItem: PurchaseListItem = {
      plant: plant,
      status: 'considering',
      externalUrl: body.externalUrl,
      addedAt: new Date().toISOString(),
    };
    
    mockDataStore.purchaseList.push(newItem);
    
    return {
      success: true,
      data: { id: Date.now().toString() },
    };
  },

  '/api/purchase-list/purchased': async () => {
    await simulateDelay();
    
    const purchasedItems = mockDataStore.purchaseList.filter(
      item => item.status === 'purchased'
    );
    
    return {
      success: true,
      data: {
        items: purchasedItems,
        total: purchasedItems.length,
      },
    };
  },

  '/api/purchase-list/mark-purchased': async (options) => {
    await simulateDelay();
    
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const plantId = body.plantId;
    
    const item = mockDataStore.purchaseList.find(
      i => i.plant.id === plantId
    );
    
    if (item) {
      item.status = 'purchased';
      item.purchasedAt = new Date().toISOString();
    }
    
    return {
      success: true,
      data: { message: '購入済みにしました' },
    };
  },

  // ===== 部屋分析 =====
  '/api/rooms/analyze': async (options) => {
    await simulateDelay(1000, 2000); // 分析は時間がかかる
    
    const body = options?.body ? JSON.parse(options.body as string) : {};
    
    // エラーシミュレーション（分析は失敗しやすい）
    if (ErrorSimulator.shouldFail(0.1)) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: '画像分析に失敗しました。もう一度お試しください。',
        },
      };
    }
    
    const analysis = {
      roomType: '洋室',
      lightLevel: '明るい日陰' as any,
      roomStyle: 'natural' as any,
      recommendedPlantIds: ['1', '2', '3'],
      analysisId: Date.now().toString(),
    };
    
    mockDataStore.roomAnalyses.push({
      ...analysis,
      imageUrl: body.imageBase64,
      createdAt: new Date().toISOString(),
    });
    
    return {
      success: true,
      data: analysis,
    };
  },

  '/api/rooms/history': async () => {
    await simulateDelay();
    
    return {
      success: true,
      data: {
        history: mockDataStore.roomAnalyses,
        total: mockDataStore.roomAnalyses.length,
      },
    };
  },

  // ===== AR画像生成 =====
  '/api/ar/generate': async (options) => {
    await simulateDelay(2000, 3000); // 画像生成は時間がかかる
    
    // エラーシミュレーション
    if (ErrorSimulator.shouldFail(0.15)) {
      return {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: '画像生成に失敗しました。もう一度お試しください。',
        },
      };
    }
    
    return {
      success: true,
      data: {
        generatedImageUrl: 'https://mockapi.nyoki.app/generated/mock-image.png',
        generationId: Date.now().toString(),
      },
    };
  },

  // ===== 認証（Supabase Auth直接使用のため最小限） =====
  '/api/auth/session': async () => {
    await simulateDelay();
    
    return {
      success: true,
      data: {
        user: mockUser,
        session: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: Date.now() + 3600000,
        },
      },
    };
  },

  // ===== サブスクリプション =====
  '/api/subscription/status': async () => {
    await simulateDelay();
    
    return {
      success: true,
      data: {
        isPremium: mockUser.isPremium,
        planType: mockUser.isPremium ? 'premium' : 'free',
        plantLimit: mockUser.isPremium ? 999 : 5,
        currentPlantCount: mockDataStore.userPlants.length,
        aiGenerationLimit: mockUser.isPremium ? 999 : 5,
        aiGenerationUsed: 2,
        aiConsultationLimit: mockUser.isPremium ? 999 : 10,
        aiConsultationUsed: 3,
      },
    };
  },

  '/api/subscription/upgrade': async () => {
    await simulateDelay(1500, 2500);
    
    mockUser.isPremium = true;
    
    return {
      success: true,
      data: {
        message: 'プレミアムプランにアップグレードしました',
        isPremium: true,
      },
    };
  },
};