# nyoki - AI-Powered Plant Placement App

AI画像合成で部屋に植物を配置確認できる植物管理アプリ

## 概要

nyokiは、AIを活用して自分の部屋に植物を配置した様子を事前に確認できる革新的な植物管理アプリです。写真を撮るだけで、AIが部屋の環境を分析し、最適な植物を提案。実際に配置した様子をビジュアライズして見せてくれます。

## 主な機能

- 📸 **部屋撮影 & AI分析**: カメラで部屋を撮影すると、AIが光量や空間を分析
- 🌿 **最適な植物提案**: 部屋の環境に合った植物を自動提案
- 🎨 **Before/After表示**: スライダーで植物配置前後を比較確認
- 📅 **植物管理**: 水やりリマインダーと成長記録
- 🛒 **ショップ機能**: 提案された植物をそのまま購入可能
- 💎 **フリーミアム**: 無料で5つまで、月額480円で無制限

## 技術スタック

- **Frontend**: React Native + Expo + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini Flash API
- **Payment**: RevenueCat (Phase 2)
- **Push**: OneSignal (Phase 2)

## セットアップ

### 必要要件

- Node.js 18+
- npm or yarn
- Expo CLI
- Expo Go app (iOS/Android)

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localに必要なAPIキーを設定
```

### 開発サーバーの起動

```bash
# Expo開発サーバーを起動
npm start

# または特定のプラットフォームで起動
npm run ios     # iOS
npm run android # Android
npm run web     # Web
```

## プロジェクト構造

```
nyoki/
├── src/
│   ├── screens/        # 画面コンポーネント
│   ├── components/     # 再利用可能なコンポーネント
│   ├── services/       # API・ビジネスロジック
│   ├── hooks/          # カスタムフック
│   ├── types/          # TypeScript型定義
│   ├── styles/         # スタイル定義
│   └── config/         # 設定ファイル
├── assets/             # 画像・アイコン
├── docs/               # ドキュメント
└── App.tsx             # エントリーポイント
```

## 開発ガイドライン

### コード規約

- TypeScript厳密モードを使用
- 関数コンポーネントを使用
- エラーハンドリングを必須とする
- コードはシンプルに保つ

### コミット規約

- feat: 新機能
- fix: バグ修正
- docs: ドキュメント
- style: コードスタイル
- refactor: リファクタリング
- test: テスト
- chore: その他

## ライセンス

© 2025 nyoki. All rights reserved.

## サポート

問題が発生した場合は、GitHubのIssueにて報告してください。