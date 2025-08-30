import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

interface PlantInfo {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  thumbnail: any;
  difficulty: 'easy' | 'normal' | 'hard';
  petSafe: boolean;
  priceRange: string;
}

interface PlantInfoCardProps {
  plant: PlantInfo;
  onAddToList: (plantId: string) => void;
}

const PlantInfoCard: React.FC<PlantInfoCardProps> = ({ plant, onAddToList }) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToList = () => {
    setIsAdded(true);
    onAddToList(plant.id);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const getDifficultyText = () => {
    switch (plant.difficulty) {
      case 'easy':
        return 'かんたん';
      case 'normal':
        return 'ふつう';
      case 'hard':
        return 'むずかしい';
      default:
        return 'ふつう';
    }
  };

  const getDifficultyColor = () => {
    switch (plant.difficulty) {
      case 'easy':
        return '#48BB78';
      case 'normal':
        return '#F6AD55';
      case 'hard':
        return '#FC8181';
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <Image source={plant.thumbnail} style={styles.thumbnail} />
      
      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <View style={styles.titleSection}>
            <Text style={styles.name}>{plant.name}</Text>
            <Text style={styles.subtitle}>{plant.subtitle}</Text>
          </View>
          <Text style={styles.price}>{plant.price}</Text>
        </View>
        
        <View style={styles.badgesContainer}>
          <View style={[styles.badge, { backgroundColor: getDifficultyColor() + '20' }]}>
            <View style={styles.difficultyDots}>
              {[1, 2, 3].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        (plant.difficulty === 'easy' && level === 1) ||
                        (plant.difficulty === 'normal' && level <= 2) ||
                        (plant.difficulty === 'hard')
                          ? getDifficultyColor()
                          : COLORS.border,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.badgeText, { color: getDifficultyColor() }]}>
              {getDifficultyText()}
            </Text>
          </View>
          
          {plant.petSafe && (
            <View style={[styles.badge, styles.petBadge]}>
              <Ionicons name="paw" size={14} color={COLORS.primary} />
              <Text style={[styles.badgeText, { color: COLORS.primary }]}>
                ペットOK
              </Text>
            </View>
          )}
          
          <View style={[styles.badge, styles.priceBadge]}>
            <Text style={[styles.badgeText, { color: COLORS.textSecondary }]}>
              目安: {plant.priceRange}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, isAdded && styles.addedButton]}
          onPress={handleAddToList}
          disabled={isAdded}
        >
          <Text style={[styles.addButtonText, isAdded && styles.addedButtonText]}>
            {isAdded ? '追加済み' : '購入リストに追加'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  contentContainer: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  titleSection: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  price: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.base,
  },
  petBadge: {
    backgroundColor: `${COLORS.primary}20`,
  },
  priceBadge: {
    backgroundColor: COLORS.base,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  difficultyDots: {
    flexDirection: 'row',
    gap: 2,
    marginRight: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  addedButton: {
    backgroundColor: COLORS.accent,
  },
  addButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textOnPrimary,
  },
  addedButtonText: {
    color: COLORS.textOnAccent,
  },
});

export default PlantInfoCard;