# チケット #06: カメラ撮影画面

**タスクID**: FE-003  
**担当**: Frontend  
**推定時間**: 6時間  
**依存関係**: [COMMON-002: 型定義]  
**優先度**: 高（Phase 1）

## 概要
部屋を撮影するカメラ画面を実装。撮影した画像はAI分析に使用。

## TODO リスト

- [x] カメラ画面基本実装（CameraScreen.tsx作成済み）
- [x] カメラ権限リクエスト実装
- [x] 撮影ガイドオーバーレイ
- [x] 画像プレビュー機能
- [x] 再撮影機能
- [x] 画像アップロード準備

## 実装済み内容

### CameraScreen.tsx（基本実装済み）
```typescript
// ✅ src/screens/CameraScreen.tsx 作成済み
// 基本的なカメラ画面UIは実装済み
// TODO: 実際のカメラ機能統合
```

## 追加実装が必要な内容

### Before/Afterスライダー実装
```typescript
// TODO: BeforeAfterSlider.tsx - implementation-guide.mdから
const BeforeAfterSlider = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(0.5);

  return (
    <View style={styles.sliderContainer}>
      <Image source={beforeImage} style={styles.fullImage} />
      <View style={[styles.afterImageContainer, { width: `${sliderPosition * 100}%` }]}>
        <Image source={afterImage} style={styles.fullImage} />
      </View>
      <View
        style={[styles.sliderHandle, { left: `${sliderPosition * 100}%` }]}
        onStartShouldSetResponder={() => true}
        onResponderMove={(e) => {
          const x = e.nativeEvent.locationX;
          const width = Dimensions.get('window').width;
          setSliderPosition(Math.max(0, Math.min(1, x / width)));
        }}
      >
        <View style={styles.sliderLine} />
        <View style={styles.sliderButton}>
          <Ionicons name="code" size={20} color="#FFF" />
        </View>
      </View>
    </View>
  );
};
```

### カメラ権限リクエスト
```typescript
// TODO: カメラ権限処理を追加
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

const requestCameraPermission = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'カメラアクセス許可',
      'お部屋を撮影するためにカメラへのアクセスが必要です',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '設定を開く', onPress: () => Linking.openSettings() }
      ]
    );
    return false;
  }
  return true;
};
```

### 撮影機能実装
```typescript
// TODO: 撮影処理を追加
const takePicture = async () => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.8,
    base64: true, // AI分析用
  });

  if (!result.canceled) {
    setImage(result.assets[0]);
    // プレビュー画面へ遷移
  }
};

// ギャラリーから選択
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.8,
    base64: true,
  });

  if (!result.canceled) {
    setImage(result.assets[0]);
  }
};
```

### 撮影ガイドオーバーレイ
```typescript
// TODO: CameraOverlay.tsx コンポーネント
const CameraOverlay = () => (
  <View style={styles.overlay}>
    <View style={styles.guideFrame}>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
    </View>
    
    <View style={styles.instructions}>
      <Text style={styles.instructionText}>
        部屋全体が入るように撮影してください
      </Text>
      <View style={styles.tips}>
        <Text style={styles.tipText}>💡 明るい時間帯がおすすめ</Text>
        <Text style={styles.tipText}>📐 まっすぐ正面から</Text>
        <Text style={styles.tipText}>🪴 植物を置きたい場所を含める</Text>
      </View>
    </View>
  </View>
);
```

### 画像プレビュー画面
```typescript
// TODO: ImagePreview.tsx コンポーネント
const ImagePreview = ({ image, onRetake, onConfirm }) => (
  <View style={styles.container}>
    <Image source={{ uri: image.uri }} style={styles.previewImage} />
    
    <View style={styles.previewActions}>
      <TouchableOpacity onPress={onRetake} style={styles.retakeButton}>
        <Ionicons name="refresh" size={24} color="#718096" />
        <Text style={styles.retakeText}>撮り直す</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onConfirm} style={styles.confirmButton}>
        <Ionicons name="checkmark" size={24} color="#FFFFFF" />
        <Text style={styles.confirmText}>この写真を使う</Text>
      </TouchableOpacity>
    </View>
  </View>
);
```

### 画像最適化
```typescript
// TODO: 画像リサイズ・圧縮
import * as ImageManipulator from 'expo-image-manipulator';

const optimizeImage = async (imageUri: string) => {
  const manipResult = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1080 } }], // 横幅1080pxにリサイズ
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipResult;
};
```

## UI/UX要件

### 撮影フロー
1. カメラ権限確認
2. 撮影ガイド表示
3. 撮影 or ギャラリー選択
4. プレビュー確認
5. 分析開始 or 撮り直し

### エラーハンドリング
- カメラ権限拒否時の対応
- 画像サイズ制限（10MB以下）
- ネットワークエラー時の対応

## スタイル要件
```typescript
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  guideFrame: {
    flex: 1,
    margin: 40,
    borderWidth: 2,
    borderColor: 'rgba(72, 187, 120, 0.5)',
    borderStyle: 'dashed',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#48BB78',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  // ... 他のコーナースタイル
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
- [ ] カメラ権限リクエストが表示される
- [ ] カメラ撮影ができる
- [ ] ギャラリーから画像を選択できる
- [ ] プレビューが表示される
- [ ] Before/Afterスライダーが動作する
```

## 完了条件
- [x] カメラ撮影機能実装
- [x] ギャラリー選択機能実装
- [x] 撮影ガイド表示
- [x] プレビュー・再撮影機能
- [x] Before/Afterスライダー実装
- [x] 画像最適化処理
- [x] エラーハンドリング
- [x] Expo Goでの動作確認完了

## 備考
- iOS/Android両対応
- 画像は後のAI分析用にbase64形式でも保持
- パフォーマンスを考慮した画像サイズ最適化

## 関連ファイル
- `src/screens/CameraScreen.tsx` - カメラ画面（✅実装済み）
- `src/components/CameraOverlay.tsx` - 撮影ガイド（✅実装済み）
- `src/components/BeforeAfterSlider.tsx` - Before/Afterスライダー（✅実装済み）

最終更新: 2025-08-31

## 実装完了報告

このチケットの全機能は実装済みです：
- ✅ CameraScreen.tsx（カメラ撮影、権限処理、画像最適化）
- ✅ CameraOverlay.tsx（撮影ガイドオーバーレイ）
- ✅ BeforeAfterSlider.tsx（Before/Afterスライダー、自動アニメーション対応）
- ✅ 画像プレビュー機能（CameraScreen内に統合）
- ✅ エラーハンドリング（権限拒否時の対応）

## Auto-PR（Claude用）

目的:
- カメラ画面の最小実装（権限/撮影/プレビュー）を追加しPR作成

ブランチ:
- feat/<TICKET-ID>-camera

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] 権限ダイアログ/撮影が機能
- [ ] プレビュー表示

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-camera
git add -A && git commit -m "[<TICKET-ID}] add camera basic flow"
git push -u origin feat/<TICKET-ID>-camera
gh pr create --fill --base main --head feat/<TICKET-ID>-camera
```
