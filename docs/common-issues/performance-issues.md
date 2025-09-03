# パフォーマンス問題の共通パターン

## [2025-01-03] 重い画像の最適化不足

### 問題の内容
- 大きな画像ファイルをそのまま使用
- 適切な圧縮やリサイズなし
- 遅延読み込みの未実装

### 解決方法
- 画像の事前最適化
- 適切なフォーマットの選択
- 遅延読み込みの実装

### 悪い例
```typescript
// 4MBの画像をそのまま使用
<Image 
  source={require('../../assets/high-res-plant.jpg')}
  style={styles.thumbnail}
/>
```

### 良い例
```typescript
// 最適化された画像を使用
<Image 
  source={require('../../assets/plant-thumb.jpg')} // 最適化済み
  style={styles.thumbnail}
  resizeMode="cover"
/>

// または動的な最適化
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

## [2025-01-03] FlatListのパフォーマンス問題

### 問題の内容
- 大量データの一括レンダリング
- 仮想化の設定不足
- 不要な再レンダリング

### 解決方法
- 適切な仮想化設定
- メモ化の活用
- 最適化プロパティの設定

### 悪い例
```typescript
<ScrollView>
  {plants.map(plant => (
    <PlantCard key={plant.id} plant={plant} />
  ))}
</ScrollView>
```

### 良い例
```typescript
const renderItem = useCallback(({ item }) => (
  <PlantCard plant={item} />
), []);

<FlatList
  data={plants}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

## [2025-01-03] 不要な計算の繰り返し

### 問題の内容
- 重い計算を毎レンダリングで実行
- メモ化の不使用
- 派生状態の誤った管理

### 解決方法
- useMemoの適切な使用
- 計算結果のキャッシュ
- 派生状態の最適化

### 悪い例
```typescript
const PlantStats = ({ plants }) => {
  // 毎回計算される
  const stats = plants.reduce((acc, plant) => {
    // 重い計算処理
    return calculateComplexStats(acc, plant);
  }, {});
  
  const sortedPlants = plants.sort((a, b) => {
    // 毎回ソート
    return a.wateringDays - b.wateringDays;
  });
  
  return <View>{/* ... */}</View>;
};
```

### 良い例
```typescript
const PlantStats = ({ plants }) => {
  // 計算結果をメモ化
  const stats = useMemo(() => 
    plants.reduce((acc, plant) => {
      return calculateComplexStats(acc, plant);
    }, {}),
    [plants]
  );
  
  const sortedPlants = useMemo(() => 
    [...plants].sort((a, b) => a.wateringDays - b.wateringDays),
    [plants]
  );
  
  return <View>{/* ... */}</View>;
};
```

## [2025-01-03] 過度なアニメーション

### 問題の内容
- JS駆動のアニメーション使用
- 複雑すぎるアニメーション
- 同時実行される大量のアニメーション

### 解決方法
- ネイティブドライバの使用
- シンプルなアニメーション
- アニメーションの最適化

### 悪い例
```typescript
// JS駆動のアニメーション
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: false, // JS駆動
}).start();

// setIntervalでのアニメーション
setInterval(() => {
  setRotation(prev => prev + 1);
}, 16);
```

### 良い例
```typescript
// ネイティブドライバを使用
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ネイティブ駆動
}).start();

// Reanimated 2の使用
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const rotation = useSharedValue(0);
const animatedStyles = useAnimatedStyle(() => {
  return {
    transform: [{ rotate: `${rotation.value}deg` }],
  };
});
```

## [2025-01-03] バンドルサイズの肥大化

### 問題の内容
- 不要な依存関係
- 未使用コードの含有
- 大きなライブラリの全体インポート

### 解決方法
- Tree shakingの活用
- 動的インポート
- 軽量な代替ライブラリ

### 悪い例
```typescript
// lodash全体をインポート
import _ from 'lodash';

const debounced = _.debounce(handleSearch, 300);

// moment.js全体をインポート
import moment from 'moment';
const date = moment().format('YYYY-MM-DD');
```

### 良い例
```typescript
// 必要な関数のみインポート
import debounce from 'lodash/debounce';

const debounced = debounce(handleSearch, 300);

// 軽量な代替ライブラリ
import { format } from 'date-fns';
const date = format(new Date(), 'yyyy-MM-dd');

// または動的インポート
const loadHeavyComponent = async () => {
  const { HeavyComponent } = await import('./HeavyComponent');
  return HeavyComponent;
};
```