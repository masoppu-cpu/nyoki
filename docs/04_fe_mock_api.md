# チケット #04: モックAPI層実装

**タスクID**: FE-001  
**担当**: Frontend  
**推定時間**: 3時間  
**依存関係**: [COMMON-001: API仕様書, COMMON-002: 型定義]  
**優先度**: 高（Phase 1）

## 概要
バックエンド開発と並行してフロントエンド開発を進めるため、モックAPI層を実装する。

## TODO リスト

- [x] 植物モックデータ作成（一部実装済み）
- [ ] APIクライアント基本構造作成
- [ ] モック/実API切り替え機構
- [ ] 各エンドポイントのモック実装
- [ ] エラーシミュレーション機能
- [ ] 遅延シミュレーション機能
- [ ] Expo Goでの動作確認

## 実装済み内容

### 植物サービス（src/services/plants.ts）
```typescript
// ✅ 基本的なモック実装済み
class PlantService {
  private plantsDatabase: Plant[] = [
    // モックデータ5件登録済み
  ];

  async getAllPlants(): Promise<Plant[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.plantsDatabase;
  }
  // ... 他メソッド実装済み
}
```

## 追加実装が必要な内容

### APIクライアント基本構造
```typescript
// TODO: src/services/api/client.ts
export class ApiClient {
  private baseURL: string;
  private useMock: boolean;

  constructor() {
    this.useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || '';
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    if (this.useMock) {
      return this.mockRequest(endpoint, options);
    }
    return this.realRequest(endpoint, options);
  }

  private async mockRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // モックデータを返す
    const mockHandler = mockHandlers[endpoint];
    if (mockHandler) {
      return mockHandler(options);
    }
    throw new Error(`No mock handler for ${endpoint}`);
  }

  private async realRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // 実APIを呼び出す
    const response = await fetch(`${this.baseURL}${endpoint}`, options);
    return response.json();
  }
}
```

### モックハンドラー
```typescript
// TODO: src/services/api/mockHandlers.ts
export const mockHandlers = {
  // 購入検討リスト（MVP: 非決済）
  '/api/purchase-list': async () => {
    await simulateDelay();
    return { success: true, data: { items: [] } };
  },
  '/api/purchase-list/purchased': async () => {
    await simulateDelay();
    return { success: true, data: { items: [] } };
  },
  '/api/purchase-list/add': async (options) => {
    await simulateDelay();
    return { success: true, data: { id: 'mock-id' } };
  },
  '/api/auth/login': async (options) => {
    await simulateDelay();
    return {
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-jwt-token'
      }
    };
  },
  '/api/plants': async () => {
    await simulateDelay();
    return {
      success: true,
      data: mockPlants
    };
  },
  // ... 他のエンドポイント
};

// 遅延シミュレーション
const simulateDelay = () => {
  const delay = Math.random() * 1000 + 500; // 0.5-1.5秒
  return new Promise(resolve => setTimeout(resolve, delay));
};
```

### エラーシミュレーション
```typescript
// TODO: src/services/api/errorSimulator.ts
export class ErrorSimulator {
  static shouldFail(rate: number = 0.1): boolean {
    return Math.random() < rate;
  }

  static getRandomError() {
    const errors = [
      { code: 'NETWORK_ERROR', message: 'ネットワークエラー' },
      { code: 'TIMEOUT', message: 'タイムアウト' },
      { code: 'SERVER_ERROR', message: 'サーバーエラー' },
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }
}
```

## モック切り替え設定

### 環境変数
```env
# .env.local
EXPO_PUBLIC_USE_MOCK=true  # 開発時はtrue
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## テストシナリオ

1. **正常系テスト**
   - 全エンドポイントの正常レスポンス確認

2. **エラー系テスト**
   - ネットワークエラー
   - 認証エラー
   - バリデーションエラー

3. **遅延テスト**
   - 遅いネットワーク環境のシミュレーション

## Expo Goでの動作確認手順


## Auto-PR（Claude用）

目的:
- モックAPI層の骨格を最小差分で追加/補強し、PRを作成

ブランチ:
- feat/<TICKET-ID>-mock-api

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] モックレスポンスがUIに反映
- [ ] 環境変数でモック切替が機能

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-mock-api
git add -A && git commit -m "[<TICKET-ID}] implement mock api skeleton"
git push -u origin feat/<TICKET-ID>-mock-api
gh pr create --fill --base main --head feat/<TICKET-ID>-mock-api
```
```bash
# 1. 開発サーバー起動
npm start

# 2. Expo Goアプリでスキャン
# iOS: カメラアプリでQRコード読み取り
# Android: Expo GoアプリでQRコードスキャン

# 3. 確認項目
- [ ] モックデータが正しく表示される
- [ ] API遅延シミュレーションが動作する
- [ ] エラー状態が正しく表示される
- [ ] 環境変数でモック/実API切り替えができる
```

## 完了条件
- [ ] 全エンドポイントのモック実装
- [ ] モック/実API切り替え機能
- [ ] エラーシミュレーション実装
- [ ] 遅延シミュレーション実装
- [ ] ドキュメント作成
- [ ] Expo Goでの動作確認完了

## 備考
- Phase 2でスムーズに実APIに切り替えられる設計
- モックデータは実データに近い形で作成
- テスト用のシナリオデータも含める

## 関連ファイル
- `src/services/plants.ts` - 植物サービス（✅一部実装済み）
- `src/services/api/client.ts` - APIクライアント（要作成）
- `src/services/api/mockHandlers.ts` - モックハンドラー（要作成）
- `src/services/api/errorSimulator.ts` - エラーシミュレーター（要作成）

最終更新: 2025-08-28
