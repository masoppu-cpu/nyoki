export const APP_CONFIG = {
  name: 'nyoki',
  version: '1.0.0',
  description: 'AI-powered plant placement app',
} as const;

export const SUBSCRIPTION = {
  MAX_FREE_PLANTS: Number(process.env.EXPO_PUBLIC_MAX_FREE_PLANTS) || 5,
  MAX_FREE_AI_ANALYSIS: Number(process.env.EXPO_PUBLIC_MAX_FREE_AI_ANALYSIS) || 5,
  MAX_FREE_AI_CONSULTATION: Number(process.env.EXPO_PUBLIC_MAX_FREE_AI_CONSULTATION) || 10,
  MAX_FREE_AR_GENERATION: Number(process.env.EXPO_PUBLIC_MAX_FREE_AR_GENERATION) || 5,
  MONTHLY_PRICE: Number(process.env.EXPO_PUBLIC_SUBSCRIPTION_PRICE) || 480,
  CURRENCY: 'JPY',
} as const;

export const COLORS = {
  // 新しいカラーパレット
  base: '#efe9dc',          // ベースカラー（背景）
  primary: '#798994',       // メインカラー
  accent: '#9ea48d',        // アクセントカラー
  textOnBase: '#787d76',    // ベースカラー上のテキスト
  textOnPrimary: '#ffffff', // メインカラー上のテキスト
  textOnAccent: '#ffffff',  // アクセントカラー上のテキスト
  
  // 旧カラー（互換性のため一時的に残す）
  secondary: '#9ea48d',     // アクセントカラーと同じ
  background: '#efe9dc',    // ベースカラーと同じ
  surface: '#f5f1e8',       // ベースカラーの明るいバリエーション
  text: '#787d76',          // textOnBaseと同じ
  textSecondary: '#9b9f98', // 少し薄いテキスト
  border: '#d4cfc2',        // ベースカラーの暗いバリエーション
  inactive: '#c5bfb0',      // 非アクティブ要素
  error: '#d67373',         // エラー（調整済み）
  warning: '#e5b76f',       // 警告（調整済み）
  success: '#9ea48d',       // 成功（アクセントカラーと同じ）
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;