/**
 * 認証関連の型定義
 * チケット: COMMON-002 TypeScript型定義
 */

// ユーザー情報
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt?: string;
}

// セッション情報
export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// 認証リクエスト
export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 認証レスポンス
export interface AuthResponse {
  user: User;
  session: Session;
}

// プロファイル
export interface Profile {
  id: string;
  name?: string;
  avatar?: string;
  isPremium: boolean;
  plantCount: number;
  aiGenerationUsed: number;
  aiConsultationUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

// 認証エラー
export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_NOT_CONFIRMED'
  | 'USER_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_TOKEN'
  | 'SESSION_EXPIRED'
  | 'RATE_LIMIT_EXCEEDED';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  statusCode?: number;
}