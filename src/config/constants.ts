export const APP_CONFIG = {
  name: 'nyoki',
  version: '1.0.0',
  description: 'AI-powered plant placement app',
} as const;

export const SUBSCRIPTION = {
  MAX_FREE_PLANTS: Number(process.env.EXPO_PUBLIC_MAX_FREE_PLANTS) || 5,
  MAX_FREE_AI_ANALYSIS: Number(process.env.EXPO_PUBLIC_MAX_FREE_AI_ANALYSIS) || 5,
  MAX_FREE_AI_CONSULTATION: Number(process.env.EXPO_PUBLIC_MAX_FREE_AI_CONSULTATION) || 10,
  MONTHLY_PRICE: Number(process.env.EXPO_PUBLIC_SUBSCRIPTION_PRICE) || 480,
  CURRENCY: 'JPY',
} as const;

export const COLORS = {
  primary: '#48BB78',
  secondary: '#4299E1',
  background: '#FFFFFF',
  surface: '#F7FAFC',
  text: '#2D3748',
  textSecondary: '#718096',
  border: '#E2E8F0',
  inactive: '#CBD5E0',
  error: '#FC8181',
  warning: '#F6E05E',
  success: '#48BB78',
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