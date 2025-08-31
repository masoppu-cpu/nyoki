import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';
import { Plant, PurchaseListItem } from '../types';
import PlantCard from '../components/PlantCard';
import PlantShopModal from '../components/PlantShopModal';
import FilterBar from '../components/FilterBar';
import { plantService } from '../services/plants';

interface Filters {
  size: string;
  difficulty: string;
  priceRange: string;
}

interface PlantSelectionScreenProps {
  recommendedPlantIds?: string[];
  onAddToPurchaseList: (plant: Plant) => void;
  onBack?: () => void;
  purchaseList?: PurchaseListItem[];
}

const PlantSelectionScreen: React.FC<PlantSelectionScreenProps> = ({
  recommendedPlantIds = [],
  onAddToPurchaseList,
  onBack,
  purchaseList = [],
}) => {
  // State管理
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    size: 'all',
    difficulty: 'all',
    priceRange: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // 植物データの読み込み
  const loadPlants = useCallback(async () => {
    try {
      setError(null);
      const data = await plantService.getAllPlants();
      // 推奨植物を先頭に配置
      const sorted = sortByRecommended(data, recommendedPlantIds);
      setPlants(sorted);
    } catch (error) {
      console.error('植物データ読み込みエラー:', error);
      setError('植物データの読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [recommendedPlantIds]);

  // リフレッシュ処理
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPlants();
    setIsRefreshing(false);
  }, [loadPlants]);

  // 推奨植物を先頭に並び替え
  const sortByRecommended = (plants: Plant[], recommendedIds: string[]): Plant[] => {
    const recommended = plants.filter(p => recommendedIds.includes(p.id));
    const others = plants.filter(p => !recommendedIds.includes(p.id));
    return [...recommended, ...others];
  };

  // 価格範囲の取得
  const getPriceRange = (range: string): [number, number] => {
    switch (range) {
      case 'under3000': return [0, 3000];
      case '3000to5000': return [3000, 5000];
      case 'over5000': return [5000, 999999];
      default: return [0, 999999];
    }
  };

  // フィルタリング処理をメモ化
  const applyFilters = useMemo(() => {
    let result = [...plants];

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(plant =>
        plant.name.toLowerCase().includes(query) ||
        plant.description.toLowerCase().includes(query)
      );
    }

    // サイズフィルター
    if (filters.size !== 'all') {
      result = result.filter(plant => plant.size === filters.size);
    }

    // 難易度フィルター
    if (filters.difficulty !== 'all') {
      result = result.filter(plant => plant.difficulty === filters.difficulty);
    }

    // 価格フィルター
    if (filters.priceRange !== 'all') {
      const [min, max] = getPriceRange(filters.priceRange);
      result = result.filter(plant => 
        plant.price >= min && plant.price <= max
      );
    }

    return result;
  }, [plants, searchQuery, filters]);

  // フィルター結果の更新
  useEffect(() => {
    setFilteredPlants(applyFilters);
  }, [applyFilters]);

  // 初期ロード
  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  // 購入検討リスト追加処理
  const handleAddToPurchaseList = useCallback(async (plant: Plant) => {
    try {
      // 重複チェック
      const isAlreadyAdded = purchaseList.some(item => item.plant.id === plant.id);
      if (isAlreadyAdded) {
        Alert.alert('通知', `${plant.name}はすでに購入検討リストに追加されています。`);
        return;
      }

      onAddToPurchaseList(plant);
      
      // 成功フィードバック
      Alert.alert(
        '追加完了',
        `${plant.name}を購入検討リストに追加しました`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('購入検討リスト追加エラー:', error);
      Alert.alert('エラー', '追加に失敗しました。もう一度お試しください。');
    }
  }, [onAddToPurchaseList, purchaseList]);

  // 検索クリア処理
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // フィルターリセット処理
  const handleFilterReset = useCallback(() => {
    setFilters({ size: 'all', difficulty: 'all', priceRange: 'all' });
  }, []);

  // 植物カード描画
  const renderPlantItem = useCallback(({ item }: { item: Plant }) => {
    const isRecommended = recommendedPlantIds.includes(item.id);
    const isInPurchaseList = purchaseList.some(listItem => listItem.plant.id === item.id);
    
    return (
      <PlantCard
        plant={item}
        isRecommended={isRecommended}
        style="compact"
        onPress={() => setSelectedPlant(item)}
        onAddToPurchaseList={!isInPurchaseList ? () => handleAddToPurchaseList(item) : undefined}
      />
    );
  }, [recommendedPlantIds, purchaseList, handleAddToPurchaseList]);

  // リストヘッダー
  const ListHeader = useCallback(() => (
    <View style={styles.header}>
      {/* タイトル部分 */}
      <View style={styles.titleContainer}>
        {onBack && (
          <TouchableOpacity 
            onPress={onBack}
            style={styles.backButton}
            accessible={true}
            accessibilityLabel="戻る"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textOnBase} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>植物を選ぶ</Text>
      </View>
      
      {/* 推奨バッジ */}
      {recommendedPlantIds.length > 0 && (
        <View style={styles.recommendedBadge}>
          <Ionicons name="star" size={16} color={COLORS.warning} />
          <Text style={styles.recommendedText}>
            {recommendedPlantIds.length}個のおすすめ
          </Text>
        </View>
      )}

      {/* 検索バー */}
      <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="植物を検索..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
          accessible={true}
          accessibilityLabel="植物を検索"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* フィルターバー */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
      />
    </View>
  ), [
    onBack, 
    recommendedPlantIds.length, 
    searchQuery, 
    searchFocused, 
    handleClearSearch, 
    filters
  ]);

  // 空状態表示
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="leaf-outline" size={64} color={COLORS.inactive} />
      <Text style={styles.emptyTitle}>植物が見つかりません</Text>
      <Text style={styles.emptyText}>
        {searchQuery || filters.size !== 'all' || filters.difficulty !== 'all' || filters.priceRange !== 'all'
          ? '検索条件を変更してみてください'
          : '植物データの読み込み中です'}
      </Text>
      {(searchQuery || filters.size !== 'all' || filters.difficulty !== 'all' || filters.priceRange !== 'all') && (
        <TouchableOpacity style={styles.resetButton} onPress={() => {
          handleClearSearch();
          handleFilterReset();
        }}>
          <Text style={styles.resetButtonText}>条件をリセット</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [searchQuery, filters, handleClearSearch, handleFilterReset]);

  // エラー表示
  if (error && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>エラーが発生しました</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPlants}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* ローディング表示 */}
      {isLoading && !isRefreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>植物を読み込み中...</Text>
        </View>
      )}

      {/* メインコンテンツ */}
      {!isLoading && (
        <FlatList
          data={filteredPlants}
          renderItem={renderPlantItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmptyComponent}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.accent]}
              tintColor={COLORS.accent}
            />
          }
          // パフォーマンス最適化
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 200, // 推定アイテム高さ
            offset: 200 * index,
            index,
          })}
        />
      )}

      {/* 詳細モーダル */}
      {selectedPlant && (
        <PlantShopModal
          plant={selectedPlant}
          visible={!!selectedPlant}
          isRecommended={recommendedPlantIds.includes(selectedPlant.id)}
          onClose={() => setSelectedPlant(null)}
          onAddToPurchaseList={(plant) => {
            handleAddToPurchaseList(plant);
            setSelectedPlant(null);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.base,
    paddingBottom: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    flex: 1,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  recommendedText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textOnBase,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchContainerFocused: {
    borderColor: COLORS.accent,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnBase,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.textOnAccent,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  resetButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetButtonText: {
    color: COLORS.textOnBase,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});

export default PlantSelectionScreen;