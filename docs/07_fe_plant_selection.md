# チケット #07: 植物選択画面（購入検討リスト）

**タスクID**: FE-004  
**担当**: Frontend  
**推定時間**: 4時間  
**依存関係**: [FE-001: モックAPI, COMMON-002: 型定義]  
**優先度**: 高（Phase 1）

## 概要
AI分析後の植物選択・詳細表示画面を実装。推奨された植物から選択し購入検討リストに追加。

## TODO リスト

- [ ] 植物一覧表示コンポーネント
- [ ] フィルター機能（価格、サイズ、難易度）
- [ ] 検索機能
- [ ] 植物詳細モーダル
- [ ] 購入検討リスト追加機能
- [ ] お気に入り機能

## 実装内容

### 植物選択画面
```typescript
// src/screens/PlantSelectionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Plant } from '../types';
import PlantCard from '../components/PlantCard';
import PlantDetailModal from '../components/PlantDetailModal';
import FilterBar from '../components/FilterBar';

interface PlantSelectionScreenProps {
  recommendedPlantIds?: string[];
  onAddToPurchaseList: (plant: Plant) => void;
}

export const PlantSelectionScreen: React.FC<PlantSelectionScreenProps> = ({
  recommendedPlantIds = [],
  onAddToPurchaseList
}) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    size: 'all',
    difficulty: 'all',
    priceRange: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [plants, searchQuery, filters]);

  const loadPlants = async () => {
    try {
      const data = await plantService.getAllPlants();
      // 推奨植物を先頭に配置
      const sorted = sortByRecommended(data, recommendedPlantIds);
      setPlants(sorted);
    } catch (error) {
      console.error('植物データ読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortByRecommended = (plants: Plant[], recommendedIds: string[]) => {
    const recommended = plants.filter(p => recommendedIds.includes(p.id));
    const others = plants.filter(p => !recommendedIds.includes(p.id));
    return [...recommended, ...others];
  };

  const applyFilters = () => {
    let result = [...plants];

    // 検索フィルター
    if (searchQuery) {
      result = result.filter(plant =>
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.description.toLowerCase().includes(searchQuery.toLowerCase())
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

    setFilteredPlants(result);
  };

  const getPriceRange = (range: string): [number, number] => {
    switch (range) {
      case 'under3000': return [0, 3000];
      case '3000to5000': return [3000, 5000];
      case 'over5000': return [5000, 999999];
      default: return [0, 999999];
    }
  };

// 注: 本アプリの「購入検討リスト」は決済を伴わず、実購入は外部リンクで行います。

  const renderPlantItem = ({ item }: { item: Plant }) => {
    const isRecommended = recommendedPlantIds.includes(item.id);
    
    return (
      <PlantCard
        plant={item}
        isRecommended={isRecommended}
        onPress={() => setSelectedPlant(item)}
        onAddToPurchaseList={() => {
          // 購入検討リストに追加
          onAddToPurchaseList(item);
          // フィードバック表示
          showAddedToPurchaseListToast(item.name);
        }}
      />
    );
  };

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>植物を選ぶ</Text>
      
      {recommendedPlantIds.length > 0 && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>
            🌟 {recommendedPlantIds.length}個のおすすめ
          </Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="植物を検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#48BB78" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPlants}
        renderItem={renderPlantItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
      />

      {selectedPlant && (
        <PlantDetailModal
          plant={selectedPlant}
          visible={!!selectedPlant}
          onClose={() => setSelectedPlant(null)}
          onAddToPurchaseList={(plant) => {
            onAddToPurchaseList(plant);
            setSelectedPlant(null);
          }}
        />
      )}
    </View>
  );
};
```

