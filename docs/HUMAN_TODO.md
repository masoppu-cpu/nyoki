# HUMAN TODO: 開発の進め方（超シンプル版）

非エンジニアでも運用できる最小ルールだけに絞っています。迷ったらこのページ通りに進めればOKです。

## 基本ルール（3つ）
- ブランチは1チケット1本（作業前に切る、終わったらPR）。
- リベース禁止（難しい操作なし）→ PR画面の「Update branch」だけ使う。
- 小さく進める（小さい変更ごとにコミット＆プッシュ）。

## 1回の作業手順（コピペOK）
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

## PRの書き方（テンプレ）
- 目的: 何をしたPRか1行
- テスト: チェック1-3個（例: 画面開く/ボタン押せる/エラーなし）
- スクショ: 変化が見える1枚（任意）

例:
```
目的: 植物カードに「検討リストへ」を追加
テスト:
- [ ] 植物一覧からボタン押下でトースト表示
- [ ] 画面遷移/エラーなし
スクショ: （画像1枚）
```

## コンフリクトを避ける簡単ワザ
- なるべくファイル名の大規模リネームはしない（必要なら別PRに分ける）
- PR作成後に「Update branch」だけ押す（わからなければそのままでもOK）
- コンフリクトが出たら、解消はエンジニア/AIに依頼（このPRに書けばOK）

## GitHubの最低限設定（最初の1回だけでOK）
- Settings → Branches → Add rule → `main`を保護
  - Require a pull request before merging: ON（レビュー1人でもOK）
  - 他は慣れてきたら設定で十分

---

## ClaudeCode（AI）にPRを出させるには？

Claudeに「チケットを実装してPRを作って」と依頼すれば、次の手順で進められます。

### 使い方（推奨の流れ）
1) チケットのファイルを指定して依頼（例: `docs/07_fe_plant_selection.md`）。
2) Claudeに「このチケット用のブランチ作成→実装→コミット→プッシュ→PR作成」まで依頼。
3) できあがったPRを見て、簡単に確認してマージ。

### 実行コマンド（Claudeが使う想定）
```bash
# ブランチ作成
git switch -c feat/FE-004-plant-selection

# 変更反映（AIがファイル編集）
git add -A && git commit -m "[FE-004] implement plant selection purchase list"

# プッシュ
git push -u origin feat/FE-004-plant-selection

# PR作成（GitHub CLIが使える場合）
gh pr create --fill --base main --head feat/FE-004-plant-selection
```

GitHub CLI（`gh`）が無い場合は、AIがPR作成用のURLを提示するか、PR作成方法を案内します。

### Claudeへの依頼文サンプル
```
チケット FE-004（docs/07_fe_plant_selection.md）を実装用ブランチで対応して、
コミット→プッシュ→PR作成まで行って。小さめのコミットで進めてください。
PR本文はテンプレ準拠、スクショがあれば添付して。
```

---

困ったらこのページを見て、分からない作業はAIに依頼してください。無理にリベースしない/小さく進める、が大事です。

## MCP（任意機能）について

- 目的: Claudeが「Supabaseのスキーマ確認・軽いクエリ実行・RLSの挙動チェック」を安全に行うための接続です。
- 前提: アプリ実装は従来通り `@supabase/supabase-js` と Edge Functions を使用（MCPは開発補助であり必須ではありません）。
- 設定: `.mcp.json` に Supabase MCP サーバーを追加（`--project-ref` と `SUPABASE_ACCESS_TOKEN`）。本番用の秘密は直書きしない。
- 使い方例（Claudeへの指示）:
  - 「MCP経由で`profiles`テーブルのRLSを確認して」
  - 「最新のマイグレーション適用後、`purchase_items`の件数を数えて」
- 注意: MCPが無くても全タスクは進められます。設定済みならClaudeが自動で活用します。
