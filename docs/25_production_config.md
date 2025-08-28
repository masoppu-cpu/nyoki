# チケット #25: 本番環境設定

**タスクID**: DEPLOY-003  
**担当**: Full-stack  
**推定時間**: 3時間  
**依存関係**: [全Phase 1-3タスク, DEPLOY-001, DEPLOY-002]  
**優先度**: 高（Phase 4）

## 概要
本番環境の設定とApp Store/Google Playへの申請準備。最終チェックリスト。

## TODO リスト

- [ ] 環境変数の本番設定
- [ ] セキュリティ設定確認
- [ ] パフォーマンス最適化
- [ ] アプリストア申請準備
- [ ] 利用規約・プライバシーポリシー
- [ ] リリース前最終チェック

## 環境設定

### 本番環境変数（.env.production）
```env
# API URLs（MVPではSupabase Functionsを直接使用し、独自APIは不要）
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SUPABASE_URL=https://prod-xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...

# AI Services
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyxxxxx...

# Payment
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxx...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx...

# Push Notifications
EXPO_PUBLIC_ONESIGNAL_APP_ID=xxxxx-xxxxx-xxxxx

# Analytics
EXPO_PUBLIC_MIXPANEL_TOKEN=xxxxx
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Feature Flags
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
```

### Supabase本番設定
```sql
-- 本番環境のセキュリティ設定
-- RLSを全テーブルで有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- APIレート制限設定
CREATE OR REPLACE FUNCTION check_rate_limit(user_id UUID, action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INT;
  time_window INTERVAL := '1 minute';
  max_requests INT := 60;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM rate_limit_log
  WHERE user_id = $1 
    AND action = $2
    AND created_at > NOW() - time_window;
    
  IF request_count >= max_requests THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO rate_limit_log (user_id, action, created_at)
  VALUES ($1, $2, NOW());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## セキュリティ設定

### APIキー保護方針
- 機密キー（Gemini/RevenueCat/OneSignalの秘密鍵等）はサーバー（Supabase Functions/サービスロール）側に保持。
- クライアントに埋め込むのは公開前提のキー（`EXPO_PUBLIC_*`）のみ。
- Network層のCertificate Pinningは独自API導入時に検討。MVPではSupabase/公式SDKのTLSを信頼。

### コード難読化
```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      mangle: {
        keep_fnames: false,
      },
      compress: {
        drop_console: true, // console.log削除
      },
    },
  },
};
```

## パフォーマンス最適化

### アプリサイズ削減
```json
// app.json
{
  "expo": {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    },
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

### 画像最適化
```bash
# 画像圧縮スクリプト
#!/bin/bash
# scripts/optimize-images.sh

# PNGファイル最適化
find assets -name "*.png" -exec pngquant --quality=65-80 {} \;

# JPEGファイル最適化
find assets -name "*.jpg" -exec jpegoptim --size=100k {} \;

# WebP変換（オプション）
find assets -name "*.png" -exec cwebp {} -o {}.webp \;
```

## App Store申請準備

### アプリ情報
```yaml
アプリ名: nyoki - 植物と暮らす
サブタイトル: AIが選ぶ、あなたの部屋に最適な植物
カテゴリ: ライフスタイル
年齢制限: 4+

キーワード:
  - 観葉植物
  - インテリア
  - AI
  - 植物管理
  - 水やり
  - グリーン
  - 癒し

説明文:
nyokiは、AIがあなたの部屋を分析して、
最適な観葉植物を提案するアプリです。

【主な機能】
• 部屋を撮影するだけでAIが環境を分析
• Before/Afterで配置イメージを確認
• 水やりリマインダーで枯らさない
• 厳選された植物をアプリから購入可能

【こんな方におすすめ】
• 植物を育てたいけど何を選べばいいか分からない
• 部屋に合う植物を知りたい
• 植物を枯らしてしまった経験がある
• インテリアとして植物を楽しみたい

## Auto-PR（Claude用）

目的:
- 本番設定（env/セキュリティ/最適化/申請準備）の最小構成をPR化

ブランチ:
- feat/<TICKET-ID>-production-config

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] 本番envで起動
- [ ] 機密キーがクライアントに露出しない

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-production-config
git add -A && git commit -m "[<TICKET-ID}] add production config"
git push -u origin feat/<TICKET-ID>-production-config
gh pr create --fill --base main --head feat/<TICKET-ID>-production-config
```
```

### スクリーンショット要件
```
iPhone 6.7" (1290 x 2796)
iPhone 6.5" (1242 x 2688)
iPhone 5.5" (1242 x 2208)
iPad Pro 12.9" (2048 x 2732)

各サイズ5枚以上のスクリーンショット：
1. ホーム画面
2. カメラ撮影
3. AI分析結果
4. 植物選択
5. Before/After
```

### App Store Reviewガイドライン対応
```
✅ 4.1 コンテンツの複製禁止
✅ 4.2 最小限の機能性
✅ 4.3 スパムの禁止
✅ 5.1 プライバシー
  - プライバシーポリシー必須
  - データ使用目的の明示
✅ 5.2 知的財産権
✅ 5.6 Developer Code of Conduct
```

## Google Play申請準備

### ストア掲載情報
```yaml
アプリ名: nyoki - AI植物アドバイザー
簡単な説明: AIが部屋を分析して最適な植物を提案
詳細な説明: |
  nyokiで、あなたの部屋に緑の癒しを。
  
  撮影するだけで、AIが部屋の環境を分析。
  光量、湿度、温度から最適な植物を提案します。
  
  [以下App Storeと同様]

コンテンツのレーティング:
  - 全ユーザー対象
  - 広告なし
  - アプリ内購入あり
```

### 必要なアセット
```
アイコン: 512x512 PNG
フィーチャーグラフィック: 1024x500
スクリーンショット: 最小2枚、最大8枚
```

## 法的文書

### 利用規約
```markdown
# nyoki 利用規約

最終更新日: 2025年9月1日

## 1. サービスの提供
...

## 2. ユーザーの責任
...

## 3. 有料サービス
...

## 4. 免責事項
...
```

### プライバシーポリシー
```markdown
# nyoki プライバシーポリシー

## 収集する情報
- アカウント情報（メールアドレス）
- 部屋の画像（AI分析用）
- 使用状況データ

## 情報の使用目的
- サービスの提供
- サービスの改善
- カスタマーサポート

## 第三者への提供
原則として第三者への提供は行いません
```

## リリース前チェックリスト

### 機能テスト
- [ ] 全画面遷移の確認
- [ ] オフライン時の動作確認
- [ ] 課金フローのテスト
- [ ] プッシュ通知のテスト
- [ ] クラッシュしないことの確認

### パフォーマンステスト
- [ ] 起動時間3秒以内
- [ ] 画面遷移スムーズ
- [ ] メモリリークなし
- [ ] バッテリー消費適正

### セキュリティテスト
- [ ] APIキーの難読化
- [ ] HTTPSのみ使用
- [ ] 個人情報の暗号化
- [ ] SQLインジェクション対策

### ストア申請
- [ ] アプリアイコン設定
- [ ] スクリーンショット準備
- [ ] 説明文の翻訳（英語）
- [ ] 動画プレビュー作成（オプション）

### 法的確認
- [ ] 利用規約の設置
- [ ] プライバシーポリシーの設置
- [ ] 特定商取引法に基づく表記
- [ ] 著作権表記

## デプロイコマンド

### 最終ビルド
```bash
# iOS本番ビルド
eas build --platform ios --profile production

# Android本番ビルド  
eas build --platform android --profile production

# 両プラットフォーム
eas build --platform all --profile production
```

### ストア送信
```bash
# App Store
eas submit --platform ios --latest

# Google Play
eas submit --platform android --latest
```

## リリース後の監視

### 監視項目
```typescript
// src/services/monitoring.ts
import * as Sentry from 'sentry-expo';
import Analytics from '@segment/analytics-react-native';

export const monitoring = {
  // エラー監視
  logError: (error: Error, context?: any) => {
    Sentry.captureException(error, { extra: context });
  },
  
  // パフォーマンス監視
  trackPerformance: (metric: string, value: number) => {
    Analytics.track('Performance', { metric, value });
  },
  
  // ユーザー行動分析
  trackEvent: (event: string, properties?: any) => {
    Analytics.track(event, properties);
  },
};
```

## 完了条件
- [ ] 本番環境変数設定完了
- [ ] セキュリティ設定完了
- [ ] パフォーマンス最適化完了
- [ ] App Store申請準備完了
- [ ] Google Play申請準備完了
- [ ] 法的文書準備完了

## 備考
- 申請から承認まで1-2週間
- リジェクト対応の準備
- ローンチ後の緊急対応体制

## 関連ファイル
- `.env.production` - 本番環境変数
- `docs/privacy-policy.md` - プライバシーポリシー
- `docs/terms-of-service.md` - 利用規約
- `scripts/deploy.sh` - デプロイスクリプト

最終更新: 2025-08-28
