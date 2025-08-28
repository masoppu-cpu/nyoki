# nyoki プロジェクト構造

## 技術スタック
- **Frontend**: React Native + Expo SDK 51 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)  
- **AI**: Google Gemini Flash API
- **State**: React Context API

## ディレクトリ構造
```
src/
├── types/        # TypeScript型定義
├── config/       # 設定・定数
├── screens/      # 画面コンポーネント (4画面実装済み)
│   ├── HomeScreen.tsx
│   ├── CameraScreen.tsx
│   ├── AnalysisScreen.tsx
│   └── RecommendationScreen.tsx
├── components/   # 共通コンポーネント
│   ├── TabBar.tsx
│   ├── PlantCard.tsx
│   ├── PlantDetailModal.tsx
│   └── BeforeAfterSlider.tsx
├── hooks/        # カスタムフック
│   ├── useAuth.ts
│   ├── usePlants.ts
│   └── useSubscription.ts
├── services/     # ビジネスロジック
│   ├── auth.ts
│   ├── ai.ts
│   ├── plants.ts
│   └── subscription.ts
└── data/         # モックデータ

docs/             # チケット仕様書 (26ファイル)
```

## 実装状況
- 基本的なUIフレームワークは構築済み
- 4つの主要画面実装済み
- モックデータで動作確認可能
- Supabase/AI統合用のサービス層準備済み
- TODOコメントなし（クリーンな状態）

## Git状態
- ブランチ: main
- 変更ファイル: 主にdocs配下のチケット仕様書
- 新規ファイル: .github/, .serena/, docs/HUMAN_TODO.md, mise.toml