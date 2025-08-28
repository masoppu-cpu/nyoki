# チケット #19: RevenueCat SDK統合

**タスクID**: EXT-001  
**担当**: Full-stack  
**推定時間**: 4時間  
**依存関係**: [BE-001: Supabase設定, FE-001: モックAPI]  
**優先度**: 中（Phase 3）

## 概要
RevenueCat SDKを統合し、サブスクリプション課金機能を実装。

注: RevenueCatはExpo Goでは動作しません。カスタムDev Client（`expo-dev-client`）での実行が必須です。

現状: 本番キー（iOS）が未提供のため、設定セクションはプレースホルダのまま進める。キーが提供され次第、Offering/ProductID/Priceを最終反映。

## TODO リスト

- [ ] RevenueCatアカウント作成
- [ ] App Store Connect設定
- [ ] RevenueCat SDK インストール
- [ ] 初期化処理実装
- [ ] 商品設定（Offering）
- [ ] 購入フロー実装
- [ ] サブスクリプション状態管理

## RevenueCat設定

### 1. アカウント作成
```
1. https://www.revenuecat.com でアカウント作成
2. プロジェクト作成: "nyoki"
3. APIキー取得
   - iOS API Key: appl_xxxxx...
   - Android API Key: goog_xxxxx...
```

### 2. App Store Connect設定
```
1. アプリ内課金商品作成
   - Product ID: nyoki_premium_monthly
   - 価格: 480円/月
   - タイプ: 自動更新サブスクリプション

2. Shared Secret取得
3. RevenueCatに設定
```

## SDK インストール

### パッケージインストール
```bash
npx expo install react-native-purchases
npx expo install expo-dev-client # カスタムビルド必要
```

### iOS設定（app.json）
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "iosApiKey": "appl_xxxxx...",
          "androidApiKey": "goog_xxxxx..."
        }
      ]
    ]
  }
}
```

## 実装

### RevenueCat初期化
```typescript
// src/services/revenue-cat.ts
import Purchases, { 
  PurchasesOffering,
  CustomerInfo,
  PurchasesPackage 
} from 'react-native-purchases';

export class RevenueCatService {
  private static instance: RevenueCatService;
  
  static getInstance(): RevenueCatService {
    if (!this.instance) {
      this.instance = new RevenueCatService();
    }
    return this.instance;
  }

  async initialize(userId?: string) {
    try {
      Purchases.setDebugLogsEnabled(__DEV__);
      
      // プラットフォーム別のAPIキー
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
      });

      await Purchases.configure({ apiKey: apiKey! });
      
      // ユーザーIDを設定（Supabase Auth IDを使用）
      if (userId) {
        await Purchases.logIn(userId);
      }
    } catch (error) {
      console.error('RevenueCat初期化エラー:', error);
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Offerings取得エラー:', error);
      return null;
    }
  }

  async purchasePremium(): Promise<boolean> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings?.availablePackages?.length) {
        throw new Error('利用可能なプランがありません');
      }

      const premiumPackage = offerings.availablePackages[0];
      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
      
      return this.isPremium(customerInfo);
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('購入エラー:', error);
      }
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.isPremium(customerInfo);
    } catch (error) {
      console.error('復元エラー:', error);
      return false;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.isPremium(customerInfo);
    } catch (error) {
      console.error('ステータス確認エラー:', error);
      return false;
    }
  }

  private isPremium(customerInfo: CustomerInfo): boolean {
    return customerInfo.entitlements.active['premium'] !== undefined;
  }
}
```

### Hookでの使用
```typescript
// src/hooks/useRevenueCat.ts
import { useState, useEffect } from 'react';
import { RevenueCatService } from '../services/revenue-cat';

export const useRevenueCat = (userId?: string) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState(null);
  
  const revenueCat = RevenueCatService.getInstance();

  useEffect(() => {
    initializeRevenueCat();
  }, [userId]);

  const initializeRevenueCat = async () => {
    setIsLoading(true);
    try {
      await revenueCat.initialize(userId);
      const status = await revenueCat.checkSubscriptionStatus();
      setIsPremium(status);
      
      const currentOfferings = await revenueCat.getOfferings();
      setOfferings(currentOfferings);
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePremium = async () => {
    setIsLoading(true);
    try {
      const success = await revenueCat.purchasePremium();
      if (success) {
        setIsPremium(true);
        // Supabaseのプロファイルも更新
        await updateUserPremiumStatus(true);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    setIsLoading(true);
    try {
      const restored = await revenueCat.restorePurchases();
      setIsPremium(restored);
      return restored;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isPremium,
    isLoading,
    offerings,
    purchasePremium,
    restorePurchases,
  };
};
```

### サブスクリプション画面
```typescript
// src/screens/SubscriptionScreen.tsx
export const SubscriptionScreen = () => {
  const { user } = useAuth();
  const { isPremium, offerings, purchasePremium, isLoading } = useRevenueCat(user?.id);

  if (isPremium) {
    return <PremiumActiveView />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>プレミアムプラン</Text>
      
      <View style={styles.benefits}>
        <BenefitItem icon="infinity" text="無制限の植物管理" />
        <BenefitItem icon="sparkles" text="AI分析無制限" />
        <BenefitItem icon="chat-bubble" text="AI相談無制限" />
        <BenefitItem icon="bell" text="高度なリマインダー" />
      </View>

      <View style={styles.pricing}>
        <Text style={styles.price}>¥480/月</Text>
        <Text style={styles.priceNote}>7日間無料体験付き</Text>
      </View>

      <TouchableOpacity
        style={styles.purchaseButton}
        onPress={purchasePremium}
        disabled={isLoading}
      >
        <Text style={styles.purchaseButtonText}>
          無料体験を開始
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={restorePurchases}>
        <Text style={styles.restoreText}>購入を復元</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Entitlements設定

### RevenueCat Dashboard
```
Products:
  - nyoki_premium_monthly
    - Identifier: premium
    - Description: プレミアムプラン

Offerings:
  - Default
    - Monthly: nyoki_premium_monthly
```

## テスト

### Sandbox テスト
```
1. TestFlightでテスト
2. Sandboxアカウント使用
3. 購入フロー確認
4. 復元フロー確認
5. キャンセル処理確認
```

## 完了条件
- [ ] RevenueCatアカウント設定完了
- [ ] App Store商品設定完了
- [ ] SDK統合完了
- [ ] 購入フロー実装完了
- [ ] サブスク状態管理実装
- [ ] Sandboxテスト完了

## 備考
- EAS Buildが必要（Expo Go非対応）
- 本番リリース前に価格再確認
- 返金ポリシー明記必要

## 関連ファイル
- `src/services/revenue-cat.ts` - RevenueCatサービス（要作成）
- `src/hooks/useRevenueCat.ts` - RevenueCat Hook（要作成）
- `src/screens/SubscriptionScreen.tsx` - サブスク画面（要作成）

最終更新: 2025-08-28

## Auto-PR（Claude用）

目的:
- RevenueCat統合の最小実装（Dev Client前提）を追加しPR作成

ブランチ:
- feat/<TICKET-ID>-revenuecat

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] Offerings取得/購買/復元が通る（サンドボックス）

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-revenuecat
git add -A && git commit -m "[<TICKET-ID}] integrate revenuecat"
git push -u origin feat/<TICKET-ID>-revenuecat
gh pr create --fill --base main --head feat/<TICKET-ID>-revenuecat
```
