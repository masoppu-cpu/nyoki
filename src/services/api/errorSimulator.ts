/**
 * エラーシミュレーター
 * チケット: FE-001 モックAPI層実装
 * 
 * 開発時のエラー状態テスト用
 */

import { ApiErrorCode } from '../../types/api';

export class ErrorSimulator {
  /**
   * 指定された確率でエラーを発生させるか判定
   * @param rate エラー発生率 (0.0 ~ 1.0)
   */
  static shouldFail(rate: number = 0.1): boolean {
    // 環境変数でエラーシミュレーションを無効化できる
    if (process.env.EXPO_PUBLIC_DISABLE_ERROR_SIM === 'true') {
      return false;
    }
    return Math.random() < rate;
  }

  /**
   * ランダムなエラーを返す
   */
  static getRandomError(): { code: string; message: string } {
    const errors = [
      { 
        code: 'NETWORK_ERROR', 
        message: 'ネットワークエラーが発生しました' 
      },
      { 
        code: ApiErrorCode.SERVICE_UNAVAILABLE, 
        message: 'サーバーが一時的に利用できません' 
      },
      { 
        code: ApiErrorCode.INTERNAL_SERVER_ERROR, 
        message: 'サーバーエラーが発生しました' 
      },
      { 
        code: 'TIMEOUT', 
        message: 'リクエストがタイムアウトしました' 
      },
      { 
        code: 'RATE_LIMIT', 
        message: 'リクエスト制限に達しました。しばらくしてからお試しください' 
      },
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  }

  /**
   * 認証エラーを返す
   */
  static getAuthError(): { code: string; message: string } {
    const errors = [
      { 
        code: ApiErrorCode.UNAUTHORIZED, 
        message: 'ログインが必要です' 
      },
      { 
        code: ApiErrorCode.INVALID_TOKEN, 
        message: 'セッションが期限切れです。再度ログインしてください' 
      },
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  }

  /**
   * バリデーションエラーを返す
   */
  static getValidationError(field?: string): { code: string; message: string } {
    return {
      code: ApiErrorCode.INVALID_REQUEST,
      message: field 
        ? `${field}の形式が正しくありません` 
        : '入力内容に誤りがあります',
    };
  }

  /**
   * リソース制限エラーを返す
   */
  static getResourceLimitError(resourceType: 'plant' | 'ai_generation' | 'ai_consultation'): { 
    code: string; 
    message: string 
  } {
    const errorMessages = {
      plant: {
        code: ApiErrorCode.PLANT_LIMIT_EXCEEDED,
        message: '無料プランでは植物を5つまでしか管理できません。プレミアムプランにアップグレードしてください。',
      },
      ai_generation: {
        code: ApiErrorCode.AI_GENERATION_LIMIT_EXCEEDED,
        message: '今月のAI画像生成回数の上限に達しました。プレミアムプランにアップグレードすると無制限で利用できます。',
      },
      ai_consultation: {
        code: ApiErrorCode.AI_CONSULTATION_LIMIT_EXCEEDED,
        message: '今月のAI相談回数の上限に達しました。プレミアムプランにアップグレードすると無制限で利用できます。',
      },
    };
    
    return errorMessages[resourceType];
  }

  /**
   * 遅延時間を生成（ネットワーク遅延のシミュレーション）
   */
  static getRandomDelay(min: number = 100, max: number = 2000): number {
    // 環境変数で遅延を設定できる
    const envDelay = process.env.EXPO_PUBLIC_MOCK_DELAY;
    if (envDelay) {
      return parseInt(envDelay, 10);
    }
    
    return Math.random() * (max - min) + min;
  }

  /**
   * タイムアウトシミュレーション
   */
  static async simulateTimeout(timeoutMs: number = 5000): Promise<never> {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
    throw new Error('Request timeout');
  }

  /**
   * ネットワーク状態のシミュレーション
   */
  static getNetworkCondition(): 'fast' | 'slow' | 'offline' {
    const rand = Math.random();
    
    // 環境変数で強制設定
    const envCondition = process.env.EXPO_PUBLIC_NETWORK_CONDITION;
    if (envCondition) {
      return envCondition as any;
    }
    
    // ランダムに状態を返す（通常は fast が多い）
    if (rand < 0.8) return 'fast';
    if (rand < 0.95) return 'slow';
    return 'offline';
  }

  /**
   * 条件に応じた遅延を適用
   */
  static async applyNetworkDelay(): Promise<void> {
    const condition = this.getNetworkCondition();
    
    const delays = {
      fast: { min: 50, max: 200 },
      slow: { min: 1000, max: 3000 },
      offline: { min: 5000, max: 10000 },
    };
    
    const { min, max } = delays[condition];
    const delay = this.getRandomDelay(min, max);
    
    if (condition === 'offline' && Math.random() < 0.7) {
      // オフライン時は70%の確率でエラー
      throw new Error('Network offline');
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// エラー発生のデバッグ用ヘルパー
export const debugErrorSimulator = {
  // 強制的にエラーを発生させる（デバッグ用）
  forceError: () => {
    if (process.env.NODE_ENV === 'development') {
      return ErrorSimulator.getRandomError();
    }
    return null;
  },
  
  // エラー率を一時的に変更（デバッグ用）
  setErrorRate: (rate: number) => {
    if (process.env.NODE_ENV === 'development') {
      (global as any).__ERROR_RATE = rate;
    }
  },
};