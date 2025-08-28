# チケット #16: 認証機能統合

**タスクID**: INT-001  
**担当**: Full-stack  
**推定時間**: 4時間  
**依存関係**: [BE-001: Supabase設定, FE-006: 状態管理]  
**優先度**: 高（Phase 2）

## 概要
Supabase Authを使用した認証機能の実装。サインアップ、サインイン、セッション管理を統合。

## TODO リスト

- [ ] Supabaseクライアント設定
- [ ] 認証画面UI実装
- [ ] サインアップ機能
- [ ] サインイン機能
- [ ] パスワードリセット機能
- [ ] セッション管理
- [ ] 自動ログイン
- [ ] ソーシャルログイン準備

## Supabaseクライアント設定

### lib/supabase.ts
```typescript
// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

## 認証サービス実装

### AuthService
```typescript
// src/services/authService.ts
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

export class AuthService {
  // サインアップ
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

  // サインイン
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

  // サインアウト
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

  // パスワードリセット
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

  // プロファイル取得
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

  // プロファイル更新
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

  // エラーメッセージ変換
  private getErrorMessage(message: string): string {
    const errorMessages: { [key: string]: string } = {
      'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
      'Email not confirmed': 'メールアドレスの確認が必要です',
      'User already registered': 'このメールアドレスは既に登録されています',
      'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
    };

    return errorMessages[message] || 'エラーが発生しました';
  }
}

export const authService = new AuthService();
```

## 認証画面実装

### SignInScreen
```typescript
// src/screens/auth/SignInScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { authService } from '../../services/authService';
import { useAppContext } from '../../contexts/AppContext';

export const SignInScreen = ({ navigation }) => {
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await authService.signIn(email, password);

    if (result.success) {
      dispatch({ 
        type: 'SET_USER', 
        payload: {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.profile?.name,
          isPremium: result.data.profile?.is_premium,
        } 
      });
      navigation.navigate('Home');
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>ログイン</Text>
        <Text style={styles.subtitle}>nyokiへようこそ</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>ログイン</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>
              パスワードをお忘れの方
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>アカウントをお持ちでない方</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signUpLink}>新規登録</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
```

## セッション管理

### App.tsxでのセッション管理
```typescript
// App.tsx に追加
import { AppState } from 'react-native';
import { supabase } from './src/lib/supabase';

export default function App() {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    // セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // セッション変更監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // アプリの状態変更監視（トークンリフレッシュ）
    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
      appStateListener?.remove();
    };
  }, []);

  return (
    <AppProvider>
      <NavigationContainer>
        {session ? <AuthenticatedApp /> : <UnauthenticatedApp />}
      </NavigationContainer>
    </AppProvider>
  );
}
```

## バリデーション

### 入力バリデーション
```typescript
// src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'パスワードは6文字以上で入力してください';
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'パスワードに英字を含めてください';
  }
  if (!/[0-9]/.test(password)) {
    return 'パスワードに数字を含めてください';
  }
  return null;
};
```

## 完了条件
- [ ] Supabaseクライアント設定完了
- [ ] サインアップ機能実装
- [ ] サインイン機能実装
- [ ] パスワードリセット機能実装
- [ ] セッション管理実装
- [ ] 入力バリデーション実装

## 備考
- メール確認は本番環境で有効化
- ソーシャルログインはPhase 3で実装
- セキュリティを最優先

## 関連ファイル
- `src/lib/supabase.ts` - Supabaseクライアント（要作成）
- `src/services/authService.ts` - 認証サービス（要作成）
- `src/screens/auth/SignInScreen.tsx` - サインイン画面（要作成）
- `src/screens/auth/SignUpScreen.tsx` - サインアップ画面（要作成）

最終更新: 2025-08-28

## Auto-PR（Claude用）

目的:
- 認証（Supabase Auth）統合の最小実装を追加しPR作成

ブランチ:
- feat/<TICKET-ID>-auth

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] サインアップ/サインイン/サインアウト
- [ ] セッション永続化

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-auth
git add -A && git commit -m "[<TICKET-ID}] integrate supabase auth"
git push -u origin feat/<TICKET-ID>-auth
gh pr create --fill --base main --head feat/<TICKET-ID>-auth
```
