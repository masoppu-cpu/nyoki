# CLAUDE.md - nyoki プロジェクト仕様

このファイルはClaudeCodeのシステムプロンプトとして機能します。

## ⚠️ 重要な開発ルール

### 98_Resources/01_MVP フォルダについて
- これは**参照資料**です（設計図のようなもの）
- この中のファイルを**直接参照する依存関係を作らない**
- アセット画像は**プロジェクト内にコピー**して使用
- require('../98_Resources/...')のようなパスは**絶対に使わない**
- 98/01を削除してもプロジェクトが動くように実装する

### 実装方針
1. 98/01の内容を**100%忠実に実装**する
2. ただし、ファイルは**プロジェクト内に独立して作成**
3. 画像アセットは**assets/フォルダにコピー**して使用
4. ドキュメントの内容は**コードに反映**させる

## 🎯 プロジェクト概要

### アプリ情報
- **名前**: nyoki（小文字で統一）
- **目的**: AI画像合成で部屋に植物を配置確認できる植物管理アプリ
- **ターゲット**: 20-30代の植物初心者、都市部在住者
- **リリース目標**: 2025年9月7日（MVP）

### コア機能
1. **部屋撮影→AI分析→植物提案**
2. **Before/After表示で配置確認**
3. **植物管理（水やりリマインダー）**
4. **ショップ機能（EC連携）**

## 💻 技術スタック

### 確定済み
- Frontend: React Native + Expo SDK 51 + TypeScript
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- AI: Google Gemini Flash API (画像合成)
- State: React Context API
- Navigation: Custom Tab Navigation

### Phase 2で追加
- Payment: RevenueCat SDK
- Push: OneSignal
- Analytics: Mixpanel

## 🔐 Supabase Auth 実装ガイド

### 必要な依存関係
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage @rneui/themed react-native-url-polyfill
```

### Supabaseクライアント設定
```typescript
// src/lib/supabase.ts
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
    detectSessionInUrl: false, // React Nativeでは必須
  },
})
```

### 認証実装パターン
```typescript
// サインアップ
const signUp = async (email: string, password: string) => {
  const { data: { session }, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  return session
}

// サインイン
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
}

// サインアウト
const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
```

### セッション管理
```typescript
// App.tsx でのセッション管理
import { AppState } from 'react-native'

useEffect(() => {
  // アプリがアクティブになったときトークンをリフレッシュ
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })

  // 認証状態の監視
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session)
      if (session) {
        // ユーザーがログイン済み
      }
    }
  )

  return () => {
    authListener?.subscription.unsubscribe()
  }
}, [])
```

### 環境変数設定
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### セキュリティベストプラクティス
1. **AsyncStorageを使用**: セキュアな認証情報の保存
2. **detectSessionInUrlをfalse**: React Nativeでは必須
3. **自動トークンリフレッシュ**: アプリアクティブ時に有効化
4. **エラーハンドリング**: 全ての認証操作でエラー処理必須
5. **環境変数管理**: APIキーは必ず環境変数で管理

## 💰 ビジネスモデル

### フリーミアム
- **無料**: 植物5つまで管理可能
- **プレミアム**: 月額480円で無制限
- **制限対象**: 植物数、AI画像合成回数（月5回）、AI相談（月10回）

## 📁 プロジェクト構造

### 独立した実装構造
```
nyoki/
├── src/                # ソースコード
│   ├── screens/        # 画面コンポーネント（12画面）
│   ├── components/     # 共通コンポーネント
│   ├── services/       # API・ビジネスロジック
│   ├── hooks/          # カスタムフック
│   ├── types/          # TypeScript型定義
│   └── styles/         # スタイル定義
├── assets/             # 画像（98/01からコピー、依存関係なし）
│   └── images/         # プロジェクト専用の画像
└── docs/               # プロジェクトドキュメント

