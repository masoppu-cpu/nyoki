import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

interface CareTask {
  id: string;
  title: string;
  time: string;
  category: 'water' | 'fertilizer' | 'repot' | 'prune';
  completed: boolean;
}

interface CareTaskCardProps {
  task: CareTask;
  onToggle: (taskId: string) => void;
}

const CareTaskCard: React.FC<CareTaskCardProps> = ({ task, onToggle }) => {
  const getCategoryColor = () => {
    switch (task.category) {
      case 'water':
        return '#4299E1';
      case 'fertilizer':
        return '#48BB78';
      case 'repot':
        return '#ED8936';
      case 'prune':
        return '#9F7AEA';
      default:
        return COLORS.primary;
    }
  };

  const getCategoryIcon = () => {
    switch (task.category) {
      case 'water':
        return 'water';
      case 'fertilizer':
        return 'nutrition';
      case 'repot':
        return 'flower';
      case 'prune':
        return 'cut';
      default:
        return 'leaf';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {}}
      activeOpacity={0.9}
    >
      <View style={[styles.categoryLine, { backgroundColor: getCategoryColor() }]} />
      
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.time}>{task.time}</Text>
        </View>
        
        <View style={[styles.iconBadge, { backgroundColor: getCategoryColor() + '20' }]}>
          <Ionicons name={getCategoryIcon()} size={20} color={getCategoryColor()} />
        </View>
        
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => onToggle(task.id)}
        >
          {task.completed ? (
            <View style={styles.checkedCircle}>
              <Ionicons name="checkmark" size={16} color={COLORS.textOnPrimary} />
            </View>
          ) : (
            <View style={styles.uncheckedCircle} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryLine: {
    width: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  textSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  time: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  toggleButton: {
    padding: SPACING.xs,
  },
  uncheckedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  checkedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CareTaskCard;