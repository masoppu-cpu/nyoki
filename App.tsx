import React, { useEffect } from 'react';
import { StyleSheet, AppState } from 'react-native';
import { initMonitoring, track } from './src/lib/monitoring';
import { COLORS } from './src/config/constants';
import { AppProvider } from './src/contexts/AppContext';
import { supabase } from './src/lib/supabase';
import { RootNavigator } from './src/navigation/RootNavigator';
// カメラテスト用のインポート（テスト時のみ有効化）
import TestApp from './TestApp';

export default function App() {
  // カメラテストモード（テスト時はtrueに設定）
  const CAMERA_TEST_MODE = false;

  useEffect(() => {
    initMonitoring();
    track('app_start');
    
    // アプリの状態変更監視（トークンリフレッシュ）
    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      appStateListener?.remove();
    };
  }, []);

  // カメラテストモードの場合
  if (CAMERA_TEST_MODE) {
    return <TestApp />;
  }

  // AppProviderでアプリ全体をラップして、RootNavigatorを使用
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: COLORS.base,
  },
});