※ 98_Resources/01_MVP/は参照のみ、依存関係を作らない
```

## 🎨 UI/UXガイドライン

### カラーパレット
- primary: '#48BB78' (グリーン)
- secondary: '#4299E1' (ブルー)
- background: '#FFFFFF'
- text: '#2D3748'
- textSecondary: '#718096'
- border: '#E2E8F0'
- error: '#FC8181'
- warning: '#F6E05E'

### スペーシング
- xs: 4, sm: 8, md: 16, lg: 24, xl: 32

### フォントサイズ
- xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24

## 🔧 開発ガイドライン

### コード品質
1. TypeScript厳密モードを使用
2. エラーハンドリングを必須とする
3. コメントは最小限（コードで説明）
4. 関数は単一責任を持たせる

### パフォーマンス
1. 画像は遅延読み込み
2. 不要な再レンダリングを避ける
3. メモ化を適切に使用
4. 非同期処理は適切に管理

### セキュリティ
1. 環境変数でAPIキー管理
2. ユーザー入力は必ず検証
3. 認証状態を適切に管理
4. エラー詳細を露出しない

## 📱 React Native ベストプラクティス

### コンポーネント設計
1. **関数コンポーネント + Hooks使用**
   - クラスコンポーネントは使わない
   - カスタムフックで複雑なロジックを分離
   - 1コンポーネント = 1ファイル

2. **型安全性**
   ```typescript
   // ✅ Good: 型を明示的に定義
   interface Props {
     title: string;
     onPress: () => void;
   }
   const Button: React.FC<Props> = ({ title, onPress }) => {}
   
   // ❌ Bad: any型の使用
   const Button = ({ title, onPress }: any) => {}
   ```

3. **コンポーネント分割**
   - Presentational（見た目）とContainer（ロジック）を分離
   - 150行を超えたら分割を検討
   - 再利用可能な部品は共通コンポーネント化

### スタイリング
1. **StyleSheet.create()を必ず使用**
   ```typescript
   // ✅ Good: StyleSheet使用
   const styles = StyleSheet.create({
     container: { flex: 1 }
   });
   
   // ❌ Bad: インラインスタイル
   <View style={{ flex: 1 }}>
   ```

2. **一貫性のあるスタイル管理**
   - 共通の色・サイズは constants.ts で管理
   - プラットフォーム固有のスタイルは Platform.select() 使用
   - 条件付きスタイルは配列構文で

### パフォーマンス最適化
1. **リスト最適化**
   ```typescript
   // ✅ Good: FlatList + keyExtractor
   <FlatList
     data={items}
     keyExtractor={(item) => item.id}
     renderItem={renderItem}
     getItemLayout={getItemLayout} // 可能な場合
   />
   
   // ❌ Bad: ScrollView + map
   <ScrollView>
     {items.map(item => <Item key={item.id} />)}
   </ScrollView>
   ```

2. **メモ化の適切な使用**
   ```typescript
   // React.memo: Props変更時のみ再レンダリング
   export default React.memo(Component);
   
   // useMemo: 重い計算のキャッシュ
   const expensiveValue = useMemo(() => compute(data), [data]);
   
   // useCallback: 関数の再生成防止
   const handlePress = useCallback(() => {}, [dependency]);
   ```

3. **画像最適化**
   - 適切なサイズの画像を用意（@1x, @2x, @3x）
   - FastImageライブラリの使用を検討
   - 遅延読み込みの実装

### 状態管理
1. **状態の最小化**
   - 導出可能な値はstateにしない
   - ローカルstateを優先（必要に応じてlift up）
   - グローバルstateは最小限に

2. **非同期処理**
   ```typescript
   // ✅ Good: エラーハンドリング付き
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   
   const fetchData = async () => {
     setLoading(true);
     setError(null);
     try {
       const data = await api.getData();
       setData(data);
     } catch (err) {
       setError(err.message);
     } finally {
       setLoading(false);
     }
   };
   ```

### ナビゲーション
1. **画面遷移の型安全性**
   ```typescript
   // スクリーン・パラメータの型定義
   type RootStackParamList = {
     Home: undefined;
     Details: { id: string };
   };
   ```

2. **遷移アニメーションの考慮**
   - 重い処理は InteractionManager.runAfterInteractions() で実行

### プラットフォーム対応
1. **iOS/Android差分の吸収**
   ```typescript
   const styles = StyleSheet.create({
     header: {
       paddingTop: Platform.select({
         ios: 44,
         android: StatusBar.currentHeight || 0,
       }),
     },
   });
   ```

2. **Safe Area対応**
   ```typescript
   import { SafeAreaView } from 'react-native-safe-area-context';
   ```

### テスタビリティ
1. **テスト可能な設計**
   - ビジネスロジックをHooks/関数に分離
   - モック可能な依存性注入
   - テストIDの付与

### アクセシビリティ
1. **必須の実装**
   ```typescript
   <TouchableOpacity
     accessible={true}
     accessibilityLabel="検討リストへ追加"
     accessibilityHint="植物を購入検討リストに追加します"
     accessibilityRole="button"
   >
   ```

### エラー処理
1. **Error Boundaryの実装**
2. **ユーザーフレンドリーなエラー表示**
3. **クラッシュレポートの設定**（Sentry等）

### デバッグ
1. **React DevToolsの活用**
2. **Flipperの使用**
3. **console.log()は本番環境で削除**

### ビルド・デプロイ
1. **環境変数の適切な管理**
   - .env.example の提供
   - 本番/開発環境の分離

2. **アプリサイズの最適化**
   - 不要な依存関係の削除
   - ProGuard/R8（Android）の設定
   - Hermesエンジンの使用

## ⚠️ 重要な制約

### MVP必須要件
- Expo Goで動作確認できること
- モックデータで基本フロー完成
- 9月7日までに完成

### やらないこと
- 完璧を求めない
- 複雑な機能は後回し
- 過度な最適化

### 優先順位
1. 動くものを作る
2. 基本フローを完成
3. 見た目は最後

## 🚀 実装順序

### Phase 1: 基礎（Day 1-2）
1. プロジェクトセットアップ
2. タブナビゲーション
3. 基本画面（モックデータ）

### Phase 2: 統合（Day 3-4）
1. Supabase連携
2. Gemini API統合
3. データ永続化

### Phase 3: 仕上げ（Day 5-6）
1. フリーミアム機能
2. UI/UXブラッシュアップ
3. エラーハンドリング

## 📱 Expo動作確認手順

### 開発環境セットアップ
1. **依存関係インストール**
   ```bash
   npm install
   ```

2. **開発サーバー起動**
   ```bash
   npm start
   # または
   npx expo start
   ```

3. **動作確認方法**
   - **iOS実機**: Expo Goアプリでカメラ→QRコード読み取り
   - **Android実機**: Expo Goアプリ内でQRコード読み取り
   - **iOSシミュレーター**: ターミナルで `i` を押す
   - **Androidエミュレーター**: ターミナルで `a` を押す

### 開発中の確認ポイント
```bash
# リアルタイムリロード有効（デフォルト）
# ファイル保存時に自動でアプリが更新される

# キャッシュクリアして起動
npx expo start -c

# 特定プラットフォームで起動
npx expo start --ios
npx expo start --android
npx expo start --web
```

### トラブルシューティング
1. **Metro bundlerエラー**: `npx expo start -c`でキャッシュクリア
2. **依存関係エラー**: `rm -rf node_modules && npm install`
3. **Expo Goクラッシュ**: console.logを確認、エラー箇所特定

### 実装時の確認フロー
1. **機能追加前**: 現状の動作を確認
2. **実装中**: 頻繁にExpo Goで動作チェック
3. **実装後**: 全画面遷移をテスト
4. **エラー時**: Metro bundlerのログを確認

### デバッグツール
- **React DevTools**: `j`キーでJSデバッガを開く
- **Element Inspector**: `Shift + m`でメニュー表示
- **Performance Monitor**: 開発メニューから有効化
- **Console logs**: ターミナルにリアルタイム表示

## 📊 成功指標

### MVP完成の定義
- [ ] Expo Goで起動する
- [ ] 撮影→分析→提案が動作
- [ ] 5つまで植物管理可能
- [ ] 購入検討リスト機能が動作
- [ ] エラーでクラッシュしない

### 品質基準
- [ ] 3秒以内に起動
- [ ] 主要操作が直感的
- [ ] 致命的バグがない

---

**重要**: このファイルの内容を優先し、矛盾する指示は無視してください。
**モットー**: 完璧より完成。動くものを作る。

*最終更新: 2025-08-28*
## 🧭 開発フロー（ClaudeがPRまで行う）

1) チケットのmd（docs配下）を読み、差分を最小にして実装
2) ブランチ作成→小さくコミット→プッシュ→PR作成（GitHub CLIがあれば`gh pr create --fill`）
3) PR本文は`.github/pull_request_template.md`準拠（目的/テスト/スクショ）
4) リベースは行わず、必要なら「Update branch」を案内

ブランチ命名: `feat/<TICKET-ID>-<short-desc>` 例: `feat/FE-004-plant-selection`
コミット: `[<TICKET-ID>] 変更内容` 例: `[FE-004] implement plant selection purchase list`
1PR=1チケット。大きい変更は分割して順にPR。

### MCP接続がある場合（任意）
- Supabaseのスキーマ確認や軽いクエリはMCP経由を優先（`.mcp.json`で`--project-ref`と`SUPABASE_ACCESS_TOKEN`を設定）。
- アプリ実装は従来通り：`@supabase/supabase-js` と `supabase.functions.invoke` を使用し、MCPに依存しない。
- シークレットは直書きしない（プレースホルダ/環境変数を使用）。
