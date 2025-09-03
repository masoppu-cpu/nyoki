import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING } from '../config/constants';

interface AnalysisScreenProps {
  onAnalysisComplete: () => void;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ onAnalysisComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('お部屋を分析中...');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // 優しくフェードイン/アウトするアニメーション
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onAnalysisComplete(), 500);
          return 100;
        }
        return prev + 6.67;
      });
    }, 1000);

    setTimeout(() => setStatusText('光量を測定中...'), 3000);
    setTimeout(() => setStatusText('最適な植物を選定中...'), 6000);
    setTimeout(() => setStatusText('配置パターンを作成中...'), 9000);
    setTimeout(() => setStatusText('レイアウトを最適化中...'), 12000);

    return () => clearInterval(interval);
  }, [onAnalysisComplete, fadeAnim, scaleAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);


  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Ionicons name="leaf-outline" size={56} color={COLORS.primary} />
          </Animated.View>
        </View>

        <Text style={styles.title}>AI分析中</Text>
        <Text style={styles.statusText}>{statusText}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipTitle}>豆知識</Text>
          <Text style={styles.tipText}>
            観葉植物は空気を浄化し、{'\n'}
            ストレスを軽減する効果があります
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  animationContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  progressContainer: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tips: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    width: '100%',
  },
  tipTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AnalysisScreen;