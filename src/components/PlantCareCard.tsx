import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

interface Plant {
  id: string;
  name: string;
  subtitle: string;
  thumbnail: any;
}

interface PlantCareCardProps {
  plant: Plant;
  onAIChat: () => void;
}

const PlantCareCard: React.FC<PlantCareCardProps> = ({ plant, onAIChat }) => {
  return (
    <View style={styles.container}>
      <Image source={plant.thumbnail} style={styles.thumbnail} />
      
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={styles.name}>{plant.name}</Text>
          <Text style={styles.subtitle}>{plant.subtitle}</Text>
        </View>
        
        <TouchableOpacity style={styles.aiButton} onPress={onAIChat}>
          <Text style={styles.aiButtonText}>AI相談</Text>
        </TouchableOpacity>
        
        <View style={styles.iconBadge}>
          <Ionicons name="leaf" size={20} color={COLORS.primary} />
        </View>
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
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  aiButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  aiButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textOnPrimary,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlantCareCard;