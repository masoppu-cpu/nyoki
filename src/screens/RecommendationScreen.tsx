import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import PlantCard from '../components/PlantCard';
import { Plant } from '../types';

interface RecommendationScreenProps {
  recommendedPlants: Plant[];
  onAddToPurchaseList: (plant: Plant) => void;
  onBack: () => void;
  onNavigateToShop: () => void;
}

const RecommendationScreen: React.FC<RecommendationScreenProps> = ({
  recommendedPlants,
  onAddToPurchaseList,
  onBack,
  onNavigateToShop,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<'natural' | 'modern' | 'cozy'>('natural');

  const getAfterImage = () => {
    switch (selectedStyle) {
      case 'natural':
        return require('../../assets/images/room-after-natural.jpg');
      case 'modern':
        return require('../../assets/images/your-room-after-plant2.png');
      case 'cozy':
        return require('../../assets/images/your-room-after-plant3.png');
      default:
        return require('../../assets/images/your-room-after-plant1.png');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>AI提案結果</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.analysisResult}>
          <Text style={styles.sectionTitle}>部屋の分析結果</Text>
          <View style={styles.resultCard}>
            <View style={styles.resultItem}>
              <Ionicons name="sunny" size={20} color={COLORS.primary} />
              <Text style={styles.resultLabel}>光量</Text>
              <Text style={styles.resultValue}>明るい日陰</Text>
            </View>
            <View style={styles.resultItem}>
              <Ionicons name="water" size={20} color={COLORS.primary} />
              <Text style={styles.resultLabel}>湿度</Text>
              <Text style={styles.resultValue}>普通</Text>
            </View>
            <View style={styles.resultItem}>
              <Ionicons name="thermometer" size={20} color={COLORS.primary} />
              <Text style={styles.resultLabel}>温度</Text>
              <Text style={styles.resultValue}>最適</Text>
            </View>
          </View>
        </View>

        <View style={styles.styleSection}>
          <Text style={styles.sectionTitle}>配置スタイルを選択</Text>
          <View style={styles.styleButtons}>
            {(['natural', 'modern', 'cozy'] as const).map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.styleButton,
                  selectedStyle === style && styles.styleButtonActive,
                ]}
                onPress={() => setSelectedStyle(style)}
              >
                <Text
                  style={[
                    styles.styleButtonText,
                    selectedStyle === style && styles.styleButtonTextActive,
                  ]}
                >
                  {style === 'natural' ? 'ナチュラル' : style === 'modern' ? 'モダン' : 'コージー'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.beforeAfterSection}>
          <Text style={styles.sectionTitle}>Before & After</Text>
          <BeforeAfterSlider
            beforeImage={require('../../assets/images/room-before.jpg')}
            afterImage={getAfterImage()}
          />
          <Text style={styles.sliderHint}>
            <Ionicons name="swap-horizontal" size={16} color={COLORS.textSecondary} />
            {' '}スライダーを動かして比較
          </Text>
        </View>

        <View style={styles.plantsSection}>
          <Text style={styles.sectionTitle}>おすすめの植物</Text>
          {recommendedPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onPress={() => {}}
              onAddToPurchaseList={() => onAddToPurchaseList(plant)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.moreButton} onPress={onNavigateToShop}>
          <Text style={styles.moreButtonText}>もっと植物を見る</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    paddingTop: 50,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  analysisResult: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  resultItem: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  resultValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  styleSection: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  styleButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  styleButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  styleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  styleButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  styleButtonTextActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
  beforeAfterSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  sliderHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  plantsSection: {
    padding: SPACING.lg,
  },
  moreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.lg,
  },
  moreButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
});

export default RecommendationScreen;
