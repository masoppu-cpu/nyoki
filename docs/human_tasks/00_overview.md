# 人間用タスク一覧

## 📌 このフォルダについて

このフォルダは**人間が実行するタスク**を管理します。ClaudeCodeが実行する開発タスクとは別に、人間のみが実行できる外部サービス設定や契約関連のタスクをまとめています。

## 🎯 タスクカテゴリ

1. **外部サービスのアカウント作成・設定** 
   - Supabase、Gemini API、RevenueCat等のアカウント作成
   - APIキーの取得と管理

2. **ビジネス関連**
   - アフィリエイトプログラムの申請
   - 植物販売サイトとの提携
   - App Store/Google Play開発者登録

3. **コンテンツ準備**
   - 植物の画像素材収集
   - 商品データベースの準備
   - 法的文書の作成

4. **テスト・検証**
   - 実機でのテスト
   - ユーザーテストの実施
   - フィードバック収集

## 📋 タスクファイル一覧

| ファイル | 内容 | 優先度 | ステータス |
|---------|------|--------|-----------|
| [01_external_services.md](./01_external_services.md) | 外部サービス設定 | 🔴 高 | 未着手 |
| [02_business_setup.md](./02_business_setup.md) | ビジネス設定 | 🟡 中 | 未着手 |
| [03_content_preparation.md](./03_content_preparation.md) | コンテンツ準備 | 🟡 中 | 未着手 |
| [04_testing_validation.md](./04_testing_validation.md) | テスト・検証 | 🟢 低 | 未着手 |

## ⚠️ 重要な注意事項

- これらのタスクはプログラミング知識不要です
- 各タスクには詳細な手順と参考リンクがあります
- 不明な点はChatGPTやClaudeに質問してください
- **APIキーなどの秘密情報は絶対にGitHubにアップしないでください**

## 🚀 推奨される実行順序

### Phase 0: 今すぐやるべきこと（開発開始前）
1. Supabaseプロジェクト作成
2. GitHub リポジトリの確認
3. Expo アカウント作成

### Phase 1: 開発初期（〜Day 2）
1. Google Cloud Console でGemini API有効化
2. 植物データベースの準備開始
3. 画像アセットの収集開始

### Phase 2: 開発中期（Day 3〜4）
1. Apple Developer Program 登録（審査に時間がかかる）
2. Google Play Developer 登録
3. アフィリエイトプログラム申請開始

### Phase 3: リリース準備（Day 5〜6）
1. RevenueCat アカウント設定
2. OneSignal アカウント設定
3. 利用規約・プライバシーポリシー準備
4. App Store/Google Play 申請準備

## 📝 進捗管理

各ファイル内のチェックボックスを使って進捗を管理してください：
- [ ] 未着手
- [x] 完了

完了したタスクには完了日時をコメントで記載することを推奨します。

例：
```markdown
- [x] Supabaseアカウント作成 <!-- 2025-08-28 完了 -->
```

---

## 🔧 開発作業の基本ルール（Git操作）

### 基本ルール（3つ）
- ブランチは1チケット1本（作業前に切る、終わったらPR）
- リベース禁止（難しい操作なし）→ PR画面の「Update branch」だけ使う
- 小さく進める（小さい変更ごとにコミット＆プッシュ）

### 1回の作業手順（コピペOK）
```bash
# 0) mainに最新を取り込む
git checkout main && git pull

# 1) ブランチ作成（チケットIDに合わせて変える）
git switch -c feat/FE-004-plant-selection

# 2) 変更 → 保存 → コミット
git add -A && git commit -m "[FE-004] 植物カードに検討リストボタン"

# 3) プッシュ
git push -u origin feat/FE-004-plant-selection

# 4) GitHubでPR作成（DraftでもOK）
# 5) 表示/動作を軽く確認 → 問題なければ「Squash and merge」→「Delete branch」
```

### PRの書き方（テンプレ）
- 目的: 何をしたPRか1行
- テスト: チェック1-3個（例: 画面開く/ボタン押せる/エラーなし）
- スクショ: 変化が見える1枚（任意）

### GitHubの最低限設定（最初の1回だけでOK）
- Settings → Branches → Add rule → `main`を保護
  - Require a pull request before merging: ON（レビュー1人でもOK）
  - 他は慣れてきたら設定で十分

---

## 🤖 ClaudeCode（AI）にPRを出させるには？

### 使い方（推奨の流れ）
1) チケットのファイルを指定して依頼（例: `docs/07_fe_plant_selection.md`）
2) Claudeに「このチケット用のブランチ作成→実装→コミット→プッシュ→PR作成」まで依頼
3) できあがったPRを見て、簡単に確認してマージ

### Claudeへの依頼文サンプル
```
チケット FE-004（docs/07_fe_plant_selection.md）を実装用ブランチで対応して、
コミット→プッシュ→PR作成まで行って。小さめのコミットで進めてください。
PR本文はテンプレ準拠、スクショがあれば添付して。
```

困ったらこのページを見て、分からない作業はAIに依頼してください。無理にリベースしない/小さく進める、が大事です。

---

最終更新: 2025-08-28