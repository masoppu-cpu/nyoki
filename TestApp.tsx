import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CameraScreen from './src/screens/CameraScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import { COLORS } from './src/config/constants';

export default function TestApp() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'camera' | 'analysis'>('camera');
  // Force reload

  const handleImageCaptured = (imageUri: string) => {
    setCapturedImage(imageUri);
    setCurrentScreen('analysis');
    Alert.alert('画像を取得しました', 'AI分析画面に遷移します');
  };

  const handleBack = () => {
    setCapturedImage(null);
    setCurrentScreen('camera');
  };

  const handleAnalysisComplete = () => {
    Alert.alert('分析完了', '分析が完了しました！', [
      { text: 'カメラに戻る', onPress: handleBack }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {currentScreen === 'camera' ? (
        <CameraScreen 
          onImageCaptured={handleImageCaptured}
          onBack={() => Alert.alert('戻る', 'ホーム画面に戻ります')}
        />
      ) : (
        <AnalysisScreen 
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.base,
  },
});