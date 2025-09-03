# API呼び出しの共通問題

## [2025-01-03] エラーハンドリングの不足

### 問題の内容
- API呼び出し時のエラーハンドリングが不十分
- ネットワークエラーやタイムアウトの考慮不足
- エラー時のユーザーフィードバックがない

### 解決方法
- try-catchブロックで適切にエラーをキャッチ
- ユーザーに分かりやすいエラーメッセージを表示
- リトライロジックの実装

### 悪い例
```typescript
const fetchData = async () => {
  const response = await supabase.from('plants').select('*');
  setData(response.data);
};
```

### 良い例
```typescript
const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const { data, error } = await supabase
      .from('plants')
      .select('*');
    
    if (error) throw error;
    
    setData(data);
  } catch (err) {
    setError('データの取得に失敗しました。再度お試しください。');
    console.error('Fetch error:', err);
  } finally {
    setLoading(false);
  }
};
```

## [2025-01-03] 非同期処理の状態管理不足

### 問題の内容
- ローディング状態の管理がない
- 複数の非同期処理が競合する可能性

### 解決方法
- loading, error, dataの3つの状態を管理
- AbortControllerやクリーンアップの実装

### 悪い例
```typescript
useEffect(() => {
  fetchUserData();
  fetchPlantData();
}, []);
```

### 良い例
```typescript
useEffect(() => {
  let isMounted = true;
  
  const fetchAllData = async () => {
    if (!isMounted) return;
    
    setLoading(true);
    try {
      const [userData, plantData] = await Promise.all([
        fetchUserData(),
        fetchPlantData()
      ]);
      
      if (isMounted) {
        setUserData(userData);
        setPlantData(plantData);
      }
    } catch (error) {
      if (isMounted) {
        setError(error.message);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };
  
  fetchAllData();
  
  return () => {
    isMounted = false;
  };
}, []);
```

## [2025-01-03] Supabase Edge Functions呼び出しの誤り

### 問題の内容
- Edge Functions呼び出し時のパラメータ形式の誤り
- レスポンスの型チェック不足

### 解決方法
- 正しいinvokeメソッドの使用
- TypeScript型定義の追加

### 悪い例
```typescript
const result = await supabase.functions.invoke('analyze-room', roomImage);
```

### 良い例
```typescript
interface AnalyzeRoomResponse {
  plants: Plant[];
  roomType: string;
  lighting: string;
}

const { data, error } = await supabase.functions.invoke<AnalyzeRoomResponse>(
  'analyze-room',
  {
    body: { 
      imageBase64: roomImage,
      options: { 
        includeRecommendations: true 
      }
    }
  }
);

if (error) throw error;
if (!data) throw new Error('No data received');
```

## [2025-01-03] 認証チェックの欠如

### 問題の内容
- 認証が必要なAPIを未認証で呼び出す
- セッション有効性の確認不足

### 解決方法
- API呼び出し前の認証状態チェック
- 401エラー時の適切な処理

### 悪い例
```typescript
const updatePlant = async (plantId: string, data: any) => {
  await supabase.from('plants').update(data).eq('id', plantId);
};
```

### 良い例
```typescript
const updatePlant = async (plantId: string, data: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // 認証画面へリダイレクト
    navigation.navigate('Login');
    return;
  }
  
  const { error } = await supabase
    .from('plants')
    .update(data)
    .eq('id', plantId)
    .eq('user_id', session.user.id); // ユーザーIDでフィルタ
  
  if (error) {
    if (error.code === 'PGRST301') {
      // 認証エラー
      await supabase.auth.signOut();
      navigation.navigate('Login');
    } else {
      throw error;
    }
  }
};
```