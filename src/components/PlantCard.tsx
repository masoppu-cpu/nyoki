import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';
import { Plant } from '../types';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onAddToPurchaseList?: () => void;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant, onPress, onAddToPurchaseList }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={plant.image} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <Text style={styles.name}>{plant.name}</Text>
        <Text style={styles.size}>サイズ: {plant.size}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.difficulty}>{plant.difficulty}</Text>
          <Text style={styles.light}>{plant.light}</Text>
        </View>
        <Text style={styles.water}>水やり: {plant.water}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>¥{plant.price.toLocaleString()}</Text>
          {onAddToPurchaseList && (
            <TouchableOpacity style={styles.cartButton} onPress={onAddToPurchaseList}>
              <Text style={styles.cartButtonText}>検討リストへ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
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
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: SPACING.md,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text,
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
    color: COLORS.primary,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  price: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cartButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  cartButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});

export default PlantCard;
