import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  ViewToken,
  Modal,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { COLORS, FONT_SIZE, SPACING } from '../config/constants';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PAGES = 5;
const SPLASH_HOLD_MS = 1800; // スプラッシュアニメーション後の待機時間

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Splash animation controls
  const [blurLevel, setBlurLevel] = useState(15);
  const [splashComplete, setSplashComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [canTap, setCanTap] = useState(false);
  const grayOverlay = useRef(new Animated.Value(1)).current; // グレーオーバーレイ
  const logoOpacity = useRef(new Animated.Value(0)).current; // ロゴの不透明度
  const logoBlur = useRef(new Animated.Value(1)).current; // ロゴのブラー
  const contentOpacity = useRef(new Animated.Value(0)).current; // コンテンツの不透明度
  const tapHintOpacity = useRef(new Animated.Value(0)).current; // タップヒントの不透明度

  // スプラッシュアニメーション（初回のみ）
  useEffect(() => {
    if (currentIndex === 0 && !splashComplete) {
      // 1. ロゴをぼやけた状態でフェードイン
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // 2. 背景とロゴのピントを合わせる
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(grayOverlay, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(logoBlur, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();

        // ブラーレベルを徐々に減少
        let level = 15;
        const blurInterval = setInterval(() => {
          level = Math.max(0, level - 1.5);
          setBlurLevel(level);
          if (level === 0) {
            clearInterval(blurInterval);
            setSplashComplete(true);
            setCanTap(true);
            // タップヒントを表示
            setTimeout(() => {
              Animated.loop(
                Animated.sequence([
                  Animated.timing(tapHintOpacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                  Animated.timing(tapHintOpacity, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                ])
              ).start();
            }, 500);
          }
        }, 100);
      }, 800);
    }
  }, [currentIndex, splashComplete]);

  // タップハンドラー
  const handleSplashTap = () => {
    if (canTap && !showContent) {
      setShowContent(true);
      Animated.timing(tapHintOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  };

  const handleNext = () => {
    if (currentIndex < PAGES - 1) {
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

  // 画面1: スプラッシュ→コアバリュー提示
  const Page1 = () => (
    <TouchableOpacity
      style={{ width }}
      activeOpacity={1}
      onPress={handleSplashTap}
      disabled={!canTap}
    >
      <ImageBackground
        source={require('../../assets/images/room-after-nordic.jpg')}
        style={[styles.slideBg, { width }]}
        imageStyle={styles.bgImage}
        blurRadius={blurLevel}
        accessibilityLabel="おしゃれなリビングルーム"
      >
        <Animated.View style={[styles.grayOverlay, { opacity: grayOverlay }]} />
        <View style={styles.dimOverlay} />
        <View style={styles.centerContent}>
          {!showContent ? (
            <>
              <Animated.View
                style={{
                  opacity: logoOpacity,
                  transform: [{ scale: logoBlur }],
                }}
              >
                <Text style={styles.logoTextWhite}>nyoki</Text>
              </Animated.View>
              {splashComplete && (
                <Animated.Text
                  style={[
                    styles.tapHint,
                    { opacity: tapHintOpacity },
                  ]}
                >
                  タップして始める
                </Animated.Text>
              )}
            </>
          ) : (
            <Animated.View style={{ opacity: contentOpacity, alignItems: 'center' }}>
              <Text style={styles.h1White}>写真一枚で</Text>
              <Text style={styles.h2White}>理想の植物を見つけよう</Text>
              <Text style={[styles.subWhite, { marginTop: 8 }]}>部屋の写真から相性の良い植物をAIが提案</Text>
            </Animated.View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  // 画面2: かんたん3ステップ
  const Page2: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const stepOp = [
      useRef(new Animated.Value(0)).current,
      useRef(new Animated.Value(0)).current,
      useRef(new Animated.Value(0)).current,
    ];
    const stepTy = [
      useRef(new Animated.Value(20)).current,
      useRef(new Animated.Value(20)).current,
      useRef(new Animated.Value(20)).current,
    ];

    useEffect(() => {
      if (isActive) {
        const anims = [0, 1, 2].map((i) =>
          Animated.parallel([
            Animated.timing(stepOp[i], {
              toValue: 1,
              duration: 500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(stepTy[i], {
              toValue: 0,
              duration: 500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
        Animated.stagger(200, anims).start();
      } else {
        stepOp.forEach((v) => v.setValue(0));
        stepTy.forEach((v) => v.setValue(20));
      }
    }, [isActive]);

    return (
      <ScrollView
        style={{ width }}
        contentContainerStyle={[styles.slide, { paddingTop: 60 }]}
        accessibilityLabel="かんたん3ステップ"
      >
        <Text style={styles.stepHeader}>かんたん3ステップ</Text>

        <Animated.View
          style={[
            styles.stepRow,
            { opacity: stepOp[0], transform: [{ translateY: stepTy[0] }] },
          ]}
        >
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>部屋を撮影</Text>
            <Text style={styles.stepDesc}>スマホで簡単撮影</Text>
          </View>
          <View style={styles.stepIcon}>
            <Ionicons name="phone-portrait-outline" size={32} color={COLORS.primary} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.stepRow,
            { opacity: stepOp[1], transform: [{ translateY: stepTy[1] }] },
          ]}
        >
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>AIが植物を提案</Text>
            <Text style={styles.stepDesc}>環境に最適な植物を自動選定</Text>
          </View>
          <View style={styles.stepIcon}>
            <Ionicons name="bulb-outline" size={32} color={COLORS.primary} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.stepRow,
            { opacity: stepOp[2], transform: [{ translateY: stepTy[2] }] },
          ]}
        >
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>配置イメージを確認</Text>
            <Text style={styles.stepDesc}>Before/Afterで確認</Text>
          </View>
          <View style={styles.stepIcon}>
            <Ionicons name="swap-horizontal-outline" size={32} color={COLORS.primary} />
          </View>
        </Animated.View>

        <Animated.View
          style={{
            width: '100%',
            marginTop: 20,
            opacity: stepOp[2],
            transform: [{ translateY: stepTy[2] }],
          }}
        >
          <BeforeAfterSlider
            beforeImage={require('../../assets/images/room-before-nordic.jpeg')}
            afterImage={require('../../assets/images/room-after-nordic.jpg')}
            initialPercent={0.5}
            autoAnimate={{ from: 1, to: 0.2, duration: 2000, delay: 600 }}
            onInteractionStart={() => setScrollEnabled(false)}
            onInteractionEnd={() => setScrollEnabled(true)}
          />
        </Animated.View>
      </ScrollView>
    );
  };

  // 画面3: 購入リスト機能
  const Page3: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const addScale = useRef(new Animated.Value(1)).current;
    const [localPurchaseAdded, setLocalPurchaseAdded] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    
    // 自動でボタンを押すアニメーション（1回のみ）
    useEffect(() => {
      if (isActive && !hasAnimated) {
        const timer = setTimeout(() => {
          // ボタンを押す演出
          setLocalPurchaseAdded(true);
          Animated.sequence([
            Animated.timing(addScale, {
              toValue: 0.9,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.spring(addScale, {
              toValue: 1,
              friction: 3,
              useNativeDriver: true,
            }),
          ]).start();
          setHasAnimated(true);
        }, 1500); // 画面表示から1.5秒後に開始
        
        return () => clearTimeout(timer);
      } else if (!isActive) {
        // 画面から離れたらリセット
        setLocalPurchaseAdded(false);
        setHasAnimated(false);
      }
    }, [isActive, hasAnimated]);

    return (
      <View style={[styles.slide, { width, paddingTop: 60 }]} accessibilityLabel="購入リストで簡単管理">
        <Text style={styles.sectionHeader}>購入リストで簡単管理</Text>
        <Ionicons
          name="cart-outline"
          size={48}
          color={COLORS.primary}
          style={{ alignSelf: 'center', marginVertical: 12 }}
        />
        <Text style={[styles.sectionSub, { textAlign: 'center', marginBottom: 20 }]}>
          提案から気に入った植物や鉢を選んで追加
        </Text>

        <View style={styles.purchaseCard}>
          <Image
            source={require('../../assets/images/plants/plants_Monstera deliciosa .jpeg')}
            style={styles.purchaseThumb}
            accessibilityLabel="モンステラの写真"
          />
          <View style={styles.purchaseContent}>
            <View style={styles.purchaseHeader}>
              <View>
                <Text style={styles.purchaseTitle}>モンステラ</Text>
                <Text style={styles.purchaseSub}>脚付き白鉢セット</Text>
              </View>
              <Text style={styles.purchasePrice}>¥12,800</Text>
            </View>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Ionicons name="leaf-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.tagText}>育てやすい</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="paw-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.tagText}>ペットOK</Text>
              </View>
              <View style={styles.tag}>
                <Ionicons name="pricetag-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.tagText}>予算内</Text>
              </View>
            </View>
            <View
              style={[styles.addButton, localPurchaseAdded && styles.addButtonDone]}
              accessibilityLabel="購入リストに追加"
            >
              <Animated.View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  transform: [{ scale: addScale }],
                }}
              >
                <Ionicons
                  name={localPurchaseAdded ? 'checkmark' : 'add'}
                  size={18}
                  color={localPurchaseAdded ? COLORS.primary : COLORS.textOnPrimary}
                />
                <Text
                  style={[
                    styles.addButtonText,
                    localPurchaseAdded && { color: COLORS.primary },
                  ]}
                >
                  {localPurchaseAdded ? '追加済み' : '購入リストに追加'}
                </Text>
              </Animated.View>
            </View>
          </View>
        </View>
      </View>
    );
  };


  // 画面4: 購入後のサポート機能
  const Page4: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const checkScale = useRef(new Animated.Value(1)).current;
    const [localWaterDone, setLocalWaterDone] = useState(false);
    const [localChatOpen, setLocalChatOpen] = useState(false);
    const [hasWaterAnimated, setHasWaterAnimated] = useState(false);
    const [hasChatAnimated, setHasChatAnimated] = useState(false);
    
    // 自動アニメーション（1回のみ）
    useEffect(() => {
      if (isActive) {
        // 1. 水やりチェックボックスを自動でタップ
        if (!hasWaterAnimated) {
          const waterTimer = setTimeout(() => {
            setLocalWaterDone(true);
            Animated.sequence([
              Animated.timing(checkScale, {
                toValue: 1.3,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.spring(checkScale, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
              }),
            ]).start();
            setHasWaterAnimated(true);
          }, 1500);
        }
        
        // 2. AI相談モーダルを自動で開く
        if (!hasChatAnimated) {
          const chatTimer = setTimeout(() => {
            setLocalChatOpen(true);
            setScrollEnabled(false);
            setHasChatAnimated(true);
            
            // 3秒後に自動で閉じる
            setTimeout(() => {
              setLocalChatOpen(false);
              setScrollEnabled(true);
            }, 3000);
          }, 3500);
          
          return () => {
            clearTimeout(chatTimer);
          };
        }
      } else {
        // 画面から離れたらリセット
        setLocalWaterDone(false);
        setLocalChatOpen(false);
        setHasWaterAnimated(false);
        setHasChatAnimated(false);
      }
    }, [isActive, hasWaterAnimated, hasChatAnimated]);

    return (
      <ScrollView
        style={{ width }}
        contentContainerStyle={[styles.slide, { paddingTop: 60 }]}
        accessibilityLabel="購入後のケアも安心"
      >
        <Text style={styles.sectionHeader}>購入後のケアも安心</Text>
        <Text style={[styles.sectionSub, { textAlign: 'center', marginBottom: 20 }]}>
          水やり管理やAI相談でサポート
        </Text>

        <View style={styles.featureSection}>
          <Text style={styles.featureLabel}>機能1：水やり管理</Text>
          <View style={styles.careCard}>
            <Image
              source={require('../../assets/images/plants/plants_Monstera deliciosa .jpeg')}
              style={styles.careThumb}
              accessibilityLabel="モンステラのアイコン"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.careTitle}>モンステラ</Text>
              <View style={styles.taskRow}>
                <Ionicons
                  name="water-outline"
                  size={18}
                  color={COLORS.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.careSub}>水やり</Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <View style={[
                styles.checkbox,
                localWaterDone && styles.checkboxDone
              ]}>
                {localWaterDone && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={COLORS.textOnPrimary}
                  />
                )}
              </View>
            </Animated.View>
          </View>
        </View>

        <View style={[styles.featureSection, { marginTop: 24 }]}>
          <Text style={styles.featureLabel}>機能2：AI相談</Text>
          <Text style={[styles.sectionSub, { marginBottom: 12 }]}>
            植物の調子が気になったら
          </Text>
          <View
            style={styles.aiConsultButton}
            accessibilityLabel="AI相談"
          >
            <Text style={styles.aiConsultButtonText}>AI相談</Text>
          </View>
        </View>

        <Modal
          visible={localChatOpen}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setLocalChatOpen(false);
            setScrollEnabled(true);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>AI植物相談</Text>
                <TouchableOpacity
                  onPress={() => {
                    setLocalChatOpen(false);
                    setScrollEnabled(true);
                  }}
                >
                  <Ionicons name="close" size={24} color={COLORS.textOnBase} />
                </TouchableOpacity>
              </View>
              <View style={styles.chatSection}>
                <View style={styles.chatBubbleUser}>
                  <Text style={styles.chatTextUser}>葉が黄色くなってきました</Text>
                </View>
                <View style={styles.chatBubbleAI}>
                  <Text style={styles.chatTextAI}>
                    土の乾き具合を3-4cm深さで確認してみてください。水のやりすぎの可能性があります。次回の水やりは土が乾いてからにしましょう。
                  </Text>
                </View>
              </View>
              <View style={styles.quickTipsSection}>
                <Text style={styles.quickTipsTitle}>クイックヒント</Text>
                <View style={styles.quickTips}>
                  {['水やり頻度：週1-2回', '置き場所：明るい日陰', '冬の管理：水やり控えめ'].map((t) => (
                    <View key={t} style={styles.tip}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                      <Text style={styles.tipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  };

  // 画面5: 行動喚起 (Call to Action)
  const Page5 = () => (
    <ImageBackground
      source={require('../../assets/images/room-after-nordic.jpg')}
      style={[styles.slideBg, { width }]}
      imageStyle={styles.bgImage}
      accessibilityLabel="おしゃれなリビングルーム"
    >
      <View style={styles.dimOverlay} />
      <View style={[styles.centerContent, { width: '100%' }]}>
        <Text style={styles.h1White}>写真一枚で</Text>
        <Text style={styles.h2White}>理想の植物を見つけよう</Text>
        <View style={{ marginTop: 32, width: '75%' }}>
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={completeOnboarding}
            accessibilityLabel="始める"
          >
            <Text style={styles.primaryCtaText}>始める</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryCta, { marginTop: 12 }]}
            onPress={completeOnboarding}
            accessibilityLabel="ログイン"
          >
            <Text style={styles.secondaryCtaText}>ログイン</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );

  const renderPage = ({ index }: { index: number }) => {
    switch (index) {
      case 0:
        return <Page1 />;
      case 1:
        return <Page2 isActive={currentIndex === 1} />;
      case 2:
        return <Page3 isActive={currentIndex === 2} />;
      case 3:
        return <Page4 isActive={currentIndex === 3} />;
      case 4:
        return <Page5 />;
      default:
        return <View />;
    }
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
      <StatusBar style="light" />
      {/* 右上のスキップボタン */}
      {currentIndex > 0 && (
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipTop}
          accessibilityLabel="スキップ"
        >
          <Text style={styles.skipTopText}>スキップ</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={Array.from({ length: PAGES })}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, i) => String(i)}
      />

      {/* 下部のページネーション */}
      <View style={styles.pagination}>
        <View style={styles.dots}>
          {Array.from({ length: PAGES }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.base,
  },
  slideBg: {
    flex: 1,
    justifyContent: 'center',
  },
  bgImage: {},
  grayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#d0d0d0',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    marginHorizontal: 32,
  },
  logoTextWhite: {
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  h1White: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 8,
  },
  h2White: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subWhite: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
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
  stepHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: 24,
    textAlign: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textOnPrimary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textOnBase,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  stepIcon: {
    marginLeft: 12,
  },
  pagination: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  skipTop: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipTopText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
    width: 24,
  },
  // 購入リストカード
  purchaseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  purchaseThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'center',
  },
  purchaseContent: {
    width: '100%',
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  purchaseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  purchaseSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  purchasePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDone: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  addButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textOnPrimary,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // ケア機能
  featureSection: {
    width: '100%',
    marginBottom: 16,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textOnBase,
    marginBottom: 12,
  },
  careCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  careThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  careTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: 2,
  },
  careSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  aiConsultButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'center',
  },
  aiConsultButtonText: {
    color: COLORS.textOnAccent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // モーダル（AI相談）
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    maxHeight: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  chatSection: {
    marginBottom: 20,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent,
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    marginBottom: 12,
    maxWidth: '80%',
  },
  chatTextUser: {
    color: COLORS.textOnAccent,
    fontSize: 15,
  },
  chatBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '85%',
  },
  chatTextAI: {
    color: COLORS.textOnBase,
    fontSize: 15,
    lineHeight: 22,
  },
  quickTipsSection: {
    marginTop: 16,
  },
  quickTipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textOnBase,
    marginBottom: 12,
  },
  quickTips: {
    gap: 8,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  tapHint: {
    position: 'absolute',
    bottom: -60,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // CTAボタン
  primaryCta: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryCta: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    color: COLORS.textOnBase,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
