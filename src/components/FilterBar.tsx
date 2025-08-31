import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

interface FilterOption {
  label: string;
  value: string;
}

interface Filters {
  size: string;
  difficulty: string;
  priceRange: string;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const FilterChip: React.FC<{
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const currentOption = options.find(option => option.value === value);
  const displayLabel = currentOption?.label || label;
  const isActive = value !== 'all';

  return (
    <>
      <TouchableOpacity
        style={[styles.chip, isActive && styles.chipActive]}
        onPress={() => setModalVisible(true)}
        accessible={true}
        accessibilityLabel={`${label}フィルター: ${displayLabel}`}
        accessibilityHint="タップしてオプションを選択"
        accessibilityRole="button"
      >
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
          {displayLabel}
        </Text>
        <Text style={[styles.chipIcon, isActive && styles.chipIconActive]}>
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}を選択</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  option.value === value && styles.optionItemSelected,
                ]}
                onPress={() => {
                  onChange(option.value);
                  setModalVisible(false);
                }}
                accessible={true}
                accessibilityLabel={option.label}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.optionText,
                    option.value === value && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {option.value === value && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  const sizeOptions: FilterOption[] = [
    { label: '全て', value: 'all' },
    { label: 'Sサイズ', value: 'S' },
    { label: 'Mサイズ', value: 'M' },
    { label: 'Lサイズ', value: 'L' },
  ];

  const difficultyOptions: FilterOption[] = [
    { label: '全て', value: 'all' },
    { label: '初心者向け', value: '初心者向け' },
    { label: '中級者向け', value: '中級者向け' },
  ];

  const priceOptions: FilterOption[] = [
    { label: '全て', value: 'all' },
    { label: '〜3,000円', value: 'under3000' },
    { label: '3,000〜5,000円', value: '3000to5000' },
    { label: '5,000円〜', value: 'over5000' },
  ];

  const handleFilterReset = () => {
    onFilterChange({ size: 'all', difficulty: 'all', priceRange: 'all' });
  };

  const hasActiveFilters = 
    filters.size !== 'all' || 
    filters.difficulty !== 'all' || 
    filters.priceRange !== 'all';

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FilterChip
          label="サイズ"
          value={filters.size}
          options={sizeOptions}
          onChange={(value) => onFilterChange({ ...filters, size: value })}
        />
        
        <FilterChip
          label="難易度"
          value={filters.difficulty}
          options={difficultyOptions}
          onChange={(value) => onFilterChange({ ...filters, difficulty: value })}
        />
        
        <FilterChip
          label="価格"
          value={filters.priceRange}
          options={priceOptions}
          onChange={(value) => onFilterChange({ ...filters, priceRange: value })}
        />
        
        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleFilterReset}
            accessible={true}
            accessibilityLabel="フィルターをリセット"
            accessibilityRole="button"
          >
            <Text style={styles.resetButtonText}>リセット</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 80,
  },
  chipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textOnBase,
    marginRight: SPACING.xs,
  },
  chipTextActive: {
    color: COLORS.textOnAccent,
    fontWeight: '600',
  },
  chipIcon: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  chipIconActive: {
    color: COLORS.textOnAccent,
  },
  resetButton: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textOnAccent,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.base,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.lg,
    minWidth: 200,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  optionItemSelected: {
    backgroundColor: COLORS.surface,
  },
  optionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnBase,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: COLORS.accent,
  },
  checkMark: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
});

export default FilterBar;