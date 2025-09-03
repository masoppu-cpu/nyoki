# チケット #09: ローカル状態管理

**タスクID**: FE-006  
**担当**: Frontend  
**推定時間**: 3時間  
**依存関係**: [COMMON-002: 型定義]  
**優先度**: 高（Phase 1）

## 概要
React Context APIを使用したグローバル状態管理の実装。認証、購入検討リスト、植物管理の状態を管理。

注: 本MVPにおける購入導線は「購入検討リスト」を指す（決済は行わない）。実際の購入は外部リンクで行い、
ユーザー操作で「購入済み」へステータスを切り替えることでアプリ内記録を管理する。

## TODO リスト

- [x] AppContext作成 ✅ 2025-09-03
- [x] AuthContext実装 ✅ 2025-09-03（統合Context内で実装）
- [x] PurchaseListContext実装 ✅ 2025-09-03（統合Context内で実装）
- [x] PlantsContext実装 ✅ 2025-09-03（統合Context内で実装）
- [x] AsyncStorageでの永続化 ✅ 2025-09-03
- [x] Context統合 ✅ 2025-09-03（App.tsxにProvider統合）
- [x] 購入検討リストの永続化（アプリ再起動後も保持） ✅ 2025-09-03
- [ ] Expo Goでの動作確認

## 実装内容

