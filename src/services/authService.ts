/**
 * 認証サービス
 * Supabase Authを使用した認証機能
 */
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  /**
   * サインアップ
   */
  async signUp(email: string, password: string, name?: string) {
    try {
      // 1. Supabase Auth でユーザー作成
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
          },
        },
      });

      if (error) throw error;

      // 2. プロファイル作成は自動（トリガー使用）
      
      return { success: true, data };
    } catch (error: any) {
      console.error('サインアップエラー:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.message) 
      };
    }
  }

  /**
   * サインイン
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // プロファイル取得
      const profile = await this.getProfile(data.user.id);
      
      return { success: true, data: { ...data, profile } };
    } catch (error: any) {
      console.error('サインインエラー:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.message) 
      };
    }
  }

  /**
   * サインアウト
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // ローカルストレージクリア
      await AsyncStorage.multiRemove([
        'purchase_list',
        'userPlants',
        'user',
      ]);
      
      return { success: true };
    } catch (error: any) {
      console.error('サインアウトエラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * パスワードリセット
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'nyoki://reset-password',
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('パスワードリセットエラー:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.message) 
      };
    }
  }

  /**
   * プロファイル取得
   */
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('プロファイル取得エラー:', error);
      return null;
    }
  }

  /**
   * プロファイル更新
   */
  async updateProfile(userId: string, updates: any) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('プロファイル更新エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 現在のセッション取得
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('セッション取得エラー:', error);
      return null;
    }
  }

  /**
   * メール確認再送
   */
  async resendConfirmationEmail(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('確認メール再送エラー:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.message) 
      };
    }
  }

  /**
   * エラーメッセージ変換
   */
  private getErrorMessage(message: string): string {
    const errorMessages: { [key: string]: string } = {
      'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
      'Email not confirmed': 'メールアドレスの確認が必要です。確認メールをご確認ください',
      'User already registered': 'このメールアドレスは既に登録されています',
      'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
      'Email rate limit exceeded': '短時間に多くのリクエストがありました。しばらくお待ちください',
      'User not found': 'ユーザーが見つかりません',
    };

    return errorMessages[message] || 'エラーが発生しました。しばらくしてからお試しください';
  }
}

export const authService = new AuthService();