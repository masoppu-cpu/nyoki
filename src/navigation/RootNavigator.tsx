/**
 * ルートナビゲーター
 * 認証状態に応じて適切な画面を表示
 */
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import MainScreen from '../screens/MainScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../contexts/AppContext';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config/constants';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // オンボーディングの状態確認
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setShowOnboarding(hasSeenOnboarding !== 'true');

      // セッション確認
      const currentSession = await authService.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        
        // プロファイル取得してユーザー情報をセット
        const profile = await authService.getProfile(currentSession.user.id);
        
        dispatch({
          type: 'SET_USER',
          payload: {
            id: currentSession.user.id,
            email: currentSession.user.email,
            name: profile?.name || '',
            isPremium: profile?.is_premium || false,
          },
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // セッション変更の監視
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session) {
          // ログイン時の処理
          const profile = await authService.getProfile(session.user.id);
          dispatch({
            type: 'SET_USER',
            payload: {
              id: session.user.id,
              email: session.user.email,
              name: profile?.name || '',
              isPremium: profile?.is_premium || false,
            },
          });
        } else {
          // ログアウト時の処理
          dispatch({ type: 'LOGOUT' });
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [dispatch]);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // オンボーディング表示
  if (showOnboarding && !session) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          // 認証済みユーザー
          <Stack.Screen name="MainTabs" component={MainScreen} />
        ) : (
          // 未認証ユーザー
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
});