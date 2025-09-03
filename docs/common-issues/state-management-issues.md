# 状態管理の共通問題

## [2025-01-03] 不要な再レンダリングの発生

### 問題の内容
- オブジェクトや配列の参照が毎回新しくなる
- useCallbackやuseMemoの使用不足
- Context値の頻繁な更新

### 解決方法
- メモ化の適切な使用
- 状態の分割と最適化

### 悪い例
```typescript
const PlantList = () => {
  const [plants, setPlants] = useState([]);
  
  // 毎回新しい関数が作成される
  const handleDelete = (id: string) => {
    setPlants(plants.filter(p => p.id !== id));
  };
  
  // 毎回新しいオブジェクトが作成される
  const style = {
    padding: 16,
    backgroundColor: '#fff'
  };
  
  return (
    <View style={style}>
      {plants.map(plant => (
        <PlantItem 
          key={plant.id}
          plant={plant}
          onDelete={handleDelete}
        />
      ))}
    </View>
  );
};
```

### 良い例
```typescript
const PlantList = () => {
  const [plants, setPlants] = useState([]);
  
  // 関数をメモ化
  const handleDelete = useCallback((id: string) => {
    setPlants(prev => prev.filter(p => p.id !== id));
  }, []);
  
  // スタイルは外部で定義またはStyleSheet.create使用
  return (
    <View style={styles.container}>
      {plants.map(plant => (
        <PlantItem 
          key={plant.id}
          plant={plant}
          onDelete={handleDelete}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff'
  }
});
```

## [2025-01-03] グローバル状態の過度な使用

### 問題の内容
- すべての状態をContextに入れる
- ローカルで済む状態もグローバル化
- Context分割の不足

### 解決方法
- 状態のスコープを適切に設計
- 必要最小限のグローバル状態
- Contextの分割

### 悪い例
```typescript
// すべてを1つのContextに
const AppContext = createContext({
  user: null,
  plants: [],
  settings: {},
  ui: {
    isLoading: false,
    modal: null,
    toast: null
  },
  // ... 他にも多数
});
```

### 良い例
```typescript
// 機能ごとにContextを分割
const AuthContext = createContext<AuthContextType | null>(null);
const PlantsContext = createContext<PlantsContextType | null>(null);
const UIContext = createContext<UIContextType | null>(null);

// ローカル状態で管理できるものは分離
const PlantDetail = ({ plantId }: Props) => {
  // この画面でのみ使う状態はローカルで管理
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState(null);
  
  // グローバル状態は必要な分だけ取得
  const { plants, updatePlant } = usePlants();
  const plant = plants.find(p => p.id === plantId);
  
  // ...
};
```

## [2025-01-03] 非同期状態更新のタイミング問題

### 問題の内容
- コンポーネントアンマウント後の状態更新
- 連続した状態更新の競合

### 解決方法
- クリーンアップ関数の実装
- 状態更新前のマウント確認

### 悪い例
```typescript
const PlantScreen = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // 非同期処理後にアンマウントされる可能性
    fetchPlantData().then(setData);
  }, []);
  
  return <View>{/* ... */}</View>;
};
```

### 良い例
```typescript
const PlantScreen = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const result = await fetchPlantData();
        // マウント状態を確認してから更新
        if (isMounted) {
          setData(result);
        }
      } catch (error) {
        if (isMounted) {
          console.error(error);
        }
      }
    };
    
    loadData();
    
    // クリーンアップ
    return () => {
      isMounted = false;
    };
  }, []);
  
  return <View>{/* ... */}</View>;
};
```

## [2025-01-03] フォーム状態の管理ミス

### 問題の内容
- 各入力フィールドごとに個別のstate
- バリデーションタイミングの問題
- 送信中の多重送信

### 解決方法
- フォーム状態の統合管理
- 適切なバリデーション実装
- 送信状態の管理

### 悪い例
```typescript
const PlantForm = () => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [wateringDays, setWateringDays] = useState('');
  // ... 多数の個別state
  
  const handleSubmit = async () => {
    // 多重送信の可能性
    await savePlant({ name, species, wateringDays });
  };
};
```

### 良い例
```typescript
interface PlantFormData {
  name: string;
  species: string;
  wateringDays: number;
}

const PlantForm = () => {
  const [formData, setFormData] = useState<PlantFormData>({
    name: '',
    species: '',
    wateringDays: 7
  });
  const [errors, setErrors] = useState<Partial<PlantFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const updateField = useCallback((field: keyof PlantFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // フィールド個別のバリデーション
    validateField(field, value);
  }, []);
  
  const handleSubmit = async () => {
    if (isSubmitting) return; // 多重送信防止
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await savePlant(formData);
      // 成功処理
    } catch (error) {
      // エラー処理
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <View>
      {/* フォームUI */}
      <Button 
        title="保存" 
        onPress={handleSubmit}
        disabled={isSubmitting}
      />
    </View>
  );
};
```