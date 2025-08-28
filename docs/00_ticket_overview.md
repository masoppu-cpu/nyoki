# nyoki開発チケット一覧

## 概要
植物AR配置アプリ「nyoki」の開発タスクをフロントエンド・バックエンド並行開発可能な形で分割。
MVP目標：2025年9月7日

## チケット構成

### Phase 0: 共通基盤 (Day 1)
- [01_api_specification.md](01_api_specification.md) - API仕様書作成
- [02_type_definitions.md](02_type_definitions.md) - TypeScript型定義
- [03_project_setup.md](03_project_setup.md) - プロジェクト初期設定

### Phase 1: 並行開発 (Day 2-4)
#### フロントエンド
- [04_fe_mock_api.md](04_fe_mock_api.md) - モックAPI層実装
- [05_fe_onboarding.md](05_fe_onboarding.md) - オンボーディング画面
- [06_fe_camera.md](06_fe_camera.md) - カメラ撮影画面
- [07_fe_plant_selection.md](07_fe_plant_selection.md) - 植物選択画面
- [08_fe_ar_preview.md](08_fe_ar_preview.md) - AR配置プレビュー画面
- [09_fe_state_management.md](09_fe_state_management.md) - ローカル状態管理

#### バックエンド
- [10_be_supabase_setup.md](10_be_supabase_setup.md) - Supabaseセットアップ
- [11_be_database_schema.md](11_be_database_schema.md) - データベーススキーマ
- [12_be_plants_api.md](12_be_plants_api.md) - 植物API
- [13_be_users_api.md](13_be_users_api.md) - ユーザー管理API
- [14_be_rooms_api.md](14_be_rooms_api.md) - 部屋データAPI
- [15_be_image_upload.md](15_be_image_upload.md) - 画像アップロード機能

### Phase 2: 部分統合 (Day 5-6)
- [16_auth_integration.md](16_auth_integration.md) - 認証機能統合
- [17_api_switch.md](17_api_switch.md) - モック→実API切り替え
- [18_image_pipeline.md](18_image_pipeline.md) - 画像処理パイプライン

### Phase 3: 外部サービス統合 (Day 7-8)
- [19_revenuecat_setup.md](19_revenuecat_setup.md) - RevenueCat SDK統合
- [20_subscription_management.md](20_subscription_management.md) - サブスクリプション管理
- [21_onesignal_setup.md](21_onesignal_setup.md) - OneSignal統合
- [22_push_notification.md](22_push_notification.md) - プッシュ通知設定

### Phase 4: 最終調整 (Day 9)
- [23_eas_build.md](23_eas_build.md) - EAS Build設定
- [24_testflight_deploy.md](24_testflight_deploy.md) - TestFlightデプロイ
- [25_production_config.md](25_production_config.md) - 本番環境設定

## 進捗状況

| Phase | 完了率 | 備考 |
|-------|-------|------|
| Phase 0 | 33% | TypeScript型定義一部完了 |
| Phase 1 | 10% | 画面実装一部着手 |
| Phase 2 | 0% | 未着手 |
| Phase 3 | 0% | 未着手 |
| Phase 4 | 0% | 未着手 |

## 依存関係ダイアグラム
```
Phase 0 (API仕様・型定義)
    ├── Phase 1 FE (モック開発)
    └── Phase 1 BE (実API開発)
            └── Phase 2 (統合)
                    └── Phase 3 (外部サービス)
                            └── Phase 4 (デプロイ)
```

最終更新: 2025-08-28

## 補足（MVPの購入フロー方針）
- 注文/決済は将来拡張。MVPでは「購入検討リスト」に追加して外部リンクで購入する。
- ユーザーが「購入済み」にチェックすると、購入検討リストから購入済みリストへ移動する（アプリ内記録のみ）。

## 開発運用（人がやるTODOの指針）
- 迷ったら `docs/HUMAN_TODO.md` に従う（非エンジニアでも運用できる超シンプル版）。
- Claude（AI）に「ブランチ作成→実装→PR作成」まで依頼可能。チケットのmdを渡して指示すればOK。
