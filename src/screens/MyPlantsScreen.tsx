import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';
import { UserPlant } from '../types';
import PlantDetailModal from '../components/PlantDetailModal';

// モックデータ
const MOCK_PLANTS: UserPlant[] = [
  {
    id: '1',
    userId: 'user1',
    plantId: 'plant1',
    name: 'モンステラ',
    nickname: 'モンちゃん',
    location: 'リビング',
    adoptedDate: '2024-12-01',
    lastWatered: '2025-09-01',
    wateringInterval: 7,
    daysUntilWatering: 0, // 今日水やり必要
    health: 'warning',
    notes: '葉が少し黄色くなってきた',
    image: require('../../assets/images/your-room-after-plant1-optimized.jpg'),
    careInstructions: '週1回の水やり、明るい間接光を好む',
  },
  {
    id: '2',
    userId: 'user1',
    plantId: 'plant2',
    name: 'サンスベリア',
    nickname: 'サンちゃん',
    location: '寝室',
    adoptedDate: '2024-11-15',
    lastWatered: '2025-08-25',
    wateringInterval: 14,
    daysUntilWatering: 3,
    health: 'healthy',
    notes: '元気に育っている',
    image: require('../../assets/images/your-room-after-plant2-optimized.jpg'),
    careInstructions: '2週間に1回の水やり、乾燥に強い',
  },
  {
    id: '3',
    userId: 'user1',
    plantId: 'plant3',
    name: 'ポトス',
    nickname: '',
    location: 'キッチン',
    adoptedDate: '2025-01-10',
    lastWatered: '2025-08-30',
    wateringInterval: 5,
    daysUntilWatering: 1,
    health: 'healthy',
    notes: '',
    image: require('../../assets/images/your-room-after-plant3-optimized.jpg'),
    careInstructions: '週1-2回の水やり、日陰でも育つ',
  },
  {
    id: '4',
    userId: 'user1',
    plantId: 'plant4',
    name: 'ゴムの木',
    nickname: 'ゴム太郎',
    location: '玄関',
    adoptedDate: '2024-10-20',
    lastWatered: '2025-08-28',
    wateringInterval: 10,
    daysUntilWatering: 5,
    health: 'healthy',
    notes: '新芽が出てきた！',
    image: require('../../assets/images/room-after-tropical.jpg'),
    careInstructions: '10日に1回の水やり、明るい場所を好む',
  },
  {
    id: '5',
    userId: 'user1',
    plantId: 'plant5',
    name: 'パキラ',
    nickname: 'パキちゃん',
    location: '書斎',
    adoptedDate: '2025-02-01',
    lastWatered: '2025-09-02',
    wateringInterval: 7,
    daysUntilWatering: 6,
    health: 'critical',
    notes: '葉が落ち始めた、要注意',
    image: require('../../assets/images/room-after-natural.jpg'),
    careInstructions: '週1回の水やり、風通しの良い場所を好む',
  },
];

