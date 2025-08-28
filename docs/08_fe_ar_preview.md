# チケット #08: 配置プレビュー画面（2D合成）

**タスクID**: FE-005  
**担当**: Frontend  
**推定時間**: 6時間  
**依存関係**: [FE-001: モックAPI, FE-003: カメラ画面]  
**優先度**: 高（Phase 1）

## 概要
AIが生成した「配置後イメージ（2D合成）」を表示。Before/After比較機能を実装。
注: 本MVPはARKit/ARCoreを用いたリアルタイムARではなく、画像合成ベースのプレビュー。

## TODO リスト

- [x] BeforeAfterSlider基本実装（作成済み）
- [ ] 配置画像生成リクエスト処理
- [ ] 配置スタイル選択UI
- [ ] 画像保存機能
- [ ] SNSシェア機能
- [ ] ローディング画面
- [ ] フリーミアム制限（月5回まで）
- [ ] 水やりリマインダー機能

## 実装済み内容

### BeforeAfterSlider（基本実装済み）
```typescript
// ✅ src/components/BeforeAfterSlider.tsx 作成済み
// スライダーでBefore/After比較可能
```

## 追加実装内容

### フリーミアム制限の実装
```typescript
// フリーミアム制限チェック
const checkFreemiumLimit = async () => {
  const userPlan = await getUserPlan(); // AsyncStorageから取得
  const monthlyUsage = await getMonthlyARUsage();
  
  if (userPlan === 'free' && monthlyUsage >= 5) {
    Alert.alert(
      '無料プランの制限',
      '今月のAI画像生成回数（5回）に達しました。\nプレミアムプラン（月額480円）で無制限にお使いいただけます。',
      [
        { text: '今はやめる', style: 'cancel' },
        { text: 'プレミアムにアップグレード', onPress: () => navigateToUpgrade() }
      ]
    );
    return false;
  }
  return true;
};
```

### 水やりリマインダー表示
```typescript
// 植物選択後の水やり情報表示
const WateringInfo = ({ plants }) => (
  <View style={styles.wateringInfo}>
    <Text style={styles.wateringTitle}>💧 水やりスケジュール</Text>
    {plants.map(plant => (
      <View key={plant.id} style={styles.wateringItem}>
        <Text style={styles.plantName}>{plant.name}</Text>
        <Text style={styles.wateringSchedule}>
          {plant.water} （{getNextWateringDay(plant)}）
        </Text>
      </View>
    ))}
    <Text style={styles.wateringNote}>
      ※ 購入後、My Plants画面でリマインダーを設定できます
    </Text>
  </View>
);

const getNextWateringDay = (plant) => {
  const frequency = plant.water;
  if (frequency.includes('週')) {
    const times = parseInt(frequency);
    return `次回: ${Math.floor(7 / times)}日後`;
  } else if (frequency.includes('月')) {
    const times = parseInt(frequency);
    return `次回: ${Math.floor(30 / times)}日後`;
  }
  return '詳細は説明書を参照';
};
```

### My Plants画面での植物数制限
```typescript
// 植物数チェック
const checkPlantLimit = async () => {
  const userPlan = await getUserPlan();
  const myPlants = await getMyPlants();
  
  if (userPlan === 'free' && myPlants.length >= 5) {
    Alert.alert(
      '無料プランの制限',
      '無料プランでは5つまでの植物を管理できます。\nもっと多くの植物を管理するにはプレミアムプランにアップグレードしてください。',
      [
        { text: 'OK', style: 'cancel' },
        { text: 'アップグレード', onPress: () => navigateToUpgrade() }
      ]
    );
    return false;
  }
  return true;
};

// My Plants画面のヘッダーに表示
const PlanStatus = ({ userPlan, plantCount }) => (
  <View style={styles.planStatus}>
    <Text style={styles.planText}>
      {userPlan === 'free' ? '無料プラン' : 'プレミアム'}
    </Text>
    {userPlan === 'free' && (
      <Text style={styles.limitText}>
        植物: {plantCount}/5
      </Text>
    )}
  </View>
);
```

