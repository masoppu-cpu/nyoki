import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';
import { Plant } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - SPACING.md * 3) / 2; // 2列表示用

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onAddToPurchaseList?: () => void;
  isRecommended?: boolean;
  style?: 'full' | 'compact';
}

const PlantCard: React.FC<PlantCardProps> = ({ 
  plant, 
  onPress, 
  onAddToPurchaseList, 
  isRecommended = false,
  style = 'full'
}) => {
  const isCompact = style === 'compact';
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isCompact && styles.cardCompact,
        isRecommended && styles.cardRecommended
      ]} 
      onPress={onPress}
      accessible={true}
      accessibilityLabel={`${plant.name}, 価格${plant.price.toLocaleString()}円`}
      accessibilityHint="タップして詳細を表示"
      accessibilityRole="button"
    >
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>おすすめ</Text>
        </View>
      )}
      
      <Image source={plant.image} style={[styles.image, isCompact && styles.imageCompact]} resizeMode="cover" />
      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <Text style={[styles.name, isCompact && styles.nameCompact]} numberOfLines={2}>
          {plant.name}
        </Text>
        
        {!isCompact && (
          <>
            <Text style={styles.size}>サイズ: {plant.size}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.difficulty}>{plant.difficulty}</Text>
              <Text style={styles.light}>{plant.light}</Text>
            </View>
            <Text style={styles.water}>水やり: {plant.water}</Text>
          </>
        )}
        
        {isCompact && (
          <View style={styles.compactInfo}>
            <View style={styles.tagContainer}>
              <Text style={styles.sizeTag}>{plant.size}</Text>
              <Text style={styles.difficultyTag}>{plant.difficulty}</Text>
            </View>
          </View>
        )}
        
        <View style={[styles.footer, isCompact && styles.footerCompact]}>
          <Text style={[styles.price, isCompact && styles.priceCompact]}>
            ¥{plant.price.toLocaleString()}
          </Text>
          {onAddToPurchaseList && (
            <TouchableOpacity 
              style={[styles.cartButton, isCompact && styles.cartButtonCompact]} 
              onPress={(e) => {
                e.stopPropagation();
                onAddToPurchaseList();
              }}
              accessible={true}
              accessibilityLabel="購入検討リストに追加"
              accessibilityRole="button"
            >
              <Text style={[styles.cartButtonText, isCompact && styles.cartButtonTextCompact]}>
                {isCompact ? '追加' : '検討リストへ'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.base,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  cardCompact: {
    width: cardWidth,
    marginBottom: SPACING.sm,
  },
  cardRecommended: {
    borderWidth: 2,
    borderColor: COLORS.warning,
    elevation: 5,
  },
  recommendedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageCompact: {
    height: 120,
  },
  content: {
    padding: SPACING.md,
  },
  contentCompact: {
    padding: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: SPACING.xs,
  },
  nameCompact: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xs,
  },
  size: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  difficulty: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.accent,
    fontWeight: '500',
  },
  light: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  water: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  compactInfo: {
    marginBottom: SPACING.xs,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  sizeTag: {
    fontSize: FONT_SIZE.xs,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    color: COLORS.textSecondary,
  },
  difficultyTag: {
    fontSize: FONT_SIZE.xs,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    color: COLORS.textOnAccent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  footerCompact: {
    marginTop: SPACING.xs,
  },
  price: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  priceCompact: {
    fontSize: FONT_SIZE.lg,
  },
  cartButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  cartButtonCompact: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  cartButtonText: {
    color: COLORS.textOnAccent,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  cartButtonTextCompact: {
    fontSize: FONT_SIZE.xs,
  },
});

export default PlantCard;
