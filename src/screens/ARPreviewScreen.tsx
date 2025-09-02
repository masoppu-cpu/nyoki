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
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { aiService } from '../services/ai';
import { subscriptionService } from '../services/subscription';
import { Plant } from '../types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

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

  const checkFreemiumLimit = async (): Promise<boolean> => {
    const status = subscriptionService.getStatus();
    
    if (!status.isPremium && !status.canGenerateAR) {
      Alert.alert(
        '無料プランの制限',
        '今月のAI画像生成回数（5回）に達しました。\nプレミアムプラン（月額480円）で無制限にお使いいただけます。',
        [
          { text: '今はやめる', style: 'cancel' },
          { text: 'プレミアムにアップグレード', onPress: () => subscriptionService.upgradeToPremium() }
        ]
      );
      return false;
    }
    return true;
  };

  const generateARImage = async () => {
    // Check freemium limit before generating
    const canGenerate = await checkFreemiumLimit();
    if (!canGenerate) return;

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
      
      // Increment usage count for freemium tracking
      subscriptionService.incrementARGenerationCount();
    } catch (err) {
      setError('画像生成に失敗しました。もう一度お試しください。');
      console.error('配置画像生成エラー:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getPlacementGuide = (style: string): string => {
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

  const getNextWateringDay = (plant: Plant): string => {
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

  const WateringInfo = () => (
    <View style={styles.wateringInfo}>
      <Text style={styles.wateringTitle}>💧 水やりスケジュール</Text>
      {selectedPlants.map(plant => (
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

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
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
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
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
          <WateringInfo />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={saveImage}>
              <Ionicons name="download-outline" size={20} color={COLORS.accent} />
              <Text style={styles.secondaryButtonText}>保存</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={shareImage}>
              <Ionicons name="share-social-outline" size={20} color={COLORS.accent} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBackButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  loadingSubText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.textOnAccent,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
  },
  styleSelector: {
    padding: SPACING.md,
  },
  styleSelectorTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  styleButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  styleButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  styleButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  styleButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  styleButtonTextActive: {
    color: COLORS.textOnAccent,
    fontWeight: '600',
  },
  sliderContainer: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.lg,
  },
  sliderHint: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.xs,
  },
  plantsSummary: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  plantChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plantChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  wateringInfo: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wateringTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  wateringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  plantName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    flex: 1,
  },
  wateringSchedule: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  wateringNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent,
    gap: SPACING.xs,
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  confirmButton: {
    margin: SPACING.md,
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.textOnAccent,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});

export default ARPreviewScreen;