const MyPlantsScreen: React.FC = () => {
  const [plants] = useState<UserPlant[]>(MOCK_PLANTS);
  const [selectedPlant, setSelectedPlant] = useState<UserPlant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 水やりが必要な植物とそれ以外を分ける
  const plantsNeedingWater = plants.filter(p => p.daysUntilWatering === 0);
  const otherPlants = plants.filter(p => p.daysUntilWatering > 0);

  const handlePlantPress = (plant: UserPlant) => {
    setSelectedPlant(plant);
    setShowDetailModal(true);
  };

  const handleWaterComplete = () => {
    Alert.alert('水やり完了', `${selectedPlant?.nickname || selectedPlant?.name}の水やりを記録しました`);
    setShowDetailModal(false);
  };

  const handleAIConsult = () => {
    Alert.alert('AI相談', 'AI相談機能は準備中です');
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />;
      case 'warning':
        return <Ionicons name="alert-circle" size={20} color={COLORS.warning} />;
      case 'critical':
        return <Ionicons name="close-circle" size={20} color={COLORS.error} />;
      default:
        return null;
    }
  };

  const getWateringStatus = (days: number) => {
    if (days === 0) {
      return { text: '今日', color: COLORS.error };
    } else if (days === 1) {
      return { text: '明日', color: COLORS.warning };
    } else {
      return { text: `${days}日後`, color: COLORS.textSecondary };
    }
  };
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Plants</Text>
          <Text style={styles.subtitle}>
            {plants.length}個の植物を管理中
            {plantsNeedingWater.length > 0 && ` • ${plantsNeedingWater.length}個が水やり必要`}
          </Text>
        </View>

        {/* 水やりが必要な植物セクション */}
        {plantsNeedingWater.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="water" size={20} color={COLORS.background} />
              </View>
              <Text style={styles.sectionTitle}>今日の水やり</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{plantsNeedingWater.length}</Text>
              </View>
            </View>

            <View style={styles.plantGrid}>
              {plantsNeedingWater.map((plant) => {
                const waterStatus = getWateringStatus(plant.daysUntilWatering);
                return (
                  <TouchableOpacity
                    key={plant.id}
                    style={[styles.plantCard, styles.urgentCard]}
                    onPress={() => handlePlantPress(plant)}
                  >
                    <Image source={plant.image} style={styles.plantImage} />
                    <View style={styles.plantInfo}>
                      <View style={styles.plantHeader}>
                        <Text style={styles.plantName} numberOfLines={1}>
                          {plant.nickname || plant.name}
                        </Text>
                        {getHealthIcon(plant.health)}
                      </View>
                      <Text style={styles.plantLocation}>{plant.location}</Text>
                      <View style={styles.wateringInfo}>
                        <Ionicons name="water-outline" size={16} color={waterStatus.color} />
                        <Text style={[styles.wateringText, { color: waterStatus.color }]}>
                          {waterStatus.text}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* すべての植物セクション */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: COLORS.textSecondary }]}>
            <Ionicons name="leaf" size={20} color={COLORS.background} />
          </View>
          <Text style={styles.sectionTitle}>すべての植物</Text>
          <View style={[styles.badge, { backgroundColor: COLORS.surface }]}>
            <Text style={[styles.badgeText, { color: COLORS.textSecondary }]}>{otherPlants.length}</Text>
          </View>
        </View>

        <View style={styles.plantGrid}>
          {otherPlants.map((plant) => {
            const waterStatus = getWateringStatus(plant.daysUntilWatering);
            return (
              <TouchableOpacity
                key={plant.id}
                style={styles.plantCard}
                onPress={() => handlePlantPress(plant)}
              >
                <Image source={plant.image} style={styles.plantImage} />
                <View style={styles.plantInfo}>
                  <View style={styles.plantHeader}>
                    <Text style={styles.plantName} numberOfLines={1}>
                      {plant.nickname || plant.name}
                    </Text>
                    {getHealthIcon(plant.health)}
                  </View>
                  <Text style={styles.plantLocation}>{plant.location}</Text>
                  <View style={styles.wateringInfo}>
                    <Ionicons name="water-outline" size={16} color={waterStatus.color} />
                    <Text style={[styles.wateringText, { color: waterStatus.color }]}>
                      {waterStatus.text}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 無料プラン制限メッセージ */}
        <View style={styles.limitMessage}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.limitText}>
            無料プランでは5つまでの植物を管理できます
          </Text>
        </View>
      </ScrollView>

      {/* 植物詳細モーダル */}
      <PlantDetailModal
        plant={selectedPlant}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onWaterComplete={handleWaterComplete}
        onAIConsult={handleAIConsult}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  badge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.warning,
  },
  plantGrid: {
    paddingHorizontal: SPACING.lg,
  },
  plantCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },
  plantImage: {
    width: 100,
    height: 100,
  },
  plantInfo: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  plantLocation: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  wateringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  wateringText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  limitMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  limitText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
});

export default MyPlantsScreen;