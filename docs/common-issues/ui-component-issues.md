# UIコンポーネント設計の共通問題

## [2025-01-03] Safe Area対応の不足

### 問題の内容
- iPhone Xシリーズ以降のノッチ対応不足
- ステータスバーやボトムエリアの考慮不足

### 解決方法
- react-native-safe-area-contextの適切な使用
- Platform固有の調整

### 悪い例
```typescript
const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Header title="ホーム" />
      {/* コンテンツがノッチに被る */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20, // 固定値
  }
});
```

### 良い例
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="ホーム" />
      {/* コンテンツが適切に配置される */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});
```

## [2025-01-03] TouchableOpacityの乱用

### 問題の内容
- すべてのタップ要素にTouchableOpacityを使用
- フィードバックが適切でない
- タップエリアが小さすぎる

### 解決方法
- 適切なTouchableコンポーネントの選択
- 最小タップエリアの確保（44x44pt）

### 悪い例
```typescript
<TouchableOpacity onPress={handlePress}>
  <Text style={styles.smallText}>削除</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  smallText: {
    fontSize: 12,
    padding: 4, // タップエリアが小さすぎる
  }
});
```

### 良い例
```typescript
import { Pressable } from 'react-native';

<Pressable 
  onPress={handlePress}
  style={({ pressed }) => [
    styles.button,
    pressed && styles.buttonPressed
  ]}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  <Text style={styles.buttonText}>削除</Text>
</Pressable>

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 14,
  }
});
```

## [2025-01-03] FlatListの最適化不足

### 問題の内容
- keyExtractorの未指定
- getItemLayoutの未実装（固定高さの場合）
- 不要な再レンダリング

### 解決方法
- 適切なFlatList最適化の実装
- renderItemのメモ化

### 悪い例
```typescript
<FlatList
  data={plants}
  renderItem={({ item }) => (
    <PlantCard plant={item} onPress={() => handlePress(item)} />
  )}
/>
```

### 良い例
```typescript
const renderPlantItem = useCallback(({ item }: { item: Plant }) => (
  <PlantCard 
    plant={item} 
    onPress={handlePressPlant}
  />
), [handlePressPlant]);

const keyExtractor = useCallback((item: Plant) => item.id, []);

const getItemLayout = useCallback((data: any, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
}), []);

<FlatList
  data={plants}
  renderItem={renderPlantItem}
  keyExtractor={keyExtractor}
  getItemLayout={getItemLayout} // 固定高さの場合
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
/>
```

## [2025-01-03] Imageコンポーネントの誤用

### 問題の内容
- 大きな画像をそのまま表示
- キャッシュ戦略の不足
- プレースホルダーなし

### 解決方法
- 適切なサイズの画像使用
- FastImageやExpo Imageの活用
- ローディング状態の実装

### 悪い例
```typescript
<Image 
  source={{ uri: plant.imageUrl }}
  style={styles.image}
/>

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
  }
});
```

### 良い例
```typescript
import { Image } from 'expo-image';

const PlantImage = ({ url, style }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <View style={style}>
      <Image
        source={{ uri: url }}
        placeholder={require('../../assets/placeholder.png')}
        contentFit="cover"
        transition={200}
        style={StyleSheet.absoluteFill}
        onLoadEnd={() => setIsLoading(false)}
        cachePolicy="memory-disk" // キャッシュ戦略
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
};
```

## [2025-01-03] モーダルの実装問題

### 問題の内容
- React NativeのModalの制限を理解していない
- バックボタン処理の不足（Android）
- アニメーション設定の誤り

### 解決方法
- 適切なモーダルライブラリの選択
- プラットフォーム差分の考慮

### 悪い例
```typescript
<Modal visible={isVisible} transparent>
  <View style={styles.modalContent}>
    {/* Androidでバックボタンが効かない */}
  </View>
</Modal>
```

### 良い例
```typescript
import { Modal, BackHandler } from 'react-native';

const CustomModal = ({ visible, onClose, children }: Props) => {
  useEffect(() => {
    if (visible && Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          onClose();
          return true; // イベントを消費
        }
      );
      
      return () => backHandler.remove();
    }
  }, [visible, onClose]);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose} // Android必須
    >
      <Pressable 
        style={styles.backdrop} 
        onPress={onClose}
      >
        <Pressable style={styles.modalContent}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  }
});
```