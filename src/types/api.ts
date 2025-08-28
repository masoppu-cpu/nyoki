/**
 * API型定義
 * チケット: COMMON-001 API仕様書作成
 */

import { Plant, UserPlant, RoomAnalysis, PurchaseListItem, LightRequirement, PlantCategory } from './index';

// 共通レスポンス形式
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 植物関連
export interface PlantsListParams {
  category?: PlantCategory;
  limit?: number;
  offset?: number;
}

export interface PlantSearchParams {
  keyword?: string;
  category?: PlantCategory;
  size?: string;
  difficulty?: string;
  lightRequirement?: LightRequirement;
}

export interface PlantSearchRequest {
  query: PlantSearchParams;
}

// ユーザー植物管理
export interface AddUserPlantRequest {
  plantId: string;
  nickname?: string;
  location: string;
  purchaseDate?: string;
}

export interface UpdateUserPlantRequest {
  nickname?: string;
  location?: string;
  lastWatered?: string;
}

export interface WaterPlantRequest {
  wateredAt: string;
}

// 部屋・配置プレビュー関連
export interface RoomAnalyzeRequest {
  imageBase64: string;
  userId?: string;
}

export interface RoomAnalyzeResponse {
  roomType: string;
  lightLevel: LightRequirement;
  roomStyle: PlantCategory;
  recommendedPlantIds: string[];
  analysisId: string;
}

export interface GenerateARImageRequest {
  roomImageBase64: string;
  plantId: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface GenerateARImageResponse {
  generatedImageUrl: string;
  generationId: string;
}

export interface RoomHistoryResponse {
  history: RoomAnalysis[];
  total: number;
}

// 購入検討リスト（非決済/MVP）
export interface AddToPurchaseListRequest {
  plantId: string;
  externalUrl?: string;
}

export interface PurchaseListResponse {
  items: PurchaseListItem[];
  total: number;
}

export interface MarkAsPurchasedRequest {
  purchasedAt?: string;
}

// サブスクリプション
export interface SubscriptionStatus {
  isPremium: boolean;
  planType: 'free' | 'premium';
  expiresAt?: string;
  plantLimit: number;
  currentPlantCount: number;
  aiGenerationLimit: number;
  aiGenerationUsed: number;
  aiConsultationLimit: number;
  aiConsultationUsed: number;
}

export interface UpgradeSubscriptionRequest {
  planType: 'premium';
  paymentMethod?: string;
}

export interface CancelSubscriptionRequest {
  reason?: string;
}

// Supabase Edge Functions用の型
export interface SupabaseFunctionInvokeOptions<T = any> {
  body?: T;
  headers?: Record<string, string>;
}

// エラーコード定義
export enum ApiErrorCode {
  // 認証エラー
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // バリデーションエラー
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // リソースエラー
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // 制限エラー
  PLANT_LIMIT_EXCEEDED = 'PLANT_LIMIT_EXCEEDED',
  AI_GENERATION_LIMIT_EXCEEDED = 'AI_GENERATION_LIMIT_EXCEEDED',
  AI_CONSULTATION_LIMIT_EXCEEDED = 'AI_CONSULTATION_LIMIT_EXCEEDED',
  
  // サーバーエラー
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// ページネーション
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}