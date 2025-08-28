import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING } from '../config/constants';
import { AppView, PurchaseListItem } from '../types';

interface TabBarProps {
  selectedTab: number;
  onTabPress: (index: number, view: AppView) => void;
  purchaseListItems: PurchaseListItem[];
}

const TabBar: React.FC<TabBarProps> = ({ selectedTab, onTabPress, purchaseListItems }) => {
  const tabs = [
    { icon: 'home', label: 'ホーム', view: 'home' as AppView },
    { icon: 'leaf', label: 'My Plants', view: 'my-plants' as AppView },
    { icon: 'basket', label: 'Shop', view: 'shop' as AppView },
    { icon: 'bookmark', label: '検討リスト', view: 'purchase-list' as AppView },
  ];

  const consideringCount = (purchaseListItems || []).filter(i => i.status === 'considering').length;

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tabItem}
          onPress={() => onTabPress(index, tab.view)}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={selectedTab === index ? COLORS.primary : COLORS.inactive}
            />
            {tab.view === 'purchase-list' && consideringCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{consideringCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              selectedTab === index && styles.activeTabLabel,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZE.xs,
    fontWeight: 'bold',
  },
});

export default TabBar;
