/**
 * Supabaseクライアント設定
 * 本番実装用
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// 環境変数から取得
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not Set');
  console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not Set');
}

// Supabaseクライアントを作成
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // React Nativeでは必須
  },
});

// デバッグ用のヘルパー
export const debugSupabase = () => {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not Set');
};