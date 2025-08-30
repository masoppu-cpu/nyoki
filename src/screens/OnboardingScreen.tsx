import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  ViewToken,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { COLORS, FONT_SIZE, SPACING } from '../config/constants';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
  backgroundColor: string;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'お部屋を撮影',
    description: 'スマホでお部屋を撮影するだけ',
    image: require('../../assets/images/room-before.jpg'),
    backgroundColor: COLORS.surface,
  },
  {
    id: '2',
    title: 'AIが環境を分析',
    description: '光量・温度・湿度を自動で判定',
    image: require('../../assets/images/camera-interface.jpg'),
    backgroundColor: COLORS.surface,
  },
  {
    id: '3',
    title: '最適な植物をご提案',
    description: 'あなたの部屋にぴったりの植物を',
    image: require('../../assets/images/plants-collection.jpg'),
    backgroundColor: COLORS.surface,
  },
  {
    id: '4',
    title: '配置をプレビュー',
    description: '購入前に部屋での見た目を確認',
    image: require('../../assets/images/room-after.jpg'),
    backgroundColor: COLORS.surface,
  },
  {
    id: '5',
    title: '無料で始められます',
    description: '5つまでの植物を無料で管理\nもっと楽しみたい方は月額480円',
    image: require('../../assets/images/hero-room.jpg'),
    backgroundColor: COLORS.surface,
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width, backgroundColor: item.backgroundColor }]}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>スキップ</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextText}>
            {currentIndex === onboardingSlides.length - 1 ? '始める' : '次へ'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.base,
  }
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    color: COLORS.textOnBase,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.background,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  nextText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});

export default OnboardingScreen;