### フィルターバーコンポーネント
```typescript
// src/components/FilterBar.tsx
const FilterBar = ({ filters, onFilterChange }) => {
  return (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <FilterChip
          label="サイズ"
          value={filters.size}
          options={[
            { label: '全て', value: 'all' },
            { label: 'S', value: 'S' },
            { label: 'M', value: 'M' },
            { label: 'L', value: 'L' }
          ]}
          onChange={(value) => onFilterChange({ ...filters, size: value })}
        />
        
        <FilterChip
          label="難易度"
          value={filters.difficulty}
          options={[
            { label: '全て', value: 'all' },
            { label: '初心者向け', value: '初心者向け' },
            { label: '中級者向け', value: '中級者向け' }
          ]}
          onChange={(value) => onFilterChange({ ...filters, difficulty: value })}
        />
        
        <FilterChip
          label="価格"
          value={filters.priceRange}
          options={[
            { label: '全て', value: 'all' },
            { label: '〜3,000円', value: 'under3000' },
            { label: '3,000〜5,000円', value: '3000to5000' },
            { label: '5,000円〜', value: 'over5000' }
          ]}
          onChange={(value) => onFilterChange({ ...filters, priceRange: value })}
        />
      </ScrollView>
    </View>
  );
};
```

### 植物カード改良版
```typescript
// src/components/PlantCard.tsx の改良
export const PlantCard = ({ plant, isRecommended, onPress, onAddToPurchaseList }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>おすすめ</Text>
        </View>
      )}
      
      <Image source={plant.image} style={styles.image} />
      
      <View style={styles.info}>
        <Text style={styles.name}>{plant.name}</Text>
        <Text style={styles.price}>¥{plant.price.toLocaleString()}</Text>
        
        <View style={styles.tags}>
          <Tag text={plant.size} type="size" />
          <Tag text={plant.difficulty} type="difficulty" />
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            onAddToPurchaseList();
          }}
        >
          <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>検討リストへ</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
```

## スタイル定義
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC'
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  searchContainer: {
    marginBottom: 12
  },
  searchInput: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  listContent: {
    paddingBottom: 20
  },
  recommendedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12
  },
  recommendedText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600'
  }
});
```

## Expo Goでの動作確認手順

```bash
# 1. 開発サーバー起動
npm start

# 2. Expo Goアプリでスキャン
# iOS: カメラアプリでQRコード読み取り
# Android: Expo GoアプリでQRコードスキャン

# 3. 確認項目
- [ ] 植物一覧が表示される
- [ ] 検索機能が動作する
- [ ] フィルターで絞り込みができる
- [ ] 植物詳細モーダルが開く
- [ ] 購入検討リストに追加できる
```

## 完了条件
- [x] PlantCard コンポーネント（基本実装済み）
- [ ] 植物一覧表示実装
- [ ] 検索機能実装
- [ ] フィルター機能実装
- [ ] ソート機能（おすすめ順）
- [ ] 購入検討リスト追加フィードバック（トースト/バッジ更新）
- [ ] Expo Goでの動作確認完了

## 本番UX要件（iOS先行）
- 空データ時は空状態メッセージと行動ボタンを表示
- 外部リンク遷移前に簡単な確認文言（アフィリエイト含む場合は注意書き）
- 失敗時（一覧取得/検索/追加）にリトライ案内と安全な復帰導線
- VoiceOver/アクセシビリティラベルの付与（追加ボタン/詳細）

## 備考
- パフォーマンスを考慮してFlatList使用
- 画像の遅延読み込み実装
- おすすめ植物を視覚的に強調

## 関連ファイル
- `src/screens/PlantSelectionScreen.tsx` - 植物選択画面（要作成）
- `src/components/PlantCard.tsx` - 植物カード（✅基本実装済み）
- `src/components/FilterBar.tsx` - フィルターバー（要作成）

最終更新: 2025-08-28

## Auto-PR（Claude用）

目的:
- 植物選択画面（購入検討リスト対応）の最小実装を追加しPR作成

ブランチ:
- feat/<TICKET-ID>-plant-selection

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] 推奨順に並ぶ
- [ ] 検討リストに追加できる

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-plant-selection
git add -A && git commit -m "[<TICKET-ID}] implement plant selection"
git push -u origin feat/<TICKET-ID>-plant-selection
gh pr create --fill --base main --head feat/<TICKET-ID>-plant-selection
```
