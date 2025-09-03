# TypeScript型定義の共通問題

## [2025-01-03] any型の乱用

### 問題の内容
- 型チェックを回避するanyの使用
- 型安全性の喪失
- バグの温床

### 解決方法
- 適切な型定義の作成
- unknown型の活用
- 型ガードの実装

### 悪い例
```typescript
// any型で型チェックを回避
const handleData = (data: any) => {
  console.log(data.name); // 実行時エラーの可能性
  return data.plants.map((p: any) => p.id);
};

// Propsをanyで定義
const PlantCard = (props: any) => {
  return <View>{props.plant.name}</View>;
};
```

### 良い例
```typescript
// 適切な型定義
interface Plant {
  id: string;
  name: string;
  species: string;
}

interface ApiResponse {
  plants: Plant[];
  total: number;
}

const handleData = (data: ApiResponse) => {
  return data.plants.map(p => p.id);
};

// Props型を明示
interface PlantCardProps {
  plant: Plant;
  onPress?: () => void;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant, onPress }) => {
  return <View>{plant.name}</View>;
};
```

## [2025-01-03] 型アサーションの誤用

### 問題の内容
- 安易な型アサーション（as）の使用
- 実際の型と異なる型への強制変換
- 型安全性の破壊

### 解決方法
- 型ガードの実装
- 適切な型チェック
- アサーションの最小化

### 悪い例
```typescript
// 危険な型アサーション
const user = {} as User; // 実際はUserプロパティを持たない
user.name.toUpperCase(); // 実行時エラー

// JSONパースの型アサーション
const data = JSON.parse(response) as Plant[];
// 実際の構造が異なる可能性
```

### 良い例
```typescript
// 型ガードの実装
const isUser = (obj: unknown): obj is User => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'email' in obj
  );
};

const processUser = (data: unknown) => {
  if (isUser(data)) {
    // 型安全にアクセス
    console.log(data.name.toUpperCase());
  }
};

// Zodなどでのバリデーション
import { z } from 'zod';

const PlantSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const plants = PlantSchema.array().parse(JSON.parse(response));
```

## [2025-01-03] Null/Undefined処理の不足

### 問題の内容
- オプショナルプロパティの考慮不足
- Null/Undefinedチェックの欠如
- 非Null assertion（!）の乱用

### 解決方法
- オプショナルチェーンの使用
- Nullish coalescingの活用
- 適切なデフォルト値

### 悪い例
```typescript
interface User {
  profile?: {
    avatar?: string;
  };
}

const getAvatar = (user: User) => {
  // profile がundefinedの可能性
  return user.profile.avatar;
};

// 非Null assertionの乱用
const element = document.getElementById('app')!;
element.innerHTML = 'Hello'; // elementがnullの可能性
```

### 良い例
```typescript
interface User {
  profile?: {
    avatar?: string;
  };
}

const getAvatar = (user: User) => {
  // オプショナルチェーン
  return user.profile?.avatar ?? '/default-avatar.png';
};

// 適切なNullチェック
const element = document.getElementById('app');
if (element) {
  element.innerHTML = 'Hello';
} else {
  console.error('Element not found');
}
```

## [2025-01-03] ジェネリクスの未活用

### 問題の内容
- 同じような型定義の重複
- 型の再利用性が低い
- 型の柔軟性不足

### 解決方法
- ジェネリクスの活用
- ユーティリティ型の使用
- 型の抽象化

### 悪い例
```typescript
// 重複する型定義
interface StringApiResponse {
  data: string;
  error: Error | null;
}

interface NumberApiResponse {
  data: number;
  error: Error | null;
}

interface PlantApiResponse {
  data: Plant;
  error: Error | null;
}
```

### 良い例
```typescript
// ジェネリクスで再利用可能に
interface ApiResponse<T> {
  data: T;
  error: Error | null;
}

type StringResponse = ApiResponse<string>;
type NumberResponse = ApiResponse<number>;
type PlantResponse = ApiResponse<Plant>;

// ジェネリック関数
const fetchData = async <T>(url: string): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null as T, error: error as Error };
  }
};
```

## [2025-01-03] Enum vs Union型の誤選択

### 問題の内容
- 不適切なEnum使用
- 型推論の妨げ
- バンドルサイズの増加

### 解決方法
- Union型の優先使用
- const assertionの活用
- 適材適所の選択

### 悪い例
```typescript
// 不必要なEnum
enum Status {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// 数値Enumの問題
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}
```

### 良い例
```typescript
// Union型の使用
type Status = 'PENDING' | 'SUCCESS' | 'ERROR';

// const assertionパターン
const STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];

// 方向の例
type Direction = 'up' | 'down' | 'left' | 'right';

// または
const DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
} as const;
```