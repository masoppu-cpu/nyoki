# マイグレーション安全運用ガイド

## 現在の状態（2025-01-29）

### 適用済みマイグレーション
1. `20250128_000001_initial_setup.sql` - 基本テーブル作成
2. `20250128_000002_storage_setup.sql` - ストレージ設定
3. `20250829_000003_schema_update.sql` - スキーマ拡張

### 作成済みテーブル
- profiles, plants, user_plants, room_analyses, purchase_items
- ar_generations, recommended_plants, watering_logs, scheduled_notifications

## 🔒 本番環境での安全な運用ルール

### 1. マイグレーション作成時
```bash
# 必ず開発環境でテスト
supabase db reset  # ローカルでリセット
supabase migration up  # ローカルで適用確認
```

### 2. マイグレーションファイル命名規則
```
YYYYMMDD_HHMMSS_description.sql
例: 20250130_140000_add_user_preferences.sql
```

### 3. 必須チェックリスト
- [ ] ローカル環境でテスト済み
- [ ] ロールバック方法を文書化
- [ ] 既存データへの影響を確認
- [ ] RLSポリシーの影響を確認
- [ ] インデックスのパフォーマンス影響を確認

### 4. 緊急時のロールバック手順
```sql
-- 各マイグレーションに対応するロールバックSQL準備
-- supabase/rollbacks/YYYYMMDD_HHMMSS_rollback.sql に保存
```

### 5. GitHub Actions ワークフロー
- **PR作成時**: 構文チェックのみ（実行しない）
- **mainマージ時**: 自動適用
- **手動実行**: workflow_dispatch で緊急対応

## ⚠️ 絶対にやってはいけないこと

1. **本番DBで直接SQL実行しない**（MCP含む）
2. **テストなしでmainにマージしない**
3. **DROP文を含むマイグレーションは要レビュー**
4. **大量データ更新は営業時間外に実施**

## 📝 トラブルシューティング

### schema_migrations エラーの場合
```bash
# ローカルで状態確認
supabase migration list

# 不整合がある場合は修復
supabase migration repair --status applied <version>
```

### 本番適用が失敗した場合
1. GitHub Actions のログ確認
2. Supabase Dashboard でエラー詳細確認
3. 必要に応じてrollbackスクリプト実行
4. 修正版を新しいマイグレーションとして作成

## 連絡先
問題発生時は以下の順で対応：
1. GitHub Actions ログ確認
2. Supabase Dashboard 確認
3. ローカルで再現テスト
4. 必要に応じてSupabaseサポート連絡