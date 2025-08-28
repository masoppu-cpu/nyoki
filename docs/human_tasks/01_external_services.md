# 外部サービス設定タスク

**優先度**: 🔴 高（開発をスムーズに進めるために最優先）  
**所要時間**: 各15-30分程度  

## 1. Supabase設定 【最優先】

### アカウント作成
- [ ] [Supabase](https://supabase.com/)にアクセス
- [ ] GitHubアカウントでサインアップ（推奨）
- [ ] メール認証を完了

### プロジェクト作成
- [ ] 「New Project」をクリック
- [ ] プロジェクト名: `nyoki-prod`（本番用）
- [ ] データベースパスワード: **安全な場所に保存**
- [ ] Region: `Northeast Asia (Tokyo)` を選択
- [ ] Free プランで作成

### APIキー取得
- [ ] Settings → API からキー情報を取得
- [ ] 以下の情報をメモ：
  ```
  Project URL: https://xxxxx.supabase.co
  Anon Key: eyJxxxxx...
  Service Role Key: eyJxxxxx... （秘密！）
  ```

### 環境変数設定
- [ ] プロジェクトルートに `.env.local` ファイル作成
- [ ] 以下を記入：
  ```env
  EXPO_PUBLIC_SUPABASE_URL=取得したProject URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY=取得したAnon Key
  ```
- [ ] `.gitignore` に `.env.local` が含まれていることを確認

---

## 2. Google Gemini API設定

### Google Cloud Console設定
- [ ] [Google Cloud Console](https://console.cloud.google.com/)にアクセス
- [ ] Googleアカウントでログイン
- [ ] 新しいプロジェクト作成: `nyoki-app`
- [ ] 請求アカウント設定（無料枠あり）

### Gemini API有効化
- [ ] [Vertex AI Studio](https://makersuite.google.com/)にアクセス
- [ ] 「Get API Key」をクリック
- [ ] APIキーを生成
- [ ] APIキーを `.env.local` に追加：
  ```env
  EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyxxxxx...
  ```

### 使用制限設定（推奨）
- [ ] APIキーの使用制限を設定
- [ ] 月額上限を設定（例: $10）
- [ ] IPアドレス制限（本番環境のみ）

---

## 3. Expo設定

### Expoアカウント作成
- [ ] [Expo](https://expo.dev/)でアカウント作成
- [ ] メール認証を完了
- [ ] ユーザー名を設定

### Expo CLIログイン
- [ ] ターミナルで以下を実行：
  ```bash
  npx expo login
  ```
- [ ] ユーザー名とパスワードを入力
- [ ] ログイン成功を確認

### EAS設定（後で必要になります）
- [ ] プロジェクトオーナーを設定
  ```bash
  npx eas init
  ```
- [ ] プロジェクトIDが生成されることを確認

---

## 4. GitHub設定確認

### リポジトリ確認
- [ ] https://github.com/masoppu-cpu/nyoki.git が正しく設定されているか確認
- [ ] プライベートリポジトリになっているか確認
- [ ] README.mdが表示されるか確認

### Secrets設定（CI/CD用・後で設定）
- [ ] Settings → Secrets and variables → Actions
- [ ] 以下のSecretsを後で追加予定：
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
  - `EXPO_TOKEN`

---

## 5. 開発ツール準備

### Expo Goアプリ
- [ ] スマートフォンに [Expo Go](https://expo.dev/client) をインストール
- [ ] iOSの場合: App Store から
- [ ] Androidの場合: Google Play から
- [ ] アプリを開いてログイン

### VSCode拡張機能（推奨）
- [ ] React Native Tools
- [ ] ES7+ React/Redux/React-Native snippets
- [ ] Prettier - Code formatter
- [ ] ESLint

---

## ⚠️ セキュリティチェックリスト

### 絶対にGitHubにアップしないもの
- [ ] `.env.local` ファイル
- [ ] `.env.production` ファイル
- [ ] Service Role Key
- [ ] 個人情報を含むファイル

### 安全な管理方法
- [ ] パスワードマネージャー使用（1Password, Bitwarden等）
- [ ] APIキーは定期的に更新
- [ ] 不要なAPIキーは削除

---

## 📝 完了後の確認

すべて完了したら、以下を確認：

1. **Supabase**
   - [ ] プロジェクトダッシュボードにアクセスできる
   - [ ] APIキーが `.env.local` に設定されている

2. **Gemini API**
   - [ ] APIキーが取得できている
   - [ ] `.env.local` に設定されている

3. **Expo**
   - [ ] CLIでログインできている
   - [ ] Expo Goアプリがインストール済み

4. **GitHub**
   - [ ] コードがpushされている
   - [ ] `.env.local` がアップされていない

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