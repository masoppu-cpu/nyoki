import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';
import { UserPlant } from '../types';

interface PlantDetailModalProps {
  plant: UserPlant | null;
  visible: boolean;
  onClose: () => void;
  onWaterComplete?: () => void;
  onAIConsult?: () => void;
}

const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  visible,
  onClose,
  onWaterComplete,
  onAIConsult,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'album' | 'history'>('info');

  if (!plant) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{plant.nickname || plant.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabContainer}>
          {(['info', 'album', 'history'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'info' ? '基本情報' : tab === 'album' ? 'アルバム' : 'ケア履歴'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'info' && (
            <View style={styles.infoContainer}>
              <Image source={plant.image} style={styles.plantImage} resizeMode="cover" />
              <View style={styles.infoRow}>
                <Text style={styles.label}>植物名:</Text>
                <Text style={styles.value}>{plant.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>ニックネーム:</Text>
                <Text style={styles.value}>{plant.nickname || '未設定'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>場所:</Text>
                <Text style={styles.value}>{plant.location}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>最終水やり:</Text>
                <Text style={styles.value}>{plant.lastWatered}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>次回水やり:</Text>
                <Text style={[styles.value, plant.daysUntilWatering === 0 && styles.urgent]}>
                  {plant.daysUntilWatering === 0 ? '今日' : `${plant.daysUntilWatering}日後`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>健康状態:</Text>
                <Text
                  style={[
                    styles.value,
                    plant.health === 'healthy' && styles.healthy,
                    plant.health === 'warning' && styles.warning,
                    plant.health === 'critical' && styles.critical,
                  ]}
                >
                  {plant.health === 'healthy' ? '良好' : plant.health === 'warning' ? '注意' : '要対応'}
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'album' && (
            <View style={styles.albumContainer}>
              <Text style={styles.placeholderText}>写真アルバム機能は準備中です</Text>
            </View>
          )}

          {activeTab === 'history' && (
            <View style={styles.historyContainer}>
              <Text style={styles.placeholderText}>ケア履歴機能は準備中です</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={onWaterComplete}>
            <Text style={styles.primaryButtonText}>水やり完了</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onAIConsult}>
            <Text style={styles.secondaryButtonText}>AI相談</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  infoContainer: {
    padding: SPACING.md,
  },
  plantImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  urgent: {
    color: COLORS.error,
  },
  healthy: {
    color: COLORS.success,
  },
  warning: {
    color: COLORS.warning,
  },
  critical: {
    color: COLORS.error,
  },
  albumContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  historyContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});

export default PlantDetailModal;