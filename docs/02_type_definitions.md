# チケット #02: TypeScript型定義

**タスクID**: COMMON-002  
**担当**: Full-stack  
**推定時間**: 2時間  
**依存関係**: なし  
**優先度**: 最高（Phase 0）

## 概要
プロジェクト全体で使用するTypeScript型定義を作成。フロントエンド・バックエンド共通で使用。

## TODO リスト

- [x] 基本型定義（Plant, User, etc）作成済み
- [x] 購入検討リスト型定義作成済み
- [ ] API レスポンス型定義
- [ ] エラー型定義
- [ ] Supabase スキーマ型定義
- [ ] 外部サービス連携型定義

## 実装済み型定義

### 基本型（src/types/index.ts）
```typescript
// ✅ 実装済み
export interface Plant {
  id: string;
  name: string;
  price: number;
  size: 'S' | 'M' | 'L';
  difficulty: string;
  light: string;
  water: string;
  description: string;
  image: any;
  category?: string;
  stock?: number;
}

export interface UserPlant {
  id: string;
  plantId: string;
  name: string;
  nickname?: string;
  location: string;
  lastWatered: string;
  daysUntilWatering: number;
  health: 'healthy' | 'warning' | 'danger';
  image: any;
  purchaseDate?: string;
}

export interface PurchaseListItem {
  plant: Plant;
  status: 'considering' | 'purchased';
  externalUrl?: string;
  addedAt?: string;
  purchasedAt?: string;
}
```

## 追加が必要な型定義

### API型定義
```typescript
// TODO: src/types/api.ts に追加
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 認証型定義
```typescript
// TODO: src/types/auth.ts に追加
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  isPremium: boolean;
  createdAt: string;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
```

### Supabaseスキーマ型
```typescript
// TODO: src/types/database.ts に追加
export interface Database {
  public: {
    Tables: {
      plants: {
        Row: Plant;
        Insert: Omit<Plant, 'id'>;
        Update: Partial<Plant>;
      };
      user_plants: {
        Row: UserPlant;
        Insert: Omit<UserPlant, 'id'>;
        Update: Partial<UserPlant>;
      };
      // ... 他のテーブル
    };
  };
}
```

## 完了条件
- [x] 基本型定義の完成
- [ ] API型定義の完成
- [ ] Supabase型定義の完成
- [ ] 型定義のexport整理
- [ ] JSDocコメント追加

## 備考
- 型定義は`src/types/`配下に整理
- Supabaseの型は自動生成も検討
- フロント・バック共通で使用

## 関連ファイル
- `src/types/index.ts` - メイン型定義（作成済み）
- `src/types/api.ts` - API型定義（要作成）
- `src/types/auth.ts` - 認証型定義（要作成）
- `src/types/database.ts` - DB型定義（要作成）

最終更新: 2025-08-28

## Auto-PR（Claude用）

目的:
- このチケットの内容（型定義）を最小差分で追加/更新し、PRを作成してください

ブランチ:
- feat/<TICKET-ID>-<short-desc>（例: feat/COMMON-002-types）
  - <TICKET-ID> は「タスクID」の値を使用

コミット規約:
- [<TICKET-ID>] から始める（例: [COMMON-002] add ApiResponse types）

PR:
- テンプレに従い、目的/テスト（tsc通過）を記載

動作確認（最低限）:
- [ ] tsc –noEmit が成功
- [ ] 参照ファイルのimportが解決

実行手順（Claude例）:
```bash
git switch -c feat/<TICKET-ID>-<short-desc>
git add -A && git commit -m "[<TICKET-ID>] <要約>"
git push -u origin feat/<TICKET-ID>-<short-desc>
gh pr create --fill --base main --head feat/<TICKET-ID>-<short-desc>
```
