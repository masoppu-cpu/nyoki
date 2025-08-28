# チケット #22: プッシュ通知設定

**タスクID**: EXT-004  
**担当**: Full-stack  
**推定時間**: 2時間  
**依存関係**: [EXT-003: OneSignal統合]  
**優先度**: 中（Phase 3）

## 概要
プッシュ通知の詳細設定とスケジューリング機能の実装。水やりリマインダーの自動化。

## TODO リスト

- [ ] 通知スケジューラー実装
- [ ] 水やりリマインダーロジック
- [ ] 通知テンプレート管理
- [ ] バッチ通知処理
- [ ] 通知履歴管理
- [ ] 通知分析ダッシュボード

## 通知スケジューラー実装

### NotificationScheduler
```typescript
// src/services/notificationScheduler.ts
import { oneSignalService } from './oneSignal';
import { supabase } from '../lib/supabase';

export interface ScheduledNotification {
  id: string;
  userId: string;
  type: 'watering' | 'care_tip' | 'reminder' | 'promotion';
  targetId?: string; // 植物IDなど
  scheduledFor: Date;
  title: string;
  message: string;
  data?: any;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  oneSignalId?: string;
}

export class NotificationScheduler {
  private static instance: NotificationScheduler;

  static getInstance(): NotificationScheduler {
    if (!this.instance) {
      this.instance = new NotificationScheduler();
    }
    return this.instance;
  }

  async scheduleWateringReminders(userId: string): Promise<void> {
    // ユーザーの植物を取得
    const { data: userPlants } = await supabase
      .from('user_plants')
      .select(`
        *,
        plant:plants(*)
      `)
      .eq('user_id', userId);

    if (!userPlants || userPlants.length === 0) return;

    // 各植物の水やりスケジュールを計算
    for (const userPlant of userPlants) {
      await this.scheduleWateringForPlant(userId, userPlant);
    }
  }

  private async scheduleWateringForPlant(
    userId: string,
    userPlant: any
  ): Promise<void> {
    // 最後の水やり日から次回日を計算
    const lastWatered = userPlant.last_watered 
      ? new Date(userPlant.last_watered)
      : new Date(userPlant.created_at);

    const waterFrequencyDays = userPlant.water_frequency_days || 7;
    const nextWaterDate = new Date(lastWatered);
    nextWaterDate.setDate(nextWaterDate.getDate() + waterFrequencyDays);

    // 通知時刻を設定（ユーザー設定から取得）
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_time')
      .eq('id', userId)
      .single();

    const notificationTime = profile?.notification_time || '09:00';
    const [hours, minutes] = notificationTime.split(':').map(Number);
    nextWaterDate.setHours(hours, minutes, 0, 0);

    // 過去の日時の場合はスキップ
    if (nextWaterDate <= new Date()) return;

    // 既存のスケジュールをチェック
    const { data: existing } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('target_id', userPlant.id)
      .eq('type', 'watering')
      .eq('status', 'pending')
      .single();

    if (existing) {
      // 既存のスケジュールを更新
      await this.updateScheduledNotification(existing.id, nextWaterDate);
    } else {
      // 新規スケジュール作成
      await this.createScheduledNotification({
        userId,
        type: 'watering',
        targetId: userPlant.id,
        scheduledFor: nextWaterDate,
        title: '水やりの時間です 💧',
        message: `${userPlant.nickname || userPlant.plant.name}に水をあげましょう`,
        data: {
          plantId: userPlant.id,
          plantName: userPlant.plant.name,
        },
      });
    }
  }

  private async createScheduledNotification(
    notification: Omit<ScheduledNotification, 'id' | 'status' | 'oneSignalId'>
  ): Promise<void> {
    // OneSignalに通知をスケジュール
    const oneSignalId = await oneSignalService.scheduleWateringReminder(
      notification.targetId!,
      notification.data.plantName,
      notification.scheduledFor
    );

    // DBに保存
    await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        target_id: notification.targetId,
        scheduled_for: notification.scheduledFor.toISOString(),
        title: notification.title,
        message: notification.message,
        data: notification.data,
        status: 'pending',
        onesignal_id: oneSignalId,
      });
  }

  private async updateScheduledNotification(
    notificationId: string,
    newScheduledDate: Date
  ): Promise<void> {
    // 既存の通知を取得
    const { data: existing } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (!existing) return;

    // OneSignalの通知をキャンセル
    if (existing.onesignal_id) {
      await oneSignalService.cancelNotification(existing.onesignal_id);
    }

    // 新しい通知をスケジュール
    const newOneSignalId = await oneSignalService.scheduleWateringReminder(
      existing.target_id,
      existing.data.plantName,
      newScheduledDate
    );

    // DBを更新
    await supabase
      .from('scheduled_notifications')
      .update({
        scheduled_for: newScheduledDate.toISOString(),
        onesignal_id: newOneSignalId,
      })
      .eq('id', notificationId);
  }

  async cancelScheduledNotification(notificationId: string): Promise<void> {
    const { data: notification } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (!notification) return;

    // OneSignalの通知をキャンセル
    if (notification.onesignal_id) {
      await oneSignalService.cancelNotification(notification.onesignal_id);
    }

    // ステータスを更新
    await supabase
      .from('scheduled_notifications')
      .update({ status: 'cancelled' })
      .eq('id', notificationId);
  }

  async getUpcomingNotifications(userId: string): Promise<ScheduledNotification[]> {
    const { data } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    return data || [];
  }

  async markNotificationAsSent(notificationId: string): Promise<void> {
    await supabase
      .from('scheduled_notifications')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', notificationId);
  }

  // 季節の育成ティップスを送信
  async scheduleSeasionalTips(): Promise<void> {
    const tips = this.getSeasonalTips();
    
    // 全ユーザーに送信
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('onboarding_completed', true);

    if (!users) return;

    for (const user of users) {
      await this.createScheduledNotification({
        userId: user.id,
        type: 'care_tip',
        scheduledFor: this.getNextTipDate(),
        title: tips.title,
        message: tips.message,
        data: { tipId: tips.id },
      });
    }
  }

  private getSeasonalTips(): { id: string; title: string; message: string } {
    const month = new Date().getMonth();
    
    const tips = {
      spring: {
        id: 'spring-tip',
        title: '🌸 春の育成ポイント',
        message: '成長期です！水やりの頻度を少し増やしましょう',
      },
      summer: {
        id: 'summer-tip',
        title: '☀️ 夏の育成ポイント',
        message: '直射日光に注意！明るい日陰に移動しましょう',
      },
      autumn: {
        id: 'autumn-tip',
        title: '🍂 秋の育成ポイント',
        message: '冬に備えて肥料を与える良い時期です',
      },
      winter: {
        id: 'winter-tip',
        title: '❄️ 冬の育成ポイント',
        message: '水やりを控えめに。暖房の風に注意しましょう',
      },
    };

    if (month >= 3 && month <= 5) return tips.spring;
    if (month >= 6 && month <= 8) return tips.summer;
    if (month >= 9 && month <= 11) return tips.autumn;
    return tips.winter;
  }

  private getNextTipDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 1週間後
    date.setHours(10, 0, 0, 0); // 午前10時
    return date;
  }
}

export const notificationScheduler = NotificationScheduler.getInstance();
```

