# チケット #21: OneSignal統合

**タスクID**: EXT-003  
**担当**: Full-stack  
**推定時間**: 3時間  
**依存関係**: [BE-001: Supabase設定]  
**優先度**: 中（Phase 3）

## 概要
OneSignal SDKを統合し、プッシュ通知機能を実装。水やりリマインダーや新機能のお知らせ。

注: OneSignalはExpo Goでは動作しません。カスタムDev Client（`expo-dev-client`）での実行が必須です。

## TODO リスト

- [ ] OneSignalアカウント設定
- [ ] SDK インストールと初期化
- [ ] プッシュ通知権限リクエスト
- [ ] セグメント設定
- [ ] 通知テンプレート作成
- [ ] 通知スケジューリング

## OneSignal設定

### アカウント作成とアプリ設定
```
1. https://onesignal.com でアカウント作成
2. New App作成: "nyoki"
3. プラットフォーム設定:
   - iOS: APNs証明書アップロード
   - Android: FCM設定
4. App ID取得: xxxxx-xxxxx-xxxxx
5. REST API Key取得: xxxxx
```

## SDK インストール

```bash
npx expo install onesignal-expo-plugin
npm install react-native-onesignal
npx expo install expo-dev-client
```

### app.json設定
```json
{
  "expo": {
    "plugins": [
      [
        "onesignal-expo-plugin",
        {
          "mode": "production",
          "devTeam": "XXXXXXXXXX"
        }
      ]
    ]
  }
}
```

## OneSignalサービス実装

```typescript
// src/services/oneSignal.ts
import OneSignal from 'react-native-onesignal';
import { supabase } from '../lib/supabase';

export class OneSignalService {
  private static instance: OneSignalService;
  private initialized = false;

  static getInstance(): OneSignalService {
    if (!this.instance) {
      this.instance = new OneSignalService();
    }
    return this.instance;
  }

  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    // OneSignal初期化
    OneSignal.setAppId(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID!);

    // ログレベル設定（開発時）
    if (__DEV__) {
      OneSignal.setLogLevel(6, 0);
    }

    // プロンプト設定
    OneSignal.promptForPushNotificationsWithUserResponse();

    // 通知ハンドラー設定
    this.setupNotificationHandlers();

    // ユーザーIDを設定
    if (userId) {
      await this.setUserId(userId);
    }

    this.initialized = true;
  }

  private setupNotificationHandlers(): void {
    // 通知が開かれた時
    OneSignal.setNotificationOpenedHandler(notification => {
      console.log('Notification opened:', notification);
      this.handleNotificationOpened(notification);
    });

    // 通知を受信した時（フォアグラウンド）
    OneSignal.setNotificationWillShowInForegroundHandler(notificationReceivedEvent => {
      console.log('Notification received in foreground:', notificationReceivedEvent);
      const notification = notificationReceivedEvent.getNotification();
      
      // 通知を表示するかどうか
      notificationReceivedEvent.complete(notification);
    });
  }

  private handleNotificationOpened(notification: any): void {
    const { additionalData } = notification.notification;
    
    if (additionalData) {
      // 通知タイプによって処理分岐
      switch (additionalData.type) {
        case 'watering_reminder':
          // 水やり画面へ遷移
          this.navigateToWatering(additionalData.plantId);
          break;
        case 'new_feature':
          // 新機能画面へ
          this.navigateToFeature(additionalData.featureId);
          break;
        case 'promotion':
          // プロモーション画面へ
          this.navigateToPromotion(additionalData.promotionId);
          break;
      }
    }
  }

  async setUserId(userId: string): Promise<void> {
    OneSignal.setExternalUserId(userId);
    
    // Supabaseプロファイルと同期
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      // タグ設定（セグメント用）
      OneSignal.sendTags({
        is_premium: profile.is_premium.toString(),
        plants_count: profile.plants_count.toString(),
        language: 'ja',
        app_version: '1.0.0',
      });
    }
  }

  async requestPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      OneSignal.promptForPushNotificationsWithUserResponse((response) => {
        resolve(response);
      });
    });
  }

  async scheduleWateringReminder(
    plantId: string,
    plantName: string,
    scheduledTime: Date
  ): Promise<string | null> {
    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
          include_external_user_ids: [await this.getCurrentUserId()],
          send_after: scheduledTime.toISOString(),
          headings: {
            ja: '水やりの時間です 💧',
            en: 'Time to water your plant 💧',
          },
          contents: {
            ja: `${plantName}に水をあげましょう`,
            en: `Time to water ${plantName}`,
          },
          data: {
            type: 'watering_reminder',
            plantId,
            plantName,
          },
          ios_badgeType: 'Increase',
          ios_badgeCount: 1,
        }),
      });

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      return false;
    }
  }

  async sendTestNotification(): Promise<void> {
    const userId = await this.getCurrentUserId();
    
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
        include_external_user_ids: [userId],
        headings: {
          ja: 'テスト通知 🌱',
        },
        contents: {
          ja: 'nyokiからのテスト通知です',
        },
      }),
    });
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || '';
  }

  private navigateToWatering(plantId: string): void {
    // NavigationService経由で画面遷移
    // NavigationService.navigate('PlantDetail', { plantId });
  }

  private navigateToFeature(featureId: string): void {
    // NavigationService.navigate('Feature', { featureId });
  }

  private navigateToPromotion(promotionId: string): void {
    // NavigationService.navigate('Promotion', { promotionId });
  }
}

export const oneSignalService = OneSignalService.getInstance();
```

## 通知設定画面

```typescript
// src/screens/NotificationSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { oneSignalService } from '../services/oneSignal';

export const NotificationSettingsScreen = () => {
  const [settings, setSettings] = useState({
    wateringReminders: true,
    newFeatures: true,
    promotions: false,
    tips: true,
    defaultTime: new Date(),
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    
    // OneSignalタグ更新
    OneSignal.sendTag(`notifications_${key}`, (!settings[key]).toString());
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setSettings(prev => ({
        ...prev,
        defaultTime: selectedDate,
      }));
      // 時間を保存
      saveDefaultTime(selectedDate);
    }
  };

  const saveDefaultTime = async (time: Date) => {
    await supabase
      .from('profiles')
      .update({
        notification_time: time.toTimeString().substring(0, 5),
      })
      .eq('id', user.id);
  };

  const testNotification = async () => {
    await oneSignalService.sendTestNotification();
    Alert.alert('送信完了', 'テスト通知を送信しました');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知設定</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>水やりリマインダー</Text>
            <Text style={styles.settingDescription}>
              植物の水やり時期をお知らせします
            </Text>
          </View>
          <Switch
            value={settings.wateringReminders}
            onValueChange={() => handleToggle('wateringReminders')}
            trackColor={{ false: '#E2E8F0', true: '#9AE6B4' }}
            thumbColor={settings.wateringReminders ? '#48BB78' : '#CBD5E0'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>新機能のお知らせ</Text>
            <Text style={styles.settingDescription}>
              アプリの新機能や改善をお知らせします
            </Text>
          </View>
          <Switch
            value={settings.newFeatures}
            onValueChange={() => handleToggle('newFeatures')}
            trackColor={{ false: '#E2E8F0', true: '#9AE6B4' }}
            thumbColor={settings.newFeatures ? '#48BB78' : '#CBD5E0'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>お得な情報</Text>
            <Text style={styles.settingDescription}>
              キャンペーンや割引情報をお知らせします
            </Text>
          </View>
          <Switch
            value={settings.promotions}
            onValueChange={() => handleToggle('promotions')}
            trackColor={{ false: '#E2E8F0', true: '#9AE6B4' }}
            thumbColor={settings.promotions ? '#48BB78' : '#CBD5E0'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>植物育成のヒント</Text>
            <Text style={styles.settingDescription}>
              季節に応じた育成アドバイスをお届けします
            </Text>
          </View>
          <Switch
            value={settings.tips}
            onValueChange={() => handleToggle('tips')}
            trackColor={{ false: '#E2E8F0', true: '#9AE6B4' }}
            thumbColor={settings.tips ? '#48BB78' : '#CBD5E0'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知時刻</Text>
        
        <TouchableOpacity
          style={styles.timeSelector}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.timeLabel}>デフォルトの通知時刻</Text>
          <Text style={styles.timeValue}>
            {settings.defaultTime.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={settings.defaultTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.testButton} onPress={testNotification}>
          <Text style={styles.testButtonText}>テスト通知を送信</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#718096',
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeLabel: {
    fontSize: 16,
    color: '#2D3748',
  },
  timeValue: {
    fontSize: 16,
    color: '#48BB78',
    fontWeight: '600',
  },
  testButton: {
    marginHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#48BB78',
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

## 完了条件
- [ ] OneSignalアカウント設定完了
- [ ] SDK統合完了
- [ ] 通知権限リクエスト実装
- [ ] 水やりリマインダー実装
- [ ] 通知設定画面実装
- [ ] テスト通知送信確認

## 備考
- iOS/Android両対応
- セグメント機能で対象を絞った配信
- A/Bテスト機能も利用可能

## 関連ファイル
- `src/services/oneSignal.ts` - OneSignalサービス
- `src/screens/NotificationSettingsScreen.tsx` - 通知設定画面

最終更新: 2025-08-28
