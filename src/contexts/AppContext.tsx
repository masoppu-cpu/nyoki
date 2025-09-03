import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, PurchaseListItem, UserPlant } from '../types';
import { User } from '../types/auth';

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

const calculatePurchaseListTotal = (items: PurchaseListItem[]): number => {
  // 非決済の参考表示用合計（「検討中」のみ対象）
  return items
    .filter(i => i.status === 'considering')
    .reduce((total, item) => total + (item.plant.price || 0), 0);
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isPremium: action.payload?.isPremium || false,
      };

    case 'ADD_TO_PURCHASE_LIST': {
      const exists = state.purchaseListItems.some(
        item => item.plant.id === action.payload.id && item.status === 'considering'
      );
      const newItems = exists
        ? state.purchaseListItems
        : [...state.purchaseListItems, { 
            plant: action.payload, 
            status: 'considering', 
            addedAt: new Date().toISOString() 
          }];
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
          ? { 
              ...item, 
              status: 'purchased' as const, 
              purchasedAt: new Date().toISOString(), 
              externalUrl: action.payload.externalUrl 
            }
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
        // Ensure computed fields are recalculated
        canAddMorePlants: action.payload.isPremium || (action.payload.plantsCount || 0) < 5,
      };

    default:
      return state;
  }
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
        restoredState.isPremium = restoredState.user!.isPremium;
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
    isPremium: state.isPremium,
    login: (user: User) => dispatch({ type: 'SET_USER', payload: user }),
    logout: () => dispatch({ type: 'SET_USER', payload: null }),
    setPremiumStatus: (isPremium: boolean) => dispatch({ type: 'SET_PREMIUM_STATUS', payload: isPremium }),
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
    isPremium: state.isPremium,
    addPlant: (plant: UserPlant) => dispatch({ type: 'ADD_USER_PLANT', payload: plant }),
    updatePlant: (id: string, updates: Partial<UserPlant>) =>
      dispatch({ type: 'UPDATE_USER_PLANT', payload: { id, updates } }),
    removePlant: (id: string) => dispatch({ type: 'REMOVE_USER_PLANT', payload: id }),
  };
};

// 追加の便利なフック
export const useRecommendedPlants = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    plants: state.recommendedPlants,
    setRecommendedPlants: (plants: Plant[]) => dispatch({ type: 'SET_RECOMMENDED_PLANTS', payload: plants }),
  };
};

export const useAppUI = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    isLoading: state.isLoading,
    error: state.error,
    currentView: state.currentView,
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
  };
};