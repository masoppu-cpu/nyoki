import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { subscriptionService } from '../services/subscription';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

interface PlanStatusHeaderProps {
  onUpgrade?: () => void;
}

export const PlanStatusHeader: React.FC<PlanStatusHeaderProps> = ({ onUpgrade }) => {
  const status = subscriptionService.getStatus();

  return (
    <View style={styles.container}>
      <View style={styles.planInfo}>
        <Text style={styles.planText}>
          {status.isPremium ? 'プレミアム' : '無料プラン'}
        </Text>
        {!status.isPremium && (
          <>
            <Text style={styles.limitText}>
              植物: {status.plantsCount}/5
            </Text>
            <Text style={styles.limitText}>
              AI生成: {status.arGenerationCount}/5
            </Text>
          </>
        )}
      </View>
      {!status.isPremium && onUpgrade && (
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
          <Text style={styles.upgradeButtonText}>アップグレード</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planInfo: {
    flex: 1,
  },
  planText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  limitText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  upgradeButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  upgradeButtonText: {
    color: COLORS.textOnAccent,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});

export default PlanStatusHeader;