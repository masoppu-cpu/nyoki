# チケット #13: ユーザー管理API実装

**タスクID**: BE-004  
**担当**: Backend  
**推定時間**: 3時間  
**依存関係**: [BE-002: データベーススキーマ]  
**優先度**: 高（Phase 1）

## 概要
ユーザープロファイル管理、植物管理、水やり記録などのユーザー関連API実装。

## TODO リスト

- [x] プロファイル取得・更新API ✅ 2025-01-29
- [x] ユーザー植物管理API ✅ 2025-01-29
- [x] 水やり記録API ✅ 2025-01-29
- [x] **ゲストデータ移行API**（Edge Function） ✅ 2025-01-29
- [ ] 通知設定API
- [ ] プレミアムステータス管理
- [x] アバター画像アップロード ✅ 2025-01-29

## Edge Functions実装

### user-profile Function
```typescript
// supabase/functions/user-profile/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const method = req.method;
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // ユーザー認証
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      throw new Error('Not authenticated');
    }

    // GET: プロファイル取得
    if (method === 'GET') {
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // 統計情報も含める
      const { data: stats } = await supabaseClient
        .from('user_plants')
        .select('id')
        .eq('user_id', user.id);

      const { data: wateringStats } = await supabaseClient
        .from('watering_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('watered_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...profile,
            stats: {
              total_plants: stats?.length || 0,
              waterings_this_month: wateringStats?.length || 0,
              member_since: profile.created_at,
            },
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // PUT: プロファイル更新
    if (method === 'PUT') {
      const updates = await req.json();
      
      // 許可された更新フィールドのみ
      const allowedFields = ['name', 'avatar_url', 'preferences', 'onboarding_completed'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {});

      const { data, error } = await supabaseClient
        .from('profiles')
        .update(filteredUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          data,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Method ${method} not allowed`);
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'PROFILE_ERROR',
          message: error.message,
        },
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

### user-plants Function
```typescript
// supabase/functions/user-plants/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const method = req.method;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const plantId = pathParts[pathParts.length - 1];

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // ユーザー認証
    const authHeader = req.headers.get('Authorization');
    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      throw new Error('Not authenticated');
    }

    // GET: ユーザーの植物一覧
    if (method === 'GET' && !plantId) {
      const { data, error } = await supabaseClient
        .from('user_plants')
        .select(`
          *,
          plant:plants(*),
          watering_logs(
            id,
            watered_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 次の水やり日を計算
      const plantsWithSchedule = data.map(userPlant => {
        const lastWatered = userPlant.last_watered 
          ? new Date(userPlant.last_watered)
          : new Date(userPlant.created_at);
        
        const nextWaterDate = new Date(lastWatered);
        nextWaterDate.setDate(nextWaterDate.getDate() + (userPlant.water_frequency_days || 7));
        
        const daysUntilWatering = Math.ceil(
          (nextWaterDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        // 健康状態を更新
        let healthStatus = 'healthy';
        if (daysUntilWatering < -3) healthStatus = 'danger';
        else if (daysUntilWatering < 0) healthStatus = 'warning';

        return {
          ...userPlant,
          next_water_date: nextWaterDate.toISOString().split('T')[0],
          days_until_watering: Math.max(0, daysUntilWatering),
          health_status: healthStatus,
        };
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: plantsWithSchedule,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST: 植物を追加
    if (method === 'POST') {
      const plantData = await req.json();

      // 無料プランの制限チェック
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('is_premium, plants_count')
        .eq('id', user.id)
        .single();

      if (!profile.is_premium && profile.plants_count >= 5) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'LIMIT_EXCEEDED',
              message: '無料プランでは5つまでしか植物を登録できません',
            },
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('user_plants')
        .insert({
          ...plantData,
          user_id: user.id,
        })
        .select(`
          *,
          plant:plants(*)
        `)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          data,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // PUT: 植物情報を更新
    if (method === 'PUT' && plantId) {
      const updates = await req.json();
      
      const { data, error } = await supabaseClient
        .from('user_plants')
        .update(updates)
        .eq('id', plantId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          data,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DELETE: 植物を削除
    if (method === 'DELETE' && plantId) {
      const { error } = await supabaseClient
        .from('user_plants')
        .delete()
        .eq('id', plantId)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          message: '植物を削除しました',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Method ${method} not allowed`);
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'USER_PLANTS_ERROR',
          message: error.message,
        },
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

### water-plant Function
```typescript
// supabase/functions/water-plant/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const { plant_id, amount, notes } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // ユーザー認証
    const authHeader = req.headers.get('Authorization');
    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      throw new Error('Not authenticated');
    }

    // 植物の所有権確認
    const { data: userPlant, error: plantError } = await supabaseClient
      .from('user_plants')
      .select('*')
      .eq('id', plant_id)
      .eq('user_id', user.id)
      .single();

    if (plantError || !userPlant) {
      throw new Error('Plant not found or not owned by user');
    }

    // 水やり記録を作成
    const { data: wateringLog, error: logError } = await supabaseClient
      .from('watering_logs')
      .insert({
        user_plant_id: plant_id,
        amount,
        notes,
      })
      .select()
      .single();

    if (logError) throw logError;

    // 植物の最終水やり日を更新
    const { error: updateError } = await supabaseClient
      .from('user_plants')
      .update({
        last_watered: new Date().toISOString(),
        health_status: 'healthy',
      })
      .eq('id', plant_id);

    if (updateError) throw updateError;

    // 統計を更新（AI相談カウントなど）
    await supabaseClient.rpc('increment_stats', {
      user_id: user.id,
      stat_type: 'waterings',
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: wateringLog,
        message: '水やりを記録しました',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'WATERING_ERROR',
          message: error.message,
        },
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

## アバターアップロード

### upload-avatar Function
```typescript
// supabase/functions/upload-avatar/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ユーザー認証
    const authHeader = req.headers.get('Authorization');
    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      throw new Error('Not authenticated');
    }

    // ファイル名を生成
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    // ストレージにアップロード
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('user-avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 公開URLを取得
    const { data: { publicUrl } } = supabaseClient.storage
      .from('user-avatars')
      .getPublicUrl(fileName);

    // プロファイルを更新
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          avatar_url: publicUrl,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error.message,
        },
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

## APIエンドポイント仕様

### GET/PUT /functions/v1/user-profile
```
GET レスポンス:
{
  "success": true,
  "data": {
    "id": string,
    "email": string,
    "name": string,
    "avatar_url": string,
    "is_premium": boolean,
    "stats": {
      "total_plants": number,
      "waterings_this_month": number,
      "member_since": string
    }
  }
}

PUT リクエスト:
{
  "name": string,
  "avatar_url": string,
  "preferences": object,
  "onboarding_completed": boolean
}
```

### CRUD /functions/v1/user-plants
```
GET レスポンス:
{
  "success": true,
  "data": UserPlant[]
}

POST リクエスト:
{
  "plant_id": string,
  "nickname": string,
  "location": string,
  "water_frequency_days": number
}

PUT リクエスト (/user-plants/:id):
{
  "nickname": string,
  "location": string,
  "notes": string
}

DELETE レスポンス (/user-plants/:id):
{
  "success": true,
  "message": "植物を削除しました"
}
```

### POST /functions/v1/water-plant
```
リクエスト:
{
  "plant_id": string,
  "amount": string (optional),
  "notes": string (optional)
}

レスポンス:
{
  "success": true,
  "data": WateringLog,
  "message": "水やりを記録しました"
}
```

## 完了条件
- [x] プロファイル管理API実装 ✅ 2025-01-29
- [x] ユーザー植物CRUD実装 ✅ 2025-01-29
- [x] 水やり記録API実装 ✅ 2025-01-29
- [x] アバターアップロード実装 ✅ 2025-01-29
- [x] 制限チェック実装（無料プラン） ✅ 2025-01-29
- [x] エラーハンドリング実装 ✅ 2025-01-29
- [x] ゲストデータ移行API実装 ✅ 2025-01-29

## 備考
- 無料プランは5つまでの植物制限
- アバター画像は5MB以下
- 水やりスケジュール自動計算

## 関連ファイル
- `supabase/functions/user-profile/` - プロファイルAPI
- `supabase/functions/user-plants/` - 植物管理API
- `supabase/functions/water-plant/` - 水やりAPI
- `supabase/functions/upload-avatar/` - アバターアップロード

最終更新: 2025-08-28

## Auto-PR（Claude用）

目的:
- ユーザーAPI（プロフィール取得/更新等）の最小実装を追加しPR作成

ブランチ:
- feat/<TICKET-ID>-users-api

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] 認証済みユーザーのみアクセス
- [ ] RLSポリシーと整合

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-users-api
git add -A && git commit -m "[<TICKET-ID}] add users api"
git push -u origin feat/<TICKET-ID>-users-api
gh pr create --fill --base main --head feat/<TICKET-ID>-users-api
```
