import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

serve(async (req: Request) => {
  try {
    const method = req.method;
    
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

    // GET: プロファイル取得
    if (method === 'GET') {
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // プロファイルが存在しない場合は作成
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabaseClient
            .from('profiles')
            .insert({
              id: user.id,
              name: user.email?.split('@')[0] || 'User',
              preferences: {},
            })
            .select()
            .single();

          if (createError) throw createError;

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                ...newProfile,
                stats: {
                  total_plants: 0,
                  waterings_this_month: 0,
                  member_since: newProfile.created_at,
                },
              },
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }

      // 統計情報も含める
      const { data: stats } = await supabaseClient
        .from('user_plants')
        .select('id')
        .eq('user_id', user.id);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: wateringStats } = await supabaseClient
        .from('watering_logs')
        .select('watering_logs.id')
        .eq('user_plants.user_id', user.id)
        .gte('watered_at', thirtyDaysAgo.toISOString());

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
      const filteredUpdates: Record<string, any> = {};
      
      for (const key of allowedFields) {
        if (key in updates) {
          filteredUpdates[key] = updates[key];
        }
      }

      filteredUpdates.updated_at = new Date().toISOString();

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

    // OPTIONS: CORS対応
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    throw new Error(`Method ${method} not allowed`);
  } catch (error) {
    console.error('Error in user-profile function:', error);
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