### AppContext（統合コンテキスト）
```typescript
// src/contexts/AppContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, PurchaseListItem, UserPlant, User } from '../types';

interface AppState {
  // 認証
  user: User | null;
  isAuthenticated: boolean;
  
  // 購入検討リスト
  purchaseListItems: PurchaseListItem[];
  purchaseListTotal: number; // 表示用の参考合計金額（非決済）
  
  // 植物管理
  userPlants: UserPlant[];
  recommendedPlants: Plant[];
  
  // UI状態
  currentView: string;
  isLoading: boolean;
  error: string | null;
  
  // サブスクリプション
  isPremium: boolean;
  plantsCount: number;
  canAddMorePlants: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'ADD_TO_PURCHASE_LIST'; payload: Plant }
  | { type: 'REMOVE_FROM_PURCHASE_LIST'; payload: string }
  | { type: 'MARK_PURCHASED'; payload: { plantId: string; externalUrl?: string } }
  | { type: 'CLEAR_PURCHASE_LIST' }
  | { type: 'ADD_USER_PLANT'; payload: UserPlant }
  | { type: 'UPDATE_USER_PLANT'; payload: { id: string; updates: Partial<UserPlant> } }
  | { type: 'REMOVE_USER_PLANT'; payload: string }
  | { type: 'SET_RECOMMENDED_PLANTS'; payload: Plant[] }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> };

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  purchaseListItems: [],
  purchaseListTotal: 0,
  userPlants: [],
  recommendedPlants: [],
  currentView: 'home',
  isLoading: false,
  error: null,
  isPremium: false,
  plantsCount: 0,
  canAddMorePlants: true,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };

    case 'ADD_TO_PURCHASE_LIST': {
      const exists = state.purchaseListItems.some(
        item => item.plant.id === action.payload.id && item.status === 'considering'
      );
      const newItems = exists
        ? state.purchaseListItems
        : [...state.purchaseListItems, { plant: action.payload, status: 'considering', addedAt: new Date().toISOString() }];
      return {
        ...state,
        purchaseListItems: newItems,
        purchaseListTotal: calculatePurchaseListTotal(newItems),
      };
    }

    case 'REMOVE_FROM_PURCHASE_LIST': {
      const newItems = state.purchaseListItems.filter(
        item => !(item.plant.id === action.payload && item.status === 'considering')
      );
      return {
        ...state,
        purchaseListItems: newItems,
        purchaseListTotal: calculatePurchaseListTotal(newItems),
      };
    }

    case 'MARK_PURCHASED': {
      const newItems = state.purchaseListItems.map(item =>
        item.plant.id === action.payload.plantId && item.status === 'considering'
          ? { ...item, status: 'purchased', purchasedAt: new Date().toISOString(), externalUrl: action.payload.externalUrl }
          : item
      );
      return {
        ...state,
        purchaseListItems: newItems,
        purchaseListTotal: calculatePurchaseListTotal(newItems),
      };
    }

    case 'CLEAR_PURCHASE_LIST':
      return {
        ...state,
        purchaseListItems: [],
        purchaseListTotal: 0,
      };

    case 'ADD_USER_PLANT': {
      const newPlants = [...state.userPlants, action.payload];
      const newCount = newPlants.length;
      return {
        ...state,
        userPlants: newPlants,
        plantsCount: newCount,
        canAddMorePlants: state.isPremium || newCount < 5,
      };
    }

    case 'UPDATE_USER_PLANT': {
      const newPlants = state.userPlants.map(plant =>
        plant.id === action.payload.id
          ? { ...plant, ...action.payload.updates }
          : plant
      );
      return {
        ...state,
        userPlants: newPlants,
      };
    }

    case 'REMOVE_USER_PLANT': {
      const newPlants = state.userPlants.filter(
        plant => plant.id !== action.payload
      );
      const newCount = newPlants.length;
      return {
        ...state,
        userPlants: newPlants,
        plantsCount: newCount,
        canAddMorePlants: state.isPremium || newCount < 5,
      };
    }

    case 'SET_RECOMMENDED_PLANTS':
      return {
        ...state,
        recommendedPlants: action.payload,
      };

    case 'SET_PREMIUM_STATUS': {
      return {
        ...state,
        isPremium: action.payload,
        canAddMorePlants: action.payload || state.plantsCount < 5,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'RESTORE_STATE':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};

const calculatePurchaseListTotal = (items: PurchaseListItem[]): number => {
  // 非決済の参考表示用合計（「検討中」のみ対象）
  return items
    .filter(i => i.status === 'considering')
    .reduce((total, item) => total + (item.plant.price || 0), 0);
};

// Context作成
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider実装
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 状態の永続化
  useEffect(() => {
    loadPersistedState();
  }, []);

  useEffect(() => {
    persistState();
  }, [state.purchaseListItems, state.userPlants, state.user]);

  const loadPersistedState = async () => {
    try {
      const [purchaseListData, plantsData, userData] = await Promise.all([
        AsyncStorage.getItem('purchase_list'),
        AsyncStorage.getItem('userPlants'),
        AsyncStorage.getItem('user'),
      ]);

      const restoredState: Partial<AppState> = {};
      
      if (purchaseListData) {
        restoredState.purchaseListItems = JSON.parse(purchaseListData);
        restoredState.purchaseListTotal = calculatePurchaseListTotal(restoredState.purchaseListItems!);
      }
      
      if (plantsData) {
        restoredState.userPlants = JSON.parse(plantsData);
        restoredState.plantsCount = restoredState.userPlants!.length;
      }
      
      if (userData) {
        restoredState.user = JSON.parse(userData);
        restoredState.isAuthenticated = true;
      }

      if (Object.keys(restoredState).length > 0) {
        dispatch({ type: 'RESTORE_STATE', payload: restoredState });
      }
    } catch (error) {
      console.error('状態復元エラー:', error);
    }
  };

  const persistState = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('purchase_list', JSON.stringify(state.purchaseListItems)),
        AsyncStorage.setItem('userPlants', JSON.stringify(state.userPlants)),
        state.user 
          ? AsyncStorage.setItem('user', JSON.stringify(state.user))
          : AsyncStorage.removeItem('user'),
      ]);
    } catch (error) {
      console.error('状態保存エラー:', error);
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// カスタムフック
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// 便利なカスタムフック
export const useAuth = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login: (user: User) => dispatch({ type: 'SET_USER', payload: user }),
    logout: () => dispatch({ type: 'SET_USER', payload: null }),
  };
};

export const usePurchaseList = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    items: state.purchaseListItems,
    total: state.purchaseListTotal,
    addToPurchaseList: (plant: Plant) => dispatch({ type: 'ADD_TO_PURCHASE_LIST', payload: plant }),
    removeFromPurchaseList: (plantId: string) => dispatch({ type: 'REMOVE_FROM_PURCHASE_LIST', payload: plantId }),
    markPurchased: (plantId: string, externalUrl?: string) =>
      dispatch({ type: 'MARK_PURCHASED', payload: { plantId, externalUrl } }),
    clearPurchaseList: () => dispatch({ type: 'CLEAR_PURCHASE_LIST' }),
  };
};

export const useUserPlants = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    plants: state.userPlants,
    count: state.plantsCount,
    canAddMore: state.canAddMorePlants,
    addPlant: (plant: UserPlant) => dispatch({ type: 'ADD_USER_PLANT', payload: plant }),
    updatePlant: (id: string, updates: Partial<UserPlant>) =>
      dispatch({ type: 'UPDATE_USER_PLANT', payload: { id, updates } }),
    removePlant: (id: string) => dispatch({ type: 'REMOVE_USER_PLANT', payload: id }),
  };
};
```

