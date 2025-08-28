# チケット #03: プロジェクト初期設定

**タスクID**: COMMON-003  
**担当**: Full-stack  
**推定時間**: 3時間  
**依存関係**: なし  
**優先度**: 最高（Phase 0）

## 概要
Expo + Supabaseプロジェクトの初期設定。開発環境の構築と基本設定。

## TODO リスト

### 基本設定
- [x] package.json作成
- [x] TypeScript設定（tsconfig.json）
- [x] ESLint設定（.eslintrc.js）
- [x] Prettier設定（.prettierrc）
- [x] Git設定（.gitignore）
- [x] Expo設定（app.json）
- [x] Babel設定（babel.config.js）

### 環境変数
- [ ] .env.local作成
- [ ] .env.production作成
- [x] .env.example作成（テンプレートのみ）

### Supabase設定
- [ ] Supabaseプロジェクト作成
- [ ] 環境変数設定
- [ ] クライアント初期化（src/lib/supabase.ts）

### 依存関係インストール
```bash
# ✅ 基本パッケージ（package.json記載済み）
npm install

# TODO: 追加パッケージ
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-url-polyfill
npx expo install expo-image-picker
npx expo install expo-camera
```

### 画像アセット準備
```bash
# assetsフォルダ構造
assets/
├── hero-room.jpg           # ホーム画面のヒーロー画像
├── your-room-before.jpg    # Before画像（部屋の元の状態）
├── your-room-after-plant1.png  # After画像（植物配置後1）
├── your-room-after-plant2.png  # After画像（植物配置後2）
├── your-room-after-plant3.png  # After画像（植物配置後3）
└── icon.png               # アプリアイコン

# 画像を98_Resources/01_MVP/assetsからコピー（存在する場合）
# または適切なサンプル画像を用意
# 重要: 画像の拡張子は必ず小文字（.jpg, .png）にすること
```

## 環境変数テンプレート

### .env.local（開発環境）
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...

# Google Gemini
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyxxxxx...

# RevenueCat (Phase 3で設定)
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_xxxxx...

# OneSignal (Phase 3で設定)
EXPO_PUBLIC_ONESIGNAL_APP_ID=xxxxx...
```

## Supabaseクライアント設定

```typescript
// TODO: src/lib/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

## 開発サーバー起動手順

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env.local
# → .env.localを編集

# 3. 開発サーバー起動
npm start

# 4. Expo Goで確認
# QRコードをスキャン
```

## 完了条件
- [x] 全設定ファイル作成完了
- [ ] 環境変数設定完了
- [ ] Supabaseプロジェクト作成
- [ ] 開発サーバー起動確認
- [ ] Expo Goでの動作確認

## トラブルシューティング

### Metro bundlerエラー
```bash
npx expo start -c  # キャッシュクリア
```

### 依存関係エラー
```bash
rm -rf node_modules
npm install
```

## 備考
- Expo SDK 51使用
- React Native 0.74.1
- TypeScript厳密モード有効

## 関連ファイル
- `package.json` - パッケージ設定（✅作成済み）
- `tsconfig.json` - TypeScript設定（✅作成済み）
- `.env.local` - 開発環境変数（要作成）
- `src/lib/supabase.ts` - Supabaseクライアント（要作成）

最終更新: 2025-08-28