### 配置プレビュー画面
```typescript
// src/screens/ARPreviewScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
  StyleSheet
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { aiService } from '../services/ai';

interface ARPreviewScreenProps {
  roomImage: string;
  selectedPlants: Plant[];
  onConfirm: () => void;
  onBack: () => void;
}

export const ARPreviewScreen: React.FC<ARPreviewScreenProps> = ({
  roomImage,
  selectedPlants,
  onConfirm,
  onBack
}) => {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'natural' | 'modern' | 'minimal'>('natural');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateARImage();
  }, [selectedStyle]);

  const generateARImage = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // AI画像生成（モックまたは実API）
      const result = await aiService.generateARImage({
        roomImage,
        plants: selectedPlants,
        style: selectedStyle,
        placementGuide: getPlacementGuide(selectedStyle)
      });
      
      setGeneratedImage(result.imageUrl);
    } catch (err) {
      setError('画像生成に失敗しました。もう一度お試しください。');
      console.error('配置画像生成エラー:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getPlacementGuide = (style: string) => {
    switch (style) {
      case 'natural':
        return 'ナチュラルで温かみのある配置。植物を部屋の雰囲気に自然に溶け込ませる。';
      case 'modern':
        return 'モダンでスタイリッシュな配置。シンメトリーとミニマルさを重視。';
      case 'minimal':
        return 'ミニマルで洗練された配置。少数の植物で最大の効果を演出。';
      default:
        return '';
    }
  };

  const saveImage = async () => {
    if (!generatedImage) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限エラー', '画像を保存するには写真へのアクセス許可が必要です。');
        return;
      }

      // 画像をローカルに保存
      const asset = await MediaLibrary.createAssetAsync(generatedImage);
      await MediaLibrary.createAlbumAsync('nyoki', asset, false);
      
      Alert.alert('保存完了', '画像をフォトライブラリに保存しました。');
    } catch (error) {
      Alert.alert('保存エラー', '画像の保存に失敗しました。');
      console.error('画像保存エラー:', error);
    }
  };

  const shareImage = async () => {
    if (!generatedImage) return;

    try {
      await Share.share({
        message: 'nyokiで部屋に植物を配置してみました！ 🌿',
        url: generatedImage,
      });
    } catch (error) {
      console.error('シェアエラー:', error);
    }
  };

  const StyleSelector = () => (
    <View style={styles.styleSelector}>
      <Text style={styles.styleSelectorTitle}>配置スタイル</Text>
      <View style={styles.styleButtons}>
        {(['natural', 'modern', 'minimal'] as const).map((style) => (
          <TouchableOpacity
            key={style}
            style={[
              styles.styleButton,
              selectedStyle === style && styles.styleButtonActive
            ]}
            onPress={() => setSelectedStyle(style)}
          >
            <Text style={[
              styles.styleButtonText,
              selectedStyle === style && styles.styleButtonTextActive
            ]}>
              {style === 'natural' ? 'ナチュラル' : 
               style === 'modern' ? 'モダン' : 'ミニマル'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const PlantsSummary = () => (
    <View style={styles.plantsSummary}>
      <Text style={styles.summaryTitle}>配置する植物</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {selectedPlants.map((plant) => (
          <View key={plant.id} style={styles.plantChip}>
            <Text style={styles.plantChipText}>{plant.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#48BB78" />
        <Text style={styles.loadingText}>AI画像を生成中...</Text>
        <Text style={styles.loadingSubText}>10-30秒ほどお待ちください</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={generateARImage}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.title}>配置プレビュー</Text>
        <View style={{ width: 24 }} />
      </View>

      <StyleSelector />
      
      {generatedImage && (
        <>
          <View style={styles.sliderContainer}>
            <BeforeAfterSlider
              beforeImage={roomImage}
              afterImage={generatedImage}
            />
            <Text style={styles.sliderHint}>
              ← スライドして比較 →
            </Text>
          </View>

          <PlantsSummary />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={saveImage}>
              <Ionicons name="download-outline" size={20} color="#48BB78" />
              <Text style={styles.secondaryButtonText}>保存</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={shareImage}>
              <Ionicons name="share-social-outline" size={20} color="#48BB78" />
              <Text style={styles.secondaryButtonText}>シェア</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmButtonText}>この配置で購入へ進む</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};
```

### AI画像生成サービス（モック）
```typescript
// src/services/ai.ts の追加実装
class AIService {
  async generateARImage(params: {
    roomImage: string;
    plants: Plant[];
    style: string;
    placementGuide: string;
  }): Promise<{ imageUrl: string }> {
    // モック実装
    if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒待機
      
      // スタイルに応じたモック画像を返す
      const mockImages = {
        natural: require('../../assets/images/room-after-natural.jpg'),
        modern: require('../../assets/images/room-after.jpg'),
        minimal: require('../../assets/images/room-after-cool.jpg'),
      };
      
      return {
        imageUrl: mockImages[params.style] || mockImages.natural
      };
    }

    // 実際のGemini API呼び出し（Phase 2で実装）
    const response = await fetch('/api/generate-ar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    return response.json();
  }
}
```

## スタイル定義
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2D3748'
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#718096'
  },
  styleSelector: {
    padding: 16
  },
  styleButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  styleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  styleButtonActive: {
    backgroundColor: '#48BB78',
    borderColor: '#48BB78'
  },
  styleButtonText: {
    color: '#718096'
  },
  styleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  sliderContainer: {
    marginHorizontal: 16,
    marginVertical: 20
  },
  sliderHint: {
    textAlign: 'center',
    color: '#718096',
    marginTop: 8,
    fontSize: 12
  },
  confirmButton: {
    margin: 16,
    backgroundColor: '#48BB78',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
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
- [ ] 配置プレビュー画面が表示される
- [ ] Before/Afterスライダーが動作する
- [ ] スタイル切り替えができる
- [ ] フリーミアム制限が表示される
- [ ] 水やり情報が表示される
- [ ] 植物数制限が正しく動作する
```

## 完了条件
- [x] BeforeAfterSlider実装（✅作成済み）
- [ ] 配置画像生成処理
- [ ] スタイル選択機能
- [ ] 画像保存機能
- [ ] シェア機能
- [ ] フリーミアム制限実装（月5回）
- [ ] 植物数制限実装（5つまで）
- [ ] 水やりリマインダー表示
- [ ] エラーハンドリング
- [ ] Expo Goでの動作確認完了

## 備考
- Gemini API統合はPhase 2で実装
- 現在はモック画像で動作確認
- 画像生成に時間がかかるためローディング表示必須

## 関連ファイル
- `src/screens/PlacementPreviewScreen.tsx` - 配置プレビュー画面（要作成）
- `src/components/BeforeAfterSlider.tsx` - スライダー（✅作成済み）
- `src/services/ai.ts` - AI サービス（✅基本実装済み、要拡張）

最終更新: 2025-08-28
