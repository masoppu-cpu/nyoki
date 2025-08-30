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

    // 認証チェック
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid authentication',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // リクエストボディからゲストデータを取得
    const { guestData } = await req.json();
    
    if (!guestData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'guestData is required',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const migrations = {
      purchase_list: 0,
      analyses: 0,
      images: 0,
    };

    // 1. 購入検討リストの移行
    if (guestData.purchase_list?.items && Array.isArray(guestData.purchase_list.items)) {
      for (const item of guestData.purchase_list.items) {
        if (!item.plant_id) continue;

        // 既存のアイテムをチェック（重複を避ける）
        const { data: existing } = await supabaseClient
          .from('purchase_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('plant_id', item.plant_id)
          .single();

        if (!existing) {
          const { error } = await supabaseClient
            .from('purchase_items')
            .insert({
              user_id: user.id,
              plant_id: item.plant_id,
              status: item.is_purchased ? 'purchased' : 'considering',
              external_url: item.external_url || null,
              notes: item.notes || null,
              purchased_at: item.purchased_at || null,
              created_at: item.added_at || new Date().toISOString(),
            });
          
          if (!error) migrations.purchase_list++;
        }
      }
    }

    // 2. AI分析結果の移行
    if (guestData.analysis) {
      const analysisData: any = {
        user_id: user.id,
        analysis_result: guestData.analysis,
        created_at: guestData.analysis.created_at || new Date().toISOString(),
      };

      // 分析結果の詳細フィールドをマッピング
      if (guestData.analysis.light_level) {
        analysisData.light_level = guestData.analysis.light_level;
      }
      if (guestData.analysis.humidity_level) {
        analysisData.humidity_level = guestData.analysis.humidity_level;
      }
      if (guestData.analysis.room_size) {
        analysisData.room_size = guestData.analysis.room_size;
      }
      if (guestData.analysis.temperature_range) {
        analysisData.temperature_range = guestData.analysis.temperature_range;
      }
      if (guestData.analysis.style_preference) {
        analysisData.style_preference = guestData.analysis.style_preference;
      }

      // 3. 画像の移行（Base64 → Storage）
      if (guestData.analysis.image_base64) {
        try {
          // Base64データからバイナリに変換
          const base64Data = guestData.analysis.image_base64.replace(/^data:image\/\w+;base64,/, '');
          const decoded = atob(base64Data);
          const bytes = new Uint8Array(decoded.length);
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i);
          }
          
          // ユニークなファイル名を生成
          const timestamp = Date.now();
          const fileName = `${user.id}/${timestamp}_room.jpg`;
          
          // Storageにアップロード
          const { error: uploadError } = await supabaseClient.storage
            .from('room-images')
            .upload(fileName, bytes, {
              contentType: 'image/jpeg',
              upsert: false,
            });
          
          if (!uploadError) {
            analysisData.image_url = fileName;
            
            // サムネイル用のURLも設定
            const { data: { publicUrl } } = supabaseClient.storage
              .from('room-images')
              .getPublicUrl(fileName);
            
            analysisData.thumbnail_url = publicUrl;
            migrations.images = 1;
          }
        } catch (imageError) {
          console.error('Image migration error:', imageError);
        }
      }

      // 分析結果を保存
      const { data: roomAnalysis, error } = await supabaseClient
        .from('room_analyses')
        .insert(analysisData)
        .select()
        .single();
      
      if (!error && roomAnalysis) {
        migrations.analyses = 1;

        // 推奨植物の移行
        if (guestData.analysis.recommended_plants && Array.isArray(guestData.analysis.recommended_plants)) {
          for (const plant of guestData.analysis.recommended_plants) {
            if (!plant.plant_id) continue;

            await supabaseClient
              .from('recommended_plants')
              .insert({
                analysis_id: roomAnalysis.id,
                plant_id: plant.plant_id,
                recommendation_score: plant.score || 0.5,
                reason: plant.reason || '部屋の環境に適しています',
                placement_suggestion: plant.placement || null,
              });
          }
        }
      }
    }

    // プロファイルの初期化（必要な場合）
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      await supabaseClient
        .from('profiles')
        .insert({
          id: user.id,
          name: user.email?.split('@')[0] || 'User',
          preferences: {},
          created_at: new Date().toISOString(),
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        migrations,
        message: 'ゲストデータの移行が完了しました',
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: {
          code: 'MIGRATION_ERROR',
          message: error.message,
        },
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});