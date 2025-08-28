# チケット #01: API仕様書作成

**タスクID**: COMMON-001  
**担当**: Full-stack  
**推定時間**: 2時間  
**依存関係**: なし  
**優先度**: 最高（Phase 0）

## 概要
フロントエンド・バックエンドの並行開発を可能にするため、API仕様を最初に確定させる。
本番実装では認証はSupabase Authを直接使用し、独自のAuthエンドポイントは作成しない（将来のAPI Gateway導入時に再検討）。

## TODO リスト

- [x] プロジェクト構造の確認
- [x] エンドポイント一覧作成（Supabase Functions実体に準拠）
- [x] リクエスト/レスポンス形式定義
- [x] エラーレスポンス仕様
- [x] 認証ヘッダー仕様

## API エンドポイント仕様

### 認証関連（本番実装方針）
- 認証はSupabase Authをクライアントから直接呼び出す（`supabase.auth.*`）。
- 独自の`/api/auth/*`エンドポイントは初期リリースでは提供しない。
- 将来的にGatewayを導入する場合のみ、`/api/auth/*`を設計する。

### 植物関連
```typescript
GET    /api/plants          - 植物一覧取得
GET    /api/plants/:id      - 植物詳細取得
GET    /api/plants/recommended - おすすめ植物取得
POST   /api/plants/search   - 植物検索
```

### ユーザー植物管理
```typescript
GET    /api/user/plants     - ユーザーの植物一覧
POST   /api/user/plants     - 植物を追加
PUT    /api/user/plants/:id - 植物情報更新
DELETE /api/user/plants/:id - 植物を削除
POST   /api/user/plants/:id/water - 水やり記録
```

### 部屋・配置プレビュー関連
```typescript
POST   /api/rooms/analyze         - 部屋画像分析（Functions: analyze-room）
POST   /api/rooms/generate        - 配置画像生成（Functions: generate-ar-image）
GET    /api/rooms/history         - 分析履歴取得（Functions: room-history）
```

### 購入検討リスト（非決済/初期リリース）
```typescript
GET    /api/purchase-list                 - 購入検討リスト取得（status=considering）
POST   /api/purchase-list/add             - 植物を購入検討リストに追加
DELETE /api/purchase-list/remove/:id      - 購入検討リストから削除
PATCH  /api/purchase-list/:id/purchased   - 購入済みに移動（status=purchased, purchased_at設定）
GET    /api/purchase-list/purchased       - 購入済みリスト取得（status=purchased）
```

注記:
- 実際の購入は外部リンク（アフィリエイト等）に遷移。アプリ内で決済は行わない。
- 既存の`/api/cart/*`や`orders`関連は将来拡張として保留。

### サブスクリプション
```typescript
GET    /api/subscription/status    - サブスク状態確認
POST   /api/subscription/upgrade   - プレミアムにアップグレード
POST   /api/subscription/cancel    - サブスクキャンセル
```

## レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": {},
  "message": "操作が成功しました"
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  }
}
```

## 認証ヘッダー
- Supabase Functions呼び出し時は、ユーザーのアクセストークン（`supabase.auth.getSession()`で取得）を`Authorization: Bearer <access_token>`として送信する。
- ANON KEY をAuthorizationヘッダーに入れないこと（セキュリティとRLSの整合のため）。

## 完了条件
- [x] API仕様書のレビュー完了
- [x] フロントエンド開発者の承認
- [x] バックエンド開発者の承認
- [x] モックデータ構造の確定

## 備考
- Supabaseの自動生成API（`supabase.from()`）とEdge Functions（`supabase.functions.invoke()`）を活用
- 将来的にAPI Gateway（例：Next.js API/Cloudflare）経由で`/api/*`に統一する選択肢あり
- GraphQL移行は将来検討

## 付記（エンドポイント実体の対応関係）
- `/api/rooms/analyze` → Functions `analyze-room`
- `/api/rooms/generate` → Functions `generate-ar-image`
- `/api/rooms/history` → Functions `room-history`

## Auto-PR（Claude用）

目的:
- このチケットの内容を最小差分で実装し、PRを作成してください

ブランチ:
- feat/<TICKET-ID>-<short-desc>
  例: feat/COMMON-001-api-spec
  - <TICKET-ID> は本ファイル冒頭の「タスクID」の値を使用

コミット規約:
- 1コミット=1意図、メッセージは [<TICKET-ID>] から始める
  例: [COMMON-001] define rooms endpoints

PR:
- タイトル: [<TICKET-ID>] <短い要約>
- 本文: .github/pull_request_template.md に準拠（目的/テスト/スクショ）
- リベース禁止。必要なら「Update branch」を案内

動作確認（最低限）:
- [ ] 仕様の差分が反映されている
- [ ] 参照リンクが整合
- [ ] エラー/警告なし

実行手順（Claudeが行うコマンド例）:
```bash
git switch -c feat/<TICKET-ID>-<short-desc>
git add -A && git commit -m "[<TICKET-ID>] <要約>"
git push -u origin feat/<TICKET-ID>-<short-desc>
# GitHub CLI があれば
gh pr create --fill --base main --head feat/<TICKET-ID>-<short-desc>
# 無ければGitHub UIでPR作成
```

## 関連ファイル
- `src/types/api.ts` - API型定義
- `src/services/api.ts` - APIクライアント実装

最終更新: 2025-08-28
