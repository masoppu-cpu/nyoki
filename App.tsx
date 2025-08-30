import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initMonitoring, track } from './src/lib/monitoring';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { COLORS } from './src/config/constants';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    initMonitoring();
    track('app_start');
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      // デバッグ: AsyncStorageをクリアしてオンボーディングを強制表示
      await AsyncStorage.removeItem('hasSeenOnboarding');
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setShowOnboarding(hasSeenOnboarding !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // エラー時もオンボーディングを表示
    }
  };

  // ローディング中の表示
  if (showOnboarding === null) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // オンボーディング画面を表示
  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  // メインアプリを表示
  return (
    <View style={styles.container}>
      <Text style={styles.title}>nyoki - Plant Placement App</Text>
      <Text style={styles.subtitle}>AI-powered room visualization for plant lovers</Text>
      <StatusBar style="auto" />
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
