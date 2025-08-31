import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';
import { PurchaseListItem } from '../types';

interface PurchaseListScreenProps {
  items: PurchaseListItem[];
  onUpdateStatus: (id: string, status: 'considering' | 'purchased') => void;
  onRemoveItem: (id: string) => void;
}

const PurchaseListScreen: React.FC<PurchaseListScreenProps> = ({ 
  items, 
  onUpdateStatus, 
  onRemoveItem 
}) => {
  const consideringItems = items.filter(item => item.status === 'considering');
  const purchasedItems = items.filter(item => item.status === 'purchased');

  const handlePurchase = (item: PurchaseListItem) => {
    Alert.alert(
      '購入確認',
      `${item.plantName}を購入済みにしますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '購入済みにする', 
          onPress: () => onUpdateStatus(item.id, 'purchased')
        }
      ]
    );
  };

  const handleRemove = (item: PurchaseListItem) => {
    Alert.alert(
      '削除確認',
      `${item.plantName}をリストから削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          onPress: () => onRemoveItem(item.id),
          style: 'destructive'
        }
      ]
    );
  };

  const renderItem = (item: PurchaseListItem) => (
    <View key={item.id} style={styles.itemCard}>
      <Image source={item.plantImage} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.plantName}</Text>
        <Text style={styles.itemPrice}>¥{item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.itemActions}>
        {item.status === 'considering' ? (
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={() => handlePurchase(item)}
          >
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.purchasedBadge}>
            <Text style={styles.purchasedText}>購入済み</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>購入検討リスト</Text>
        <Text style={styles.subtitle}>気になる植物をチェック</Text>
      </View>

      {consideringItems.length === 0 && purchasedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>リストが空です</Text>
          <Text style={styles.emptyDescription}>
            Shopタブから気になる植物を{'\n'}追加してみましょう
          </Text>
        </View>
      ) : (
        <>
          {consideringItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>検討中 ({consideringItems.length})</Text>
              {consideringItems.map(renderItem)}
            </View>
          )}

          {purchasedItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>購入済み ({purchasedItems.length})</Text>
              {purchasedItems.map(renderItem)}
            </View>
          )}
        </>
      )}
    </ScrollView>
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
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemPrice: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchaseButton: {
    padding: SPACING.sm,
  },
  removeButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  purchasedBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  purchasedText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default PurchaseListScreen;