import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initMonitoring, track } from './src/lib/monitoring';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import MainScreen from './src/screens/MainScreen';
import { COLORS } from './src/config/constants';
import { AppProvider } from './src/contexts/AppContext';
// カメラテスト用のインポート（テスト時のみ有効化）
import TestApp from './TestApp';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  // カメラテストモード（テスト時はtrueに設定）
  const CAMERA_TEST_MODE = false;

  useEffect(() => {
    initMonitoring();
    track('app_start');
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setShowOnboarding(hasSeenOnboarding !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(false);
    }
  };

  // カメラテストモードの場合
  if (CAMERA_TEST_MODE) {
    return <TestApp />;
  }

  // ローディング中の表示
  if (showOnboarding === null) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // AppProviderでアプリ全体をラップ
  return (
    <AppProvider>
      {showOnboarding ? (
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      ) : (
        <MainScreen />
      )}
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
