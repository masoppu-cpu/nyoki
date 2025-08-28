# チケット #23: EAS Build設定

**タスクID**: DEPLOY-001  
**担当**: Full-stack  
**推定時間**: 3時間  
**依存関係**: [全Phase 1-3タスク完了]  
**優先度**: 高（Phase 4）

## 概要
EAS Buildを設定し、iOS先行でTestFlight向けのビルドを作成（Androidは後日）。

## TODO リスト

- [ ] EAS CLI インストール
- [ ] Expo アカウント作成・ログイン
- [ ] eas.json 設定
- [ ] App Store Connect設定
- [ ] Google Play Console設定
- [ ] ビルド実行
- [ ] 署名設定

## EAS CLI セットアップ

### インストールとログイン
```bash
# EAS CLI インストール
npm install -g eas-cli

# ログイン
eas login

# プロジェクトリンク
eas build:configure
```

## eas.json 設定（iOS先行）

### 設定ファイル作成
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://staging-api.nyoki.app"
      }
    },
    "production": {
      "ios": {
        "cocoapods": "1.14.2",
        "resourceClass": "m-medium"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.nyoki.app",
        "EXPO_PUBLIC_USE_MOCK": "false"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "nyoki@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
```

## app.json 更新

### iOS/Android固有設定
```json
{
  "expo": {
    "name": "nyoki",
    "slug": "nyoki",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#48BB78"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.nyoki.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "お部屋を撮影して、最適な植物をご提案します",
        "NSPhotoLibraryUsageDescription": "お部屋の写真を選択して、最適な植物をご提案します"
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    
    "plugins": [
      "expo-camera",
      "expo-image-picker",
      [
        "react-native-purchases",
        {
          "iosApiKey": "$REVENUECAT_IOS_KEY"
        }
      ],
      [
        "onesignal-expo-plugin",
        {
          "mode": "production"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "xxxxx-xxxxx-xxxxx"
      }
    }
  }
}
```

## 証明書・署名設定

### iOS証明書
```bash
# 自動管理（推奨）
eas credentials

# 選択:
# - Keychain: Expo管理
# - Distribution Certificate: 自動作成
# - Provisioning Profile: 自動作成
```

### Android署名
```bash
# Upload Keystore自動生成
eas credentials

# 選択:
# - Keystore: Expo管理
# - 自動生成を選択
```

## ビルド実行

### 開発ビルド
```bash
# iOS開発ビルド
eas build --platform ios --profile development

# Android開発ビルド
eas build --platform android --profile development
```

### 本番ビルド
```bash
# iOS本番ビルド
eas build --platform ios --profile production

# Android本番ビルド
eas build --platform android --profile production

# 両プラットフォーム同時
eas build --platform all --profile production
```

## 環境変数（Secrets）

### EAS Secrets設定
```bash
# 環境変数設定
eas secret:create --name SUPABASE_URL --value "https://xxxxx.supabase.co"
eas secret:create --name SUPABASE_ANON_KEY --value "eyJxxxxx..."
eas secret:create --name GEMINI_API_KEY --value "AIzaSyxxxxx..."
eas secret:create --name REVENUECAT_IOS_KEY --value "appl_xxxxx..."
eas secret:create --name REVENUECAT_ANDROID_KEY --value "goog_xxxxx..."
eas secret:create --name ONESIGNAL_APP_ID --value "xxxxx..."

# 確認
eas secret:list
```

## ビルド最適化

### アプリサイズ削減
```json
// metro.config.js
module.exports = {
  transformer: {
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
};
```

### Hermesエンジン有効化
```json
// app.json
{
  "expo": {
    "android": {
      "jsEngine": "hermes"
    },
    "ios": {
      "jsEngine": "hermes"
    }
  }
}
```

## ビルド確認

### ビルドステータス
```bash
# ビルド一覧
eas build:list

# ビルド詳細
eas build:view <build-id>

# ビルドキャンセル
eas build:cancel <build-id>
```

### ビルドダウンロード
```bash
# QRコード表示（内部配信）
eas build:view <build-id> --platform ios

# APK/IPA直接ダウンロード
# EAS DashboardからダウンロードリンクをGET取得
```

## トラブルシューティング

### よくあるエラー
```bash
# キャッシュクリア
eas build --clear-cache

# ローカルでのビルドテスト
eas build --local

# ビルドログ確認
eas build:view <build-id> --json
```

## 完了条件
- [ ] EAS CLI設定完了
- [ ] eas.json作成完了
- [ ] 証明書設定完了
- [ ] 開発ビルド成功
- [ ] 本番ビルド成功
- [ ] 内部テスト配信確認

## 次のステップ
- [24_testflight_deploy.md] - TestFlightデプロイ
- [25_production_config.md] - 本番環境設定

## 備考
- 初回ビルドは30-45分かかる
- 無料枠: 月30ビルドまで
- ビルドリソースクラスで速度調整可能

## 関連ファイル
- `eas.json` - EAS設定（要作成）
- `app.json` - Expo設定（✅更新済み）
- `.easignore` - EASビルド除外設定（必要に応じて）

最終更新: 2025-08-28（iOS先行、Androidは後日）

## Auto-PR（Claude用）

目的:
- EAS Buildの最小設定（Dev Client含む）を追加しPR作成

ブランチ:
- feat/<TICKET-ID>-eas-build

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] eas build -p ios が通る
- [ ] Dev Clientで動作

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-eas-build
git add -A && git commit -m "[<TICKET-ID}] add eas build config"
git push -u origin feat/<TICKET-ID>-eas-build
gh pr create --fill --base main --head feat/<TICKET-ID>-eas-build
```
