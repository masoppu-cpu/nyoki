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
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { COLORS, FONT_SIZE, SPACING } from '../config/constants';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import PlantInfoCard from '../components/PlantInfoCard';
import CareTaskCard from '../components/CareTaskCard';
import PlantCareCard from '../components/PlantCareCard';
import AIChatModal from '../components/AIChatModal';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  type: 'splash' | 'tagline' | 'steps' | 'purchase' | 'care' | 'cta';
  content?: any;
}

const onboardingSlides: OnboardingSlide[] = [
  { id: '1', type: 'splash' },
  { id: '2', type: 'tagline' },
  { id: '3', type: 'steps' },
  { id: '4', type: 'purchase' },
  { id: '5', type: 'care' },
  { id: '6', type: 'cta' },
];

interface OnboardingScreenV2Props {
  onComplete: () => void;
}

export const OnboardingScreenV2: React.FC<OnboardingScreenV2Props> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (currentIndex === 0) {
      autoScrollTimer.current = setTimeout(() => {
        handleNext();
      }, 1000);
    }
    return () => {
      if (autoScrollTimer.current) {
        clearTimeout(autoScrollTimer.current);
      }
    };
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  const renderSplashScreen = () => (
    <ImageBackground
      source={require('../../assets/images/room-after-nordic.jpg')}
      style={styles.fullScreenBg}
      resizeMode="cover"
    >
      <View style={styles.splashContent}>
        <Text style={styles.splashTitle}>nyoki</Text>
      </View>
    </ImageBackground>
  );

  const renderTaglineScreen = () => (
    <ImageBackground
      source={require('../../assets/images/room-after-nordic.jpg')}
      style={styles.fullScreenBg}
      resizeMode="cover"
    >
      <View style={styles.taglineContent}>
        <Text style={styles.taglineTitle}>
          写真一枚で{'\n'}理想の植物見つけよう
        </Text>
        <Text style={styles.taglineSubtitle}>
          部屋の写真から相性の良い植物をAIが提案
        </Text>
      </View>
    </ImageBackground>
  );

  const renderStepsScreen = () => (
    <View style={styles.stepsContainer}>
      <View style={styles.stepsHeader}>
        <Text style={styles.stepsTitle}>かんたん3ステップ</Text>
      </View>
      
      <View style={styles.stepsList}>
        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>部屋を撮影</Text>
        </View>
        
        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>AIが植物を提案</Text>
        </View>
        
        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>配置イメージを確認</Text>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <BeforeAfterSlider
          beforeImage={require('../../assets/images/room-before.jpg')}
          afterImage={require('../../assets/images/room-after-nordic.jpg')}
          initialPosition={50}
        />
        <Text style={styles.sliderHint}>左右に動かして変化を確認</Text>
      </View>
    </View>
  );

  const renderPurchaseScreen = () => (
    <View style={styles.purchaseContainer}>
      <Text style={styles.sectionTitle}>購入検討リストで比較</Text>
      <Text style={styles.sectionSubtitle}>
        気になる植物を簡単に比較・管理
      </Text>
      
      <PlantInfoCard
        plant={{
          id: '1',
          name: 'サンスベリア',
          subtitle: '脚付きプランターセット',
          price: '¥5,980〜',
          thumbnail: require('../../assets/images/plants-collection.jpg'),
          difficulty: 'easy',
          petSafe: true,
          priceRange: '¥5,000〜',
        }}
        onAddToList={() => {}}
      />
      
      <View style={styles.purchaseFeatures}>
        <Text style={styles.featureText}>✓ 育てやすさが一目でわかる</Text>
        <Text style={styles.featureText}>✓ ペット対応を簡単確認</Text>
        <Text style={styles.featureText}>✓ 価格帯で比較可能</Text>
      </View>
    </View>
  );

  const renderCareScreen = () => (
    <View style={styles.careContainer}>
      <Text style={styles.sectionTitle}>毎日のケアも簡単管理</Text>
      <Text style={styles.sectionSubtitle}>
        水やりタスクとAI相談で安心
      </Text>
      
      <View style={styles.careContent}>
        <CareTaskCard
          task={{
            id: '1',
            title: '水やり',
            time: '30分',
            category: 'water',
            completed: false,
          }}
          onToggle={() => {}}
        />
        
        <PlantCareCard
          plant={{
            id: '1',
            name: 'モンステラ',
            subtitle: '明るい日陰OK・週1目安',
            thumbnail: require('../../assets/images/plants-collection.jpg'),
          }}
          onAIChat={() => setShowAIChat(true)}
        />
      </View>
      
      <AIChatModal
        visible={showAIChat}
        onClose={() => setShowAIChat(false)}
        plantName="モンステラ"
      />
    </View>
  );

  const renderCTAScreen = () => (
    <ImageBackground
      source={require('../../assets/images/room-after-nordic.jpg')}
      style={styles.fullScreenBg}
      resizeMode="cover"
    >
      <View style={styles.ctaContent}>
        <Text style={styles.ctaTitle}>
          写真一枚で{'\n'}理想の植物見つけよう
        </Text>
        
        <View style={styles.ctaButtons}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>始める</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.loginButton} onPress={handleStart}>
            <Text style={styles.loginButtonText}>ログイン</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    const slideContent = () => {
      switch (item.type) {
        case 'splash':
          return renderSplashScreen();
        case 'tagline':
          return renderTaglineScreen();
        case 'steps':
          return renderStepsScreen();
        case 'purchase':
          return renderPurchaseScreen();
        case 'care':
          return renderCareScreen();
        case 'cta':
          return renderCTAScreen();
        default:
          return null;
      }
    };

    return (
      <View style={[styles.slide, { width }]}>
        {slideContent()}
      </View>
    );
  };

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
      
      {currentIndex > 0 && currentIndex < 6 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>スキップ</Text>
        </TouchableOpacity>
      )}
      
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
        scrollEnabled={currentIndex !== 3}
      />

      {currentIndex > 0 && currentIndex < 6 && (
        <View style={styles.footer}>
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
          
          {currentIndex > 1 && currentIndex < 5 && (
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextText}>次へ</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.base,
  },
  slide: {
    flex: 1,
  },
  fullScreenBg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 100,
    padding: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  skipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textOnBase,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.base,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  taglineContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  taglineTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.base,
    textAlign: 'center',
    marginBottom: SPACING.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  taglineSubtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.base,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  stepsContainer: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: COLORS.base,
  },
  stepsHeader: {
    marginBottom: SPACING.lg,
  },
  stepsTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    textAlign: 'center',
  },
  stepsList: {
    marginBottom: SPACING.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    color: COLORS.textOnPrimary,
    fontWeight: 'bold',
    fontSize: FONT_SIZE.md,
  },
  stepText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textOnBase,
  },
  sliderContainer: {
    flex: 1,
    marginBottom: 80,
  },
  sliderHint: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  purchaseContainer: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: COLORS.base,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  purchaseFeatures: {
    marginTop: SPACING.xl,
  },
  featureText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnBase,
    marginBottom: SPACING.sm,
  },
  careContainer: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: COLORS.base,
  },
  careContent: {
    flex: 1,
    gap: SPACING.md,
  },
  ctaContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.base,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  ctaButtons: {
    width: '100%',
    gap: SPACING.md,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  nextText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});

export default OnboardingScreenV2;