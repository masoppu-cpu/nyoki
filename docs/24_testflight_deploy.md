# チケット #24: TestFlightデプロイ

**タスクID**: DEPLOY-002  
**担当**: Full-stack  
**推定時間**: 2時間  
**依存関係**: [DEPLOY-001: EAS Build設定]  
**優先度**: 高（Phase 4）

## 概要
iOS向けTestFlightでのベータ版配信設定。内部テスター・外部テスター管理。

## TODO リスト

- [ ] App Store Connect設定
- [ ] TestFlightビルドアップロード
- [ ] アプリ情報入力
- [ ] テスターグループ作成
- [ ] ベータ版リリースノート作成
- [ ] クラッシュレポート設定

## App Store Connect設定

### アプリ作成
```
1. App Store Connectにログイン
   https://appstoreconnect.apple.com

2. マイAppから「+」新規App作成
   - プラットフォーム: iOS
   - 名前: nyoki
   - プライマリ言語: 日本語
   - バンドルID: com.nyoki.app
   - SKU: nyoki-ios-001

3. アプリ情報入力
   - カテゴリ: ライフスタイル
   - サブカテゴリ: ホーム
```

### TestFlight設定
```
1. TestFlightタブを選択
2. App情報を入力
   - ベータ版App説明
   - フィードバックメール
   - マーケティングURL（オプション）
   - プライバシーポリシーURL
```

## EAS Submit設定

### eas.json更新
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
```

### 自動送信スクリプト
```bash
#!/bin/bash
# scripts/submit-testflight.sh

echo "🚀 Starting TestFlight submission..."

# ビルド
eas build --platform ios --profile production --non-interactive

# ビルドが完了するまで待機
echo "⏳ Waiting for build to complete..."
eas build:list --platform ios --limit 1 --json > build-info.json

BUILD_ID=$(jq -r '.[0].id' build-info.json)
BUILD_STATUS=$(jq -r '.[0].status' build-info.json)

while [ "$BUILD_STATUS" != "finished" ]; do
  sleep 30
  eas build:list --platform ios --limit 1 --json > build-info.json
  BUILD_STATUS=$(jq -r '.[0].status' build-info.json)
  echo "Build status: $BUILD_STATUS"
done

# TestFlightに送信
echo "📤 Submitting to TestFlight..."
eas submit --platform ios --latest

echo "✅ Submission complete!"
```

## テスター管理

### 内部テスターグループ
```
グループ名: 開発チーム
メンバー:
- 開発者（最大100名）
- デザイナー
- PM

権限: App Store Connect アクセス権必要
```

### 外部テスターグループ
```
グループ1: アルファテスター
- 社内関係者
- 限定: 50名
- フィードバック: 必須

グループ2: ベータテスター
- 一般ユーザー
- 限定: 500名
- フィードバック: 任意

グループ3: VIPテスター
- インフルエンサー
- 限定: 20名
- 特別サポート
```

## ベータ版情報

### リリースノートテンプレート
```markdown
# nyoki ベータ版 v1.0.0 (Build xxx)

## 新機能
- 🌱 AI による部屋分析機能
- 📸 植物配置プレビュー
- 💧 水やりリマインダー
- 🛒 植物購入機能

## 改善点
- パフォーマンスの向上
- UIの改善

## 既知の問題
- 一部のデバイスでカメラが起動しない場合があります
- 画像生成に時間がかかることがあります

## フィードバック
ご意見・ご要望は以下までお願いします：
feedback@nyoki.app

テスターの皆様のご協力に感謝いたします！
```

### テストポイント指示書
```markdown
# テスターへのお願い

## 重点テスト項目
1. **カメラ撮影**
   - 異なる照明条件での撮影
   - 縦向き/横向きでの撮影

2. **AI分析**
   - 分析結果の妥当性
   - エラーが出ないか

3. **植物選択**
   - フィルター機能
   - 検索機能

4. **購入フロー**
   - 購入検討リスト機能（追加/購入済みへの移動）
   - 外部リンク遷移（アフィリエイト等）の確認

## バグ報告方法
1. TestFlightアプリからスクリーンショット撮影
2. 詳細な手順を記載
3. デバイス情報を含める
```

## App Store Connect API連携

### APIキー生成
```
1. App Store Connect > ユーザとアクセス
2. キー > App Store Connect API
3. キーを生成
   - 名前: nyoki-eas-submit
   - アクセス: App Manager
4. .p8ファイルをダウンロード（1回のみ）
```

### EAS Secrets設定
```bash
# APIキー情報を設定
eas secret:create --name APPLE_API_KEY_ID --value "XXXXXXXXXX"
eas secret:create --name APPLE_API_KEY_ISSUER_ID --value "xxxxx-xxxxx"

# .p8ファイルの内容を設定
eas secret:create --name APPLE_API_KEY --file AuthKey_XXXXXXXXXX.p8
```

## クラッシュレポート設定

### Sentry統合
```typescript
// App.tsx
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enableInExpoDevelopment: false,
  debug: __DEV__,
  environment: 'testflight',
});
```

### TestFlight Crash Reports
```
1. App Store Connect > TestFlight
2. ビルドを選択
3. クラッシュレポートタブ
4. 自動収集が有効になっていることを確認
```

## 配信フロー

### 1. 内部テスト（1週目）
```bash
# 内部テスター向けビルド
eas build --platform ios --profile preview

# TestFlightに送信
eas submit --platform ios --latest

# 内部テスターグループに配信
# App Store Connectで手動設定
```

### 2. 限定ベータ（2週目）
```bash
# プロダクションビルド
eas build --platform ios --profile production

# 送信
eas submit --platform ios --latest

# 外部テスターグループ1に配信
```

### 3. オープンベータ（3週目）
```
# 外部テスターグループ2に配信
# TestFlightリンクを公開
https://testflight.apple.com/join/XXXXXXXX
```

## チェックリスト

### 提出前確認
- [ ] アプリアイコン（1024x1024）準備
- [ ] スクリーンショット準備
- [ ] アプリ説明文作成
- [ ] キーワード設定
- [ ] 年齢制限設定
- [ ] 暗号化に関する質問回答

### TestFlight設定
- [ ] ベータ版情報入力
- [ ] テスターグループ作成
- [ ] テスト期間設定（90日）
- [ ] フィードバックメール設定

### ビルド後確認
- [ ] ビルド番号インクリメント
- [ ] エクスポートコンプライアンス
- [ ] ベータ版リリースノート

## トラブルシューティング

### よくある問題
```
Q: "Missing export compliance"エラー
A: App Store Connectで暗号化の使用について回答

Q: ビルドが表示されない
A: 処理に1時間程度かかる場合があります

Q: テスターが招待を受け取れない
A: TestFlightアプリのインストールを確認
```

## 完了条件
- [ ] App Store Connect設定完了
- [ ] TestFlightビルドアップロード成功
- [ ] 内部テスター招待完了
- [ ] 外部テスター承認取得
- [ ] クラッシュレポート確認
- [ ] フィードバック収集開始

## 備考
- ビルド処理には30-45分かかる
- 外部テスター向けは審査が必要（24-48時間）
- TestFlightリンクは90日間有効

## 関連ファイル
- `eas.json` - EAS設定
- `scripts/submit-testflight.sh` - 送信スクリプト
- `docs/testflight-guide.md` - テスターガイド

最終更新: 2025-08-28
