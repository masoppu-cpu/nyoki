# チケット #20: サブスクリプション管理

**タスクID**: EXT-002  
**担当**: Full-stack  
**推定時間**: 3時間  
**依存関係**: [EXT-001: RevenueCat統合]  
**優先度**: 中（Phase 3）

## 概要
RevenueCatと連携したサブスクリプション管理機能。プラン管理、制限チェック、アップグレード促進。

## TODO リスト

- [ ] サブスクリプションステータス管理
- [ ] 使用制限チェック機能
- [ ] アップグレード画面
- [ ] ダウングレード処理
- [ ] 無料体験期間管理
- [ ] 領収書確認画面

## サブスクリプション管理サービス

### SubscriptionManager
```typescript
// src/services/subscriptionManager.ts
import { RevenueCatService } from './revenueCat';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SubscriptionStatus {
  isPremium: boolean;
  planType: 'free' | 'premium' | 'trial';
  expiresAt?: Date;
  trialEndsAt?: Date;
  autoRenew: boolean;
  limits: {
    maxPlants: number;
    maxAIAnalysis: number;
    maxAIConsults: number;
  };
  usage: {
    plantsCount: number;
    aiAnalysisCount: number;
    aiConsultsCount: number;
  };
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private revenueCat: RevenueCatService;
  private cachedStatus: SubscriptionStatus | null = null;

  private constructor() {
    this.revenueCat = RevenueCatService.getInstance();
  }

  static getInstance(): SubscriptionManager {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  async initialize(userId: string): Promise<void> {
    await this.revenueCat.initialize(userId);
    await this.syncSubscriptionStatus();
  }

  async getStatus(): Promise<SubscriptionStatus> {
    if (this.cachedStatus) {
      return this.cachedStatus;
    }

    const status = await this.fetchSubscriptionStatus();
    this.cachedStatus = status;
    return status;
  }

  private async fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
    // RevenueCatから課金状態を取得
    const isPremium = await this.revenueCat.checkSubscriptionStatus();

    // Supabaseから使用状況を取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .single();

    const { data: userPlants } = await supabase
      .from('user_plants')
      .select('id');

    // 無料体験期間のチェック
    const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const isInTrial = trialEndsAt && trialEndsAt > new Date();

    return {
      isPremium: isPremium || isInTrial,
      planType: isPremium ? 'premium' : isInTrial ? 'trial' : 'free',
      expiresAt: profile?.premium_expires_at ? new Date(profile.premium_expires_at) : undefined,
      trialEndsAt: trialEndsAt || undefined,
      autoRenew: isPremium,
      limits: {
        maxPlants: isPremium || isInTrial ? 999 : 5,
        maxAIAnalysis: isPremium || isInTrial ? 999 : 5,
        maxAIConsults: isPremium || isInTrial ? 999 : 10,
      },
      usage: {
        plantsCount: userPlants?.length || 0,
        aiAnalysisCount: profile?.ai_analysis_count || 0,
        aiConsultsCount: profile?.ai_consult_count || 0,
      },
    };
  }

  async canAddPlant(): Promise<{ allowed: boolean; message?: string }> {
    const status = await this.getStatus();
    
    if (status.isPremium) {
      return { allowed: true };
    }

    if (status.usage.plantsCount >= status.limits.maxPlants) {
      return {
        allowed: false,
        message: `無料プランでは${status.limits.maxPlants}個まで植物を管理できます`,
      };
    }

    return { allowed: true };
  }

  async canUseAIAnalysis(): Promise<{ allowed: boolean; message?: string }> {
    const status = await this.getStatus();
    
    if (status.isPremium) {
      return { allowed: true };
    }

    // 月次リセットはサーバー側で実施（profiles.ai_last_reset_month等で管理）

    if (status.usage.aiAnalysisCount >= status.limits.maxAIAnalysis) {
      return {
        allowed: false,
        message: `無料プランでは月${status.limits.maxAIAnalysis}回までAI分析できます`,
      };
    }

    return { allowed: true };
  }

  async canUseAIConsult(): Promise<{ allowed: boolean; message?: string }> {
    const status = await this.getStatus();
    
    if (status.isPremium) {
      return { allowed: true };
    }

    if (status.usage.aiConsultsCount >= status.limits.maxAIConsults) {
      return {
        allowed: false,
        message: `無料プランでは月${status.limits.maxAIConsults}回までAI相談できます`,
      };
    }

    return { allowed: true };
  }

  async upgradeToPremium(): Promise<boolean> {
    try {
      const success = await this.revenueCat.purchasePremium();
      
      if (success) {
        await this.syncSubscriptionStatus();
        this.cachedStatus = null; // キャッシュクリア
      }
      
      return success;
    } catch (error) {
      console.error('Upgrade failed:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      const restored = await this.revenueCat.restorePurchases();
      
      if (restored) {
        await this.syncSubscriptionStatus();
        this.cachedStatus = null;
      }
      
      return restored;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  private async syncSubscriptionStatus(): Promise<void> {
    const isPremium = await this.revenueCat.checkSubscriptionStatus();
    
    // Supabaseのプロファイルを更新
    await supabase
      .from('profiles')
      .update({
        is_premium: isPremium,
        premium_expires_at: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);
  }

  private async resetMonthlyUsage(): Promise<void> {
    // サーバー側での月次リセット（スケジュールジョブ）を基本とし、
    // クライアントからの明示的なリセットは行わない。
    console.warn('Monthly usage reset is managed server-side.');
  }

  async incrementUsage(type: 'plants' | 'analysis' | 'consult'): Promise<void> {
    const fieldMap = {
      plants: 'plants_count',
      analysis: 'ai_analysis_count',
      consult: 'ai_consult_count',
    };

    await supabase.rpc('increment_usage', {
      field: fieldMap[type],
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });

    this.cachedStatus = null; // キャッシュクリア
  }
}

export const subscriptionManager = SubscriptionManager.getInstance();
```

## アップグレード画面

```typescript
// src/screens/UpgradeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionManager } from '../services/subscriptionManager';

export const UpgradeScreen = ({ navigation, route }) => {
  const { trigger } = route.params; // どの制限から来たか
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const currentStatus = await subscriptionManager.getStatus();
    setStatus(currentStatus);
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    
    const success = await subscriptionManager.upgradeToPremium();
    
    if (success) {
      Alert.alert(
        '成功',
        'プレミアムプランへのアップグレードが完了しました！',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert(
        'エラー',
        'アップグレードに失敗しました。もう一度お試しください。'
      );
    }
    
    setIsLoading(false);
  };

  const handleRestore = async () => {
    setIsLoading(true);
    
    const restored = await subscriptionManager.restorePurchases();
    
    if (restored) {
      Alert.alert('成功', '購入が復元されました');
      await loadStatus();
    } else {
      Alert.alert('情報', '復元可能な購入が見つかりませんでした');
    }
    
    setIsLoading(false);
  };

  const features = [
    { icon: 'leaf', title: '無制限の植物管理', description: '好きなだけ植物を追加' },
    { icon: 'sparkles', title: '無制限のAI分析', description: '月間制限なし' },
    { icon: 'chatbubbles', title: '無制限のAI相談', description: 'いつでも相談可能' },
    { icon: 'notifications', title: '高度な通知', description: 'カスタマイズ可能なリマインダー' },
    { icon: 'trending-up', title: '成長記録', description: '植物の成長を記録' },
    { icon: 'heart', title: '優先サポート', description: '迅速なカスタマーサポート' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#2D3748" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>プレミアムで{'\n'}もっと楽しもう</Text>
        
        {status?.planType === 'free' && (
          <View style={styles.currentPlan}>
            <Text style={styles.currentPlanText}>現在: 無料プラン</Text>
            <Text style={styles.usageText}>
              植物: {status.usage.plantsCount}/{status.limits.maxPlants}
            </Text>
            <Text style={styles.usageText}>
              AI分析: {status.usage.aiAnalysisCount}/{status.limits.maxAIAnalysis}回/月
            </Text>
          </View>
        )}

        <View style={styles.features}>
          {features.map((feature, index) => (
            <View key={index} style={styles.feature}>
              <Ionicons name={feature.icon as any} size={24} color="#48BB78" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pricing}>
          <Text style={styles.priceLabel}>月額プラン</Text>
          <Text style={styles.price}>¥480</Text>
          <Text style={styles.priceNote}>いつでもキャンセル可能</Text>
          
          {!status?.isPremium && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>7日間無料体験</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, isLoading && styles.disabledButton]}
          onPress={handleUpgrade}
          disabled={isLoading || status?.isPremium}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.upgradeButtonText}>
              {status?.isPremium ? 'すでにプレミアム会員です' : '無料体験を開始'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isLoading}
        >
          <Text style={styles.restoreButtonText}>購入を復元</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          利用規約とプライバシーポリシーに同意の上ご購入ください
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    alignItems: 'flex-end',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 24,
  },
  currentPlan: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  currentPlanText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  usageText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  features: {
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  featureDescription: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  pricing: {
    alignItems: 'center',
    marginBottom: 32,
  },
  priceLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  priceNote: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  trialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  trialText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  upgradeButton: {
    backgroundColor: '#48BB78',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#48BB78',
  },
  terms: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 20,
  },
});
```

## 制限チェックフック

```typescript
// src/hooks/useSubscriptionLimit.ts
import { useState, useEffect } from 'react';
import { subscriptionManager } from '../services/subscriptionManager';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

export const useSubscriptionLimit = () => {
  const navigation = useNavigation();

  const checkPlantLimit = async (): Promise<boolean> => {
    const { allowed, message } = await subscriptionManager.canAddPlant();
    
    if (!allowed) {
      Alert.alert(
        '制限に達しました',
        message,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'プレミアムプランを見る',
            onPress: () => navigation.navigate('Upgrade', { trigger: 'plants' }),
          },
        ]
      );
    }
    
    return allowed;
  };

  const checkAIAnalysisLimit = async (): Promise<boolean> => {
    const { allowed, message } = await subscriptionManager.canUseAIAnalysis();
    
    if (!allowed) {
      Alert.alert(
        'AI分析の制限',
        message,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'プレミアムプランを見る',
            onPress: () => navigation.navigate('Upgrade', { trigger: 'ai_analysis' }),
          },
        ]
      );
    }
    
    return allowed;
  };

  const checkAIConsultLimit = async (): Promise<boolean> => {
    const { allowed, message } = await subscriptionManager.canUseAIConsult();
    
    if (!allowed) {
      Alert.alert(
        'AI相談の制限',
        message,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'プレミアムプランを見る',
            onPress: () => navigation.navigate('Upgrade', { trigger: 'ai_consult' }),
          },
        ]
      );
    }
    
    return allowed;
  };

  return {
    checkPlantLimit,
    checkAIAnalysisLimit,
    checkAIConsultLimit,
  };
};
```

## 完了条件
- [ ] サブスクリプションマネージャー実装
- [ ] 使用制限チェック実装
- [ ] アップグレード画面実装
- [ ] 制限チェックフック実装
- [ ] 月次リセット機能実装
- [ ] 無料体験期間管理

## 備考
- 月次使用量は自動リセット
- キャッシュでパフォーマンス向上
- オフライン時も基本機能は使用可能

## 関連ファイル
- `src/services/subscriptionManager.ts` - サブスク管理
- `src/screens/UpgradeScreen.tsx` - アップグレード画面
- `src/hooks/useSubscriptionLimit.ts` - 制限チェック

最終更新: 2025-08-28