### App.tsxでの統合
```typescript
// App.tsx の更新
import { AppProvider } from './src/contexts/AppContext';

export default function App() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <MainApp />
      </SafeAreaProvider>
    </AppProvider>
  );
}
```

### 使用例
```typescript
// コンポーネントでの使用例
import { usePurchaseList, useAuth, useUserPlants } from '../contexts/AppContext';

const MyComponent = () => {
  const { items, total, addToPurchaseList } = usePurchaseList();
  const { user, isAuthenticated } = useAuth();
  const { plants, canAddMore } = useUserPlants();

  const handleAddToPurchaseList = (plant: Plant) => {
    if (!canAddMore && !isPremium) {
      Alert.alert(
        '制限に達しました',
        'プレミアムプランで無制限に植物を追加できます'
      );
      return;
    }
    addToPurchaseList(plant);
  };

  // ...
};
```

## Expo Goでの動作確認手順

```bash
# 1. 開発サーバー起動
npm start

# 2. Expo Goアプリでスキャン
# iOS: カメラアプリでQRコード読み取り
# Android: Expo GoアプリでQRコードスキャン

# 3. 確認項目
- [ ] 購入検討リストに追加できる
- [ ] アプリを再起動しても購入検討リスト内容が保持される
- [ ] 植物数制限（5つまで）が動作する
- [ ] プレミアムプラン状態が管理される
```

## 完了条件
- [x] AppContext実装 ✅ 2025-09-03
- [x] 各種カスタムフック実装 ✅ 2025-09-03
- [x] AsyncStorage永続化 ✅ 2025-09-03
- [x] 購入検討リストの永続化（アプリ再起動後も保持） ✅ 2025-09-03
- [x] 状態復元機能 ✅ 2025-09-03
- [x] エラーハンドリング ✅ 2025-09-03
- [ ] Expo Goでの動作確認完了

## 備考
- Redux不要でシンプルな実装
- TypeScriptで型安全
- パフォーマンス考慮（不要な再レンダリング防止）

## 関連ファイル
- `src/contexts/AppContext.tsx` - 統合コンテキスト（要作成）
- `src/hooks/useAuth.ts` - 認証フック（✅基本実装済み）
- `src/hooks/usePlants.ts` - 植物管理フック（✅基本実装済み）

最終更新: 2025-08-28

## Auto-PR（Claude用）

目的:
- 購入検討リスト中心の状態管理（Context/Hook）の最小実装を追加しPR作成

ブランチ:
- feat/<TICKET-ID>-state-management

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] 追加/削除/購入済み反映
- [ ] 永続化（AsyncStorage）

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-state-management
git add -A && git commit -m "[<TICKET-ID}] add purchase list context"
git push -u origin feat/<TICKET-ID>-state-management
gh pr create --fill --base main --head feat/<TICKET-ID>-state-management
```
