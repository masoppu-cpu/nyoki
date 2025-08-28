# 外部サービス設定タスク

**優先度**: 🔴 高（開発をスムーズに進めるために最優先）  
**所要時間**: 各15-30分程度  

## 1. Supabase設定 【最優先】

### アカウント作成
- [×] [Supabase](https://supabase.com/)にアクセス
- [×] GitHubアカウントでサインアップ（推奨）
- [×] メール認証を完了

### プロジェクト作成
- [×] 「New Project」をクリック
- [×] プロジェクト名: `nyoki_mobile_app`（本番用）
- [×] データベースパスワード: **安全な場所に保存**
- [×] Region: `Northeast Asia (Tokyo)` を選択
- [×] Free プランで作成

### APIキー取得
- [×] Settings → API からキー情報を取得
- [×] 以下の情報をメモ：
  ```
  Project URL: https://xxxxx.supabase.co
  Anon Key: eyJxxxxx...
  Service Role Key: eyJxxxxx... （秘密！）
  ```

### 環境変数設定
- [×] プロジェクトルートに `.env.local` ファイル作成
- [×] 以下を記入：
  ```env
  EXPO_PUBLIC_SUPABASE_URL=取得したProject URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY=取得したAnon Key
  ```
- [×] `.gitignore` に `.env.local` が含まれていることを確認

---

## 2. Google Gemini API設定 【画像生成に必須（本番は後日最適化）】

### APIキー取得
- [×] [Google AI Studio](https://aistudio.google.com/app/apikey)にアクセス
- [×] Googleアカウントでログイン
- [×] 「Get API Key」をクリック
- [×] `AIzaSy...` で始まるキーをコピー

### 課金設定（重要！）
- [×] [Google Cloud Console](https://console.cloud.google.com)にアクセス
- [×] **課金アカウント作成**:
  - 左メニュー → 「お支払い」
  - 「アカウントを作成」
  - アカウント名: `nyoki-production`
  - 国: 日本、通貨: JPY
  - クレジットカード情報を入力
  - 「送信して課金を有効にする」
- [×] **プロジェクトに紐付け**:
  - プロジェクト選択または新規作成
  - 「お支払いアカウントをリンク」
- [×] **APIを有効化**:
  - 「APIとサービス」→「ライブラリ」
  - 「Generative Language API」を検索
  - 「有効にする」をクリック

### Supabase環境変数設定
- [×] Supabase Dashboard → Settings → Edge Functions → Secrets
- [×] 以下を追加：
  ```
  GEMINI_API_KEY=AIzaSy...（コピーしたキー）
  ```

### 料金情報
- **画像生成**: 1枚 $0.039（約6円）
- **MVP想定**: 月100回で約600円
- **初回特典**: $300クレジット（約5,000枚分！）

### 予算アラート設定（推奨）
- [×] Google Cloud Console → 「予算とアラート」
- [×] 「予算を作成」
- [×] 設定例:
  - 名前: `nyoki-monthly`
  - 金額: ¥3,000（月額）
  - アラート: 50%, 90%, 100%

---

## 3. Expo/EAS設定（iOS先行・TestFlight配布）

### Expoアカウント作成
- [×] [Expo](https://expo.dev/)でアカウント作成
- [×] メール認証を完了
- [×] ユーザー名を設定

### Expo CLIログイン
- [×] ターミナルで以下を実行：
  ```bash
  npx expo login
  ```
- [×] ユーザー名とパスワードを入力
- [×] ログイン成功を確認

### EAS設定（Dev Client→TestFlightの順で）
- [×] プロジェクトオーナーを設定
  ```bash
  npx eas init
  ```
 - [×] プロジェクトIDが生成されることを確認
 - [×] iOS向けにDev/Preview/Productionプロファイルを用意（eas.json）
 - [×] TestFlight配布に必要なApple情報（Apple ID/Team ID）を準備

### テスト配布の流れ（概要）
1) `npm run build:ios:dev` で開発用Dev Clientを作成→実機で起動確認
2) `npm run build:ios:preview` で内部配布用ビルド→TestFlightでチーム内確認
3) `npm run build:ios:prod` で申請用ビルド→提出

---

## 4. GitHub設定確認（安全運用）

### リポジトリ確認
- [×] https://github.com/masoppu-cpu/nyoki.git が正しく設定されているか確認
- [×] プライベートリポジトリになっているか確認
- [×] README.mdが表示されるか確認

### Secrets設定（必要に応じて）
- [×] Settings → Secrets and variables → Actions
- [×] 以下のSecretsを後で追加予定：
  - `EXPO_TOKEN`（EASの自動ビルド用・任意）
  - `SENTRY_DSN` / `MIXPANEL_TOKEN`（任意・あれば）

---

## 5. 開発ツール準備

### Expo Goアプリ
- [×] スマートフォンに [Expo Go](https://expo.dev/client) をインストール
- [×] iOSの場合: App Store から
- [×] Androidの場合: Google Play から
- [×] アプリを開いてログイン

### VSCode拡張機能（推奨）
- [×] React Native Tools
- [×] ES7+ React/Redux/React-Native snippets
- [×] Prettier - Code formatter
- [×] ESLint

---

## ⚠️ セキュリティチェックリスト

### 絶対にGitHubにアップしないもの
- [×] `.env.local` ファイル
- [×] `.env.production` ファイル
- [×] Service Role Key
- [×] 個人情報を含むファイル

### 安全な管理方法
- [×] パスワードマネージャー使用（1Password, Bitwarden等）
- [×] APIキーは定期的に更新
- [×] 不要なAPIキーは削除

---

## 📝 完了後の確認

すべて完了したら、以下を確認：

1. **Supabase**
   - [×] プロジェクトダッシュボードにアクセスできる
   - [×] APIキーが `.env.local` に設定されている

2. **Gemini API**
   - [×] APIキーが取得できている
   - [×] `.env.local` に設定されている

3. **Expo**
   - [×] CLIでログインできている
   - [×] Expo Goアプリがインストール済み

4. **GitHub**
   - [×] コードがpushされている
   - [×] `.env.local` がアップされていない

---

## 🆘 トラブルシューティング

### Supabaseプロジェクトが作成できない
- 無料枠は2プロジェクトまで
- 不要なプロジェクトを削除

### Gemini APIキーが取得できない
- 請求アカウントの設定が必要
- クレジットカード登録（無料枠あり）

### Expo loginが失敗する
- ユーザー名（メールアドレスではない）でログイン
- パスワードリセットを試す

---

## 📚 参考リンク

- [Supabase Docs](https://supabase.com/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native 環境構築](https://reactnative.dev/docs/environment-setup)

---

最終更新: 2025-08-28
