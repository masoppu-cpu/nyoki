# チケット #05: オンボーディング画面

**タスクID**: FE-002  
**担当**: Frontend  
**推定時間**: 4時間  
**依存関係**: [COMMON-002: 型定義]  
**優先度**: 高（Phase 1）

## 概要
初回起動時のオンボーディング画面を実装。アプリの使い方と価値を伝える。

## TODO リスト

- [ ] オンボーディング画面コンポーネント作成
- [ ] スライド式UI実装
- [ ] スキップ機能
- [ ] 初回起動判定ロジック
- [ ] AsyncStorageで表示済みフラグ管理
- [ ] アニメーション実装
- [ ] フリーミアムモデルの案内追加
- [ ] Expo Goでの動作確認

## 画面構成

### スライド内容
```typescript
const onboardingSlides = [
  {
    id: '1',
    title: 'お部屋を撮影',
    description: 'スマホでお部屋を撮影するだけ',
    image: require('../assets/images/onboarding-1.png'),
    backgroundColor: '#E8F5E9'
  },
  {
    id: '2',
    title: 'AIが環境を分析',
    description: '光量・温度・湿度を自動で判定',
    image: require('../assets/images/onboarding-2.png'),
    backgroundColor: '#F3E5F5'
  },
  {
    id: '3',
    title: '最適な植物をご提案',
    description: 'あなたの部屋にぴったりの植物を',
    image: require('../assets/images/onboarding-3.png'),
    backgroundColor: '#E3F2FD'
  },
  {
    id: '4',
    title: '配置をプレビュー',
    description: '購入前に部屋での見た目を確認',
    image: require('../assets/images/onboarding-4.png'),
    backgroundColor: '#FFF3E0'
  },
  {
    id: '5',
    title: '無料で始められます',
    description: '5つまでの植物を無料で管理\nもっと楽しみたい方は月額480円',
    image: require('../assets/images/onboarding-5.png'),
    backgroundColor: '#E8F5E9'
  }
];
```

## コンポーネント実装

### OnboardingScreen.tsx
```typescript
// TODO: src/screens/OnboardingScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export const OnboardingScreen = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
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

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>スキップ</Text>
        </TouchableOpacity>
        
        <View style={styles.dots}>
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot
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
```

## 初回起動判定

### App.tsx での判定
```typescript
// TODO: App.tsx に追加
const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

useEffect(() => {
  checkOnboarding();
}, []);

const checkOnboarding = async () => {
  const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
  setShowOnboarding(hasSeenOnboarding !== 'true');
};

if (showOnboarding === null) {
  return <LoadingScreen />;
}

if (showOnboarding) {
  return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
}

return <MainApp />;
```

## アニメーション

### スライド切り替えアニメーション
```typescript
import { Animated } from 'react-native';

// フェードイン・スケールアニメーション
const animatedValue = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(animatedValue, {
    toValue: 1,
    duration: 500,
    useNativeDriver: true
  }).start();
}, [currentIndex]);
```

## スタイル

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 40
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2D3748'
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#718096'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20
  },
  dots: {
    flexDirection: 'row'
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E0',
    marginHorizontal: 4
  },
  activeDot: {
    backgroundColor: '#48BB78',
    width: 20
  },
  nextButton: {
    backgroundColor: '#48BB78',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  skipText: {
    color: '#718096'
  }
});
```

## Expo Goでの動作確認手順

```bash
# 1. 開発サーバー起動
npm start

# 2. Expo Goアプリでスキャン
# iOS: カメラアプリでQRコード読み取り
# Android: Expo GoアプリでQRコードスキャン

# 3. 確認項目
- [ ] オンボーディング画面が表示される
- [ ] スワイプで画面遷移できる
- [ ] スキップボタンが動作する
- [ ] 完了後、ホーム画面に遷移する
- [ ] 2回目起動時はオンボーディングが表示されない
```

## 完了条件
- [ ] 5枚のスライド実装（フリーミアム案内含む）
- [ ] スワイプ操作対応
- [ ] ドットインジケーター実装
- [ ] スキップ・次へボタン実装
- [ ] 初回起動判定実装
- [ ] アニメーション実装
- [ ] Expo Goでの動作確認完了

## 備考
- 画像アセットは後で追加
- アクセシビリティ対応も考慮
- 国際化対応の準備

## 関連ファイル
- `src/screens/OnboardingScreen.tsx` - オンボーディング画面（要作成）
- `assets/images/onboarding-*.png` - オンボーディング画像（要作成）

最終更新: 2025-08-28