# Common Issues & Mistakes Reference

このディレクトリには、nyokiプロジェクトでよく発生するミスや修正指示をまとめています。
PR作成前に必ず該当する項目をチェックしてください。

## カテゴリ別ガイド

### 🎨 UI/UX関連
- [コンポーネント設計のミス](./ui-component-issues.md)
- [スタイリングの問題](./styling-issues.md)
- [レスポンシブ対応](./responsive-issues.md)

### 🔧 実装関連
- [状態管理のミス](./state-management-issues.md)
- [API呼び出しの問題](./api-issues.md)
- [パフォーマンス問題](./performance-issues.md)

### 📱 React Native固有
- [プラットフォーム差分](./platform-specific-issues.md)
- [ナビゲーション問題](./navigation-issues.md)
- [Expo関連](./expo-issues.md)

### 🔐 セキュリティ
- [認証・認可のミス](./auth-issues.md)
- [データ保護](./data-protection-issues.md)

### 📝 コード品質
- [TypeScript型定義](./typescript-issues.md)
- [エラーハンドリング](./error-handling-issues.md)
- [テスト不足](./testing-issues.md)

## 使い方

1. **実装前**: 関連するカテゴリのファイルを確認
2. **実装中**: チェックリストとして活用
3. **PR作成前**: 全体的な最終チェック

## チェックリストの更新

新しいミスや問題を発見したら、該当するファイルに追加してください。

```markdown
## [日付] 問題のタイトル

### 問題の内容
- 具体的な問題の説明

### 解決方法
- 推奨される解決方法

### 悪い例
\`\`\`typescript
// 問題のあるコード
\`\`\`

### 良い例
\`\`\`typescript
// 修正後のコード
\`\`\`

### 参考資料
- 関連するドキュメントやリンク
```

## /serena コマンドとの連携

`/serena` コマンド実行時に自動的にこれらのファイルがチェックされ、
該当する問題がないか確認されます。