import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

serve(async (req: Request) => {
  try {
    // CORSプリフライトリクエスト対応
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Only POST method is allowed',
          },
        }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { plant_id, amount, notes } = await req.json();

    if (!plant_id) {
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

    // 植物の所有権確認
    const { data: userPlant, error: plantError } = await supabaseClient
      .from('user_plants')
      .select('*')
      .eq('id', plant_id)
      .eq('user_id', user.id)
      .single();

    if (plantError || !userPlant) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Plant not found or not owned by user',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 水やり記録を作成
    const wateringData = {
      user_plant_id: plant_id,
      amount: amount || '適量',
      notes: notes || null,
      watered_at: new Date().toISOString(),
    };

    const { data: wateringLog, error: logError } = await supabaseClient
      .from('watering_logs')
      .insert(wateringData)
      .select()
      .single();

    if (logError) throw logError;

    // 植物の最終水やり日と健康状態を更新
    const { error: updateError } = await supabaseClient
      .from('user_plants')
      .update({
        last_watered: new Date().toISOString(),
        health_status: 'healthy',
        updated_at: new Date().toISOString(),
      })
      .eq('id', plant_id);

    if (updateError) throw updateError;

    // 次の水やり予定日を計算
    const waterFrequency = userPlant.water_frequency_days || 7;
    const nextWaterDate = new Date();
    nextWaterDate.setDate(nextWaterDate.getDate() + waterFrequency);

    // 成功レスポンス
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...wateringLog,
          next_water_date: nextWaterDate.toISOString().split('T')[0],
        },
        message: '水やりを記録しました',
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    console.error('Error in water-plant function:', error);
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