## データベーステーブル

```sql
-- 通知スケジュールテーブル
CREATE TABLE public.scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('watering', 'care_tip', 'reminder', 'promotion')) NOT NULL,
  target_id TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  status TEXT CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')) DEFAULT 'pending',
  onesignal_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_scheduled_notifications_user_id ON public.scheduled_notifications(user_id);
CREATE INDEX idx_scheduled_notifications_status ON public.scheduled_notifications(status);
CREATE INDEX idx_scheduled_notifications_scheduled_for ON public.scheduled_notifications(scheduled_for);

-- 通知履歴テーブル
CREATE TABLE public.notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX idx_notification_history_created_at ON public.notification_history(created_at DESC);
```

## Edge Function（バッチ処理）

```typescript
// supabase/functions/process-notifications/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 毎時実行されるバッチ処理
serve(async (req: Request) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 送信予定の通知を取得
    const { data: pendingNotifications } = await supabaseClient
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(100);

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 各通知を処理
    const results = [];
    for (const notification of pendingNotifications) {
      try {
        // OneSignal API経由で送信
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`,
          },
          body: JSON.stringify({
            app_id: Deno.env.get('ONESIGNAL_APP_ID'),
            include_external_user_ids: [notification.user_id],
            headings: { ja: notification.title },
            contents: { ja: notification.message },
            data: notification.data,
          }),
        });

        if (response.ok) {
          // 送信成功
          await supabaseClient
            .from('scheduled_notifications')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id);

          // 履歴に追加
          await supabaseClient
            .from('notification_history')
            .insert({
              user_id: notification.user_id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              data: notification.data,
            });

          results.push({ id: notification.id, status: 'sent' });
        } else {
          results.push({ id: notification.id, status: 'failed' });
        }
      } catch (error) {
        results.push({ id: notification.id, status: 'error', error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

## Supabase Cron Job設定

```sql
-- 通知バッチ処理を1時間ごとに実行
SELECT cron.schedule(
  'process-notifications',
  '0 * * * *', -- 毎時0分
  $$
    SELECT net.http_post(
      url := 'https://xxxxx.supabase.co/functions/v1/process-notifications',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY'
      )
    );
  $$
);
```

## 完了条件
- [ ] スケジューラー実装完了
- [ ] 水やりリマインダーロジック実装
- [ ] バッチ処理実装
- [ ] データベーステーブル作成
- [ ] Cron Job設定
- [ ] 通知履歴管理実装

## 備考
- 通知は時間帯を考慮（深夜は送信しない）
- タイムゾーン対応（JST）
- 失敗時の再送処理

## 関連ファイル
- `src/services/notificationScheduler.ts` - スケジューラー
- `supabase/functions/process-notifications/` - バッチ処理
- `supabase/migrations/notifications.sql` - DBスキーマ

最終更新: 2025-08-28