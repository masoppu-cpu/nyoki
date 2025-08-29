# Supabase Setup for nyoki

このディレクトリにはnyokiアプリのSupabase設定が含まれています。

## 📁 ディレクトリ構造

```
supabase/
├── migrations/          # データベースマイグレーション
│   ├── 20250128_000001_initial_setup.sql
│   └── 20250128_000002_storage_setup.sql
├── functions/          # Edge Functions
│   ├── analyze-room/   # 部屋分析API
│   └── generate-composite-image/  # 画像合成API
└── config.toml         # ローカル開発設定
```

## 🚀 セットアップ手順

### 1. Supabaseプロジェクト作成

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. 新規プロジェクトを作成:
   - プロジェクト名: `nyoki-production`
   - リージョン: `Northeast Asia (Tokyo)`
   - 強力なパスワードを生成

### 2. 環境変数の設定

プロジェクト作成後、Settings > API からキーを取得:

```bash
# .env.local を作成
cp .env.example .env.local

# 以下のキーを設定:
EXPO_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Settings > API > Service role key
```

### 3. データベースセットアップ

Supabase Dashboard > SQL Editor で以下のマイグレーションを実行:

1. `migrations/20250128_000001_initial_setup.sql`
2. `migrations/20250128_000002_storage_setup.sql`

### 4. ストレージバケット作成

Dashboard > Storage > New Bucket で以下を作成:

| バケット名 | Public | 用途 |
|-----------|--------|------|
| room-images | ❌ | ユーザーの部屋画像 |
| plant-images | ✅ | 植物画像（公開） |
| user-avatars | ❌ | ユーザーアバター |

### 5. Edge Functions デプロイ

```bash
# Supabase CLIインストール（未インストールの場合）
npm install -g supabase

# プロジェクトリンク
supabase link --project-ref [your-project-ref]

# Functions デプロイ
supabase functions deploy analyze-room
supabase functions deploy generate-composite-image

# 環境変数設定（Dashboard > Edge Functions > 各Function > Secrets）
GEMINI_API_KEY=[your-gemini-api-key]
```

## 🔐 セキュリティ設定

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されています:
- ✅ ユーザーは自分のデータのみアクセス可能
- ✅ 植物マスターデータは誰でも閲覧可能
- ✅ 管理者のみ植物データを編集可能

### 認証設定

Dashboard > Authentication > Settings:
- Email認証: 有効
- パスワード最小長: 8文字
- メール確認: 本番では有効化推奨

## 📝 テーブル一覧

| テーブル名 | 説明 | RLS |
|-----------|------|-----|
| profiles | ユーザープロファイル | ✅ |
| plants | 植物マスターデータ | ✅ |
| user_plants | ユーザーの植物管理 | ✅ |
| room_analyses | 部屋分析履歴 | ✅ |
| purchase_items | 購入検討リスト | ✅ |

## 🧪 ローカル開発

```bash
# ローカルSupabase起動
supabase start

# ローカル環境変数
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=[local-anon-key]

# ローカルSupabase停止
supabase stop
```

## 📊 使用量制限

### 無料プラン
- 植物管理: 5つまで
- AI画像合成: 月5回まで
- AI相談: 月10回まで

### プレミアムプラン（月額480円）
- すべて無制限

## 🔧 トラブルシューティング

### マイグレーションエラー
- テーブルが既に存在する場合は、DROP TABLE文を追加するか、Dashboard > Table Editorから削除

### RLSエラー
- ポリシーが正しく設定されているか確認
- auth.uid()が正しく取得できているか確認

### Edge Functionsエラー
- CORSヘッダーが正しく設定されているか確認
- 環境変数が正しく設定されているか確認

## 📚 参考リンク

- [Supabase Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)