---
allowed-tools: Read, Glob, Grep, LS, Edit, MultiEdit, Write, Bash, TodoWrite, Task, WebSearch, mcp__serena__check_onboarding_performed, mcp__serena__list_dir, mcp__serena__read_file, mcp__serena__search_for_pattern, mcp__serena__get_symbols_overview, mcp__serena__find_symbol, mcp__serena__execute_shell_command, mcp__serena__write_memory, mcp__serena__read_memory, mcp__serena__list_memories, mcp__supabase__list_tables, mcp__supabase__execute_sql, mcp__supabase__get_logs, mcp__supabase__get_advisors
description: nyokiプロジェクト専用のチケット実装→PR作成自動化コマンド
---

# nyoki-pr: チケット駆動開発＆自動PR作成コマンド

このコマンドは、nyokiプロジェクトのチケット（docs/配下）を1つずつ実装し、Git操作からPR作成まで自動化します。
指示者は非エンジニアのため、技術的な判断は平易に説明して確認を取ります。

## 使用例

```bash
/nyoki-pr                           # チケット選択から開始
/nyoki-pr FE-001                   # 特定チケットを実装
/nyoki-pr FE-001 --check           # 実装前の影響調査のみ
/nyoki-pr FE-001 --no-pr           # PR作成をスキップ
```

## 重要: Serena MCPの活用

このコマンドは **必ず /serena コマンドと連携** して実行されます:

1. **実装前の深層分析**: `/serena -d` (10-15の思考ステップ)
2. **実装中の深層モード**: `/serena -d` で慎重な実装
3. **実装後のコードレビュー**: `/serena -c` で品質確認

## ワークフロー

### 1. チケット特定
```
1. チケット番号が指定されていない場合、実装可能なチケットを提示
2. docs/<ticket-id>_*.md を読み込み、内容・完了条件を確認
3. 98_Resources/01_MVPの参照資料とCLAUDE.mdを確認
```

### 2. 影響調査（/serena -d で深層分析）
```
🔍 /serena -d を使用した深層モード分析:
- プロジェクト全体を俯瞰した影響調査
- 依存関係の確認（他チケットとの関連）
- APIキー/環境変数の必要性
- データベーススキーマとの整合性
- 既存コードとの競合リスク
- ボトルネック（指示者対応が必要な項目）

⚠️ ボトルネックがある場合:
- 一覧化して平易に説明
- 解消方法を具体的に提示
- 指示者の確認を待つ

実行コマンド例:
/serena "FE-001チケットの実装影響調査" -d
```

### 3. Git ブランチ作成
```bash
# 自動実行されるコマンド
git checkout main && git pull
git switch -c feat/<TICKET-ID>-<short-desc>

# 例: feat/FE-004-plant-selection
```

### 4. 実装（/serena -d で深層実装）
```
🛠️ /serena -d を使用した深層モード実装:
- 10-15の思考ステップで慎重に実装
- 複雑な依存関係を考慮した設計
- エッジケースの事前検討

実装原則:
- 98/01は参照のみ（直接依存しない）
- assetsはプロジェクト内にコピー
- 小さくコミット（1コミット=1意図）
- コミットメッセージ: [<TICKET-ID>] 変更内容

実装時の確認:
- 仕様の選択肢がある場合→即座に提示して確認
- 用語の統一（購入検討リスト、配置プレビュー等）
- セキュリティ（トークン、Storage公開設定）

実行コマンド例:
/serena "FE-001 植物選択画面の実装" -d
```

### 5. 品質チェック（/serena -c でコードレビュー）
```
🔎 /serena -c を使用したコード分析:
- 実装後の品質確認
- パフォーマンス最適化の提案
- セキュリティ脆弱性の検出

チェック項目:
✓ 98/references・CLAUDE.mdとの整合性
✓ 完了条件を満たしているか
✓ セキュリティ（秘密情報の混入なし）
✓ コード品質（重複・冗長性）
✓ 他チケットとの整合性
✓ lint/typecheck（利用可能な場合）
✓ docs/common-issues/の既知問題チェック

重複ファイル検出:
- 類似コンポーネント名をチェック
- 同一機能の複数実装を検出
- 例: PlantList.tsx vs PlantsList.tsx
      useAuth.ts vs useAuthentication.ts

🚨 よくあるミスの事前チェック:
- docs/common-issues/配下のパターンを参照
- 該当する問題がないか自動チェック
- 修正提案を表示

実行コマンド例:
/serena "実装完了後のコードレビュー" -c
```

### 6. Push前の整合性確認（/serena -d で深層分析）
```
🔍 /serena -d を使用した深層モードで整合性確認:
整理チェック項目:
1. 重複ファイルの検出・削除
   - 同じ用途の複数ファイル
   - 似た名前のコンポーネント
   - 不要なテスト/一時ファイル

2. よくあるミスの最終チェック
   - docs/common-issues/全ファイルを参照
   - 実装内容との照合
   - 該当する問題の修正確認

3. チケットTODO更新
   - docs/<ticket-id>_*.mdのチェックボックス
   - 完了項目に✅を付与
   - 関連チケットの状態更新

4. ドキュメント同期
   - CLAUDE.md の更新（必要時）
   - docs/HUMAN_TODO.md の更新
   - docs/common-issues/への新規パターン追加（必要時）
   - README.md の整合性

5. コードベース整頓
   - 未使用importの削除
   - console.logの削除
   - コメントアウトコードの削除
   - 一時ファイルの削除

確認コマンド:
- git status --ignored
- find . -name "*.tmp" -o -name "*~"
- grep -r "console.log" src/
- ls docs/common-issues/*.md  # 既知問題の確認
```

### 7. PR作成（/serena で実行）
```bash
# /serena を使用してPR作成を実行
# 整合性確認後に実行
git push -u origin feat/<TICKET-ID>-<short-desc>

# GitHub CLI使用（利用可能な場合）
gh pr create --fill --base main

# PR本文は自動生成:
- 目的（チケット内容）
- 変更内容
- テスト手順
- スクリーンショット（該当時）
```

## オプション

| オプション | 説明 | 使用例 |
|-----------|------|--------|
| `--check` | 影響調査のみ実行 | `/nyoki-pr FE-001 --check` |
| `--no-pr` | PR作成をスキップ | `/nyoki-pr FE-001 --no-pr` |
| `--quick` | 簡易チェックモード | `/nyoki-pr FE-001 --quick` |
| `--verbose` | 詳細ログ表示 | `/nyoki-pr FE-001 --verbose` |

## 重要なルール

### 必須遵守事項
- **98/01への依存禁止**: assetsは必ずコピー
- **秘密情報の扱い**: .env/トークンはコミットしない
- **仕様変更は確認**: 独断での変更禁止
- **用語統一**: チケット記載の用語を使用

### コミット規約
```
[<TICKET-ID>] 簡潔な変更内容
例: [FE-004] implement plant selection screen
例: [BE-002] add users API endpoint
```

### セキュリティチェック項目
- APIキー・トークンの直書き禁止
- Supabase Storageの公開/非公開設定
- Authorization headerの正しい使用
- 環境変数の適切な管理

## トラブルシューティング

### よくある問題と対処

**環境変数が未設定**
```
→ .env.exampleを作成して必要な環境変数を明示
→ 指示者に設定依頼
```

**依存チケットが未完了**
```
→ 依存関係を説明
→ 実装順序の提案
```

**MCPエラー**
```
→ MCP接続は任意（開発補助）
→ 実装はsupabase-js/Edge Functionsで継続
```

## 実行フロー

```mermaid
graph TD
    A[チケット特定] --> B[/serena -d で影響調査]
    B --> C{ボトルネック?}
    C -->|あり| D[指示者確認]
    C -->|なし| E[ブランチ作成]
    D --> E
    E --> F[/serena -d で実装]
    F --> G[/serena -c で品質チェック]
    G --> H[/serena -d で整合性確認]
    H --> I{重複/不整合?}
    I -->|あり| J[整理・修正]
    I -->|なし| K[ドキュメント更新]
    J --> H
    K --> L[/serena でPR作成]
    L --> M[完了通知]
```

## Push前チェックリスト（自動実行）

### 🔍 重複ファイル検出
```bash
# 似た名前のファイルを検出
find src -type f \( -name "*.tsx" -o -name "*.ts" \) | \
  sed 's/.*\///' | sort | uniq -d

# 同一内容のファイルを検出
find src -type f -exec md5sum {} \; | \
  sort | uniq -d -w 32

# 未使用ファイルの検出
npx knip --no-exit-code 2>/dev/null || true
```

### ✅ チケットTODO更新
```markdown
実装完了時の自動更新:
- [ ] → [x] に変換
- 完了項目に日付追記
- 関連チケットの依存状態更新

例: docs/FE-001_*.md
- [x] 画面実装 ✅ 2025-01-28
- [x] API連携 ✅ 2025-01-28
- [ ] テスト作成 （未実装）
```

### 📝 ドキュメント同期
```
更新対象:
1. CLAUDE.md
   - 新機能の追加
   - 技術スタック変更
   - 開発ガイドライン

2. docs/HUMAN_TODO.md
   - 完了タスクの移動
   - 新規課題の追加

3. 関連チケット
   - 依存関係の解消
   - ステータス更新
```

## コマンド実行時の内部処理

1. **TodoWrite使用**: タスク管理・進捗可視化
2. **Serena MCP活用**: 
   - `/serena -d`: 事前調査と実装（深層モード）
   - `/serena -c`: コードレビューと最適化
3. **よくあるミスチェック**:
   - docs/common-issues/配下の全パターンを参照
   - 実装前・実装後・PR前の3段階でチェック
4. **Supabase MCP**: スキーマ確認（利用可能時）
5. **整合性チェック**: 重複ファイル・不要コード削除
6. **ドキュメント同期**: TODO更新・CLAUDE.md確認
7. **自動セルフレビュー**: 品質・セキュリティ確認
8. **PR自動生成**: テンプレート準拠

## 整理・整頓の自動化

### 不要ファイル削除パターン
```javascript
// 検出対象
const cleanupPatterns = [
  // 重複コンポーネント
  'PlantList.tsx と PlantsList.tsx',
  'UserAuth.ts と AuthUser.ts',
  
  // 一時ファイル
  '*.tmp', '*~', '.DS_Store',
  
  // 未使用コード
  'console.log(', 'debugger;',
  '// TODO: 削除予定',
  
  // テストファイル残骸
  '*.test.tsx.bak', '*.spec.ts.old'
];
```

### クリーンアップ実行
```bash
# Push前の必須実行
/nyoki-pr --cleanup

# 実行内容:
1. 重複ファイル検出→確認→削除
2. 未使用import削除
3. チケットTODO更新
4. CLAUDE.md同期確認
5. git status確認
6. 最終レビュー
```

---

**重要な実行方法**:
- **必ず `/serena -d` で実装前の深層分析と実装を行う**
- **必ず `/serena -c` で実装後のコードレビューを行う**
- 98_Resources/01_MVPとCLAUDE.mdの内容を最優先
- チケットmdの指示に忠実に従う
- 指示者への確認が必要な場合は平易な言葉で説明