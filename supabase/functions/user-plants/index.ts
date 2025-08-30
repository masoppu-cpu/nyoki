import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

serve(async (req: Request) => {
  try {
    const method = req.method;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const plantId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // ユーザー認証
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // GET: ユーザーの植物一覧
    if (method === 'GET' && !plantId) {
      const { data, error } = await supabaseClient
        .from('user_plants')
        .select(`
          *,
          plant:plants(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 次の水やり日を計算
      const plantsWithSchedule = (data || []).map(userPlant => {
        const lastWatered = userPlant.last_watered 
          ? new Date(userPlant.last_watered)
          : new Date(userPlant.created_at);
        
        const waterFrequency = userPlant.water_frequency_days || 7;
        const nextWaterDate = new Date(lastWatered);
        nextWaterDate.setDate(nextWaterDate.getDate() + waterFrequency);
        
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
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // GET: 特定の植物詳細
    if (method === 'GET' && plantId) {
      const { data, error } = await supabaseClient
        .from('user_plants')
        .select(`
          *,
          plant:plants(*),
          watering_logs(
            id,
            watered_at,
            amount,
            notes
          )
        `)
        .eq('id', plantId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Plant not found',
              },
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          data,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST: 植物を追加
    if (method === 'POST' && !plantId) {
      const plantData = await req.json();

      // 無料プランの制限チェック
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('is_premium, plants_count')
        .eq('id', user.id)
        .single();

      if (profile && !profile.is_premium && (profile.plants_count || 0) >= 5) {
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

      // 必須フィールドの検証
      if (!plantData.plant_id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'plant_id is required',
            },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('user_plants')
        .insert({
          user_id: user.id,
          plant_id: plantData.plant_id,
          nickname: plantData.nickname || null,
          location: plantData.location || null,
          water_frequency_days: plantData.water_frequency_days || 7,
          notes: plantData.notes || null,
          purchase_price: plantData.purchase_price || null,
        })
        .select(`
          *,
          plant:plants(*)
        `)
        .single();

      if (error) throw error;

      // plants_countを更新
      if (profile) {
        await supabaseClient
          .from('profiles')
          .update({ 
            plants_count: (profile.plants_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data,
        }),
        { 
          status: 201,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // PUT: 植物情報を更新
    if (method === 'PUT' && plantId) {
      const updates = await req.json();
      
      // 許可された更新フィールドのみ
      const allowedFields = [
        'nickname',
        'location',
        'notes',
        'water_frequency_days',
        'health_status',
        'growth_stage',
        'image_url',
        'is_favorite',
      ];
      
      const filteredUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in updates) {
          filteredUpdates[key] = updates[key];
        }
      }
      
      filteredUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseClient
        .from('user_plants')
        .update(filteredUpdates)
        .eq('id', plantId)
        .eq('user_id', user.id)
        .select(`
          *,
          plant:plants(*)
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Plant not found',
              },
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }

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
      // 所有権確認
      const { data: existing } = await supabaseClient
        .from('user_plants')
        .select('id')
        .eq('id', plantId)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Plant not found',
            },
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('user_plants')
        .delete()
        .eq('id', plantId)
        .eq('user_id', user.id);

      if (error) throw error;

      // plants_countを更新
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('plants_count')
        .eq('id', user.id)
        .single();

      if (profile && profile.plants_count > 0) {
        await supabaseClient
          .from('profiles')
          .update({ 
            plants_count: profile.plants_count - 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: '植物を削除しました',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // OPTIONS: CORS対応
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    throw new Error(`Method ${method} not allowed`);
  } catch (error) {
    console.error('Error in user-plants function:', error);
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