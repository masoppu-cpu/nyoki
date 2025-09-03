import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const { image_base64, image_url } = await req.json();

    if (!image_base64 && !image_url) {
      throw new Error('Either image_base64 or image_url is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // ユーザー認証
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Not authenticated');
    }

    // 無料プランの制限チェック
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_premium, ai_analysis_count')
      .eq('id', user.id)
      .single();

    if (!profile.is_premium && profile.ai_analysis_count >= 5) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: '無料プランではAI分析は月5回までです',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 画像をアップロード（base64の場合）
    let finalImageUrl = image_url;
    if (image_base64) {
      finalImageUrl = await uploadImage(supabaseClient, user.id, image_base64);
    }

    // Gemini API分析（モック実装）
    // TODO: 実際のGemini API統合（APIキー設定後）
    const analysisResult = {
      light_level: 'moderate',
      humidity_level: 'normal',
      temperature_range: 'moderate',
      room_size: 'medium',
      interior_style: 'modern',
      placement_suggestions: ['窓際', 'テレビ台横'],
      analysis_notes: '明るい日陰で、植物育成に適した環境です'
    };

    // 分析結果を保存
    const { data: roomAnalysis, error: saveError } = await supabaseClient
      .from('room_analyses')
      .insert({
        user_id: user.id,
        image_url: finalImageUrl,
        analysis_result: analysisResult,
        light_level: analysisResult.light_level,
        humidity_level: analysisResult.humidity_level,
        temperature_range: analysisResult.temperature_range,
        room_size: analysisResult.room_size,
        style_preference: analysisResult.interior_style,
        ai_prompt: 'Mock prompt',
        ai_response: JSON.stringify(analysisResult),
        is_successful: true,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // 分析回数を更新
    await supabaseClient
      .from('profiles')
      .update({ 
        ai_analysis_count: (profile?.ai_analysis_count || 0) + 1 
      })
      .eq('id', user.id);

    // おすすめ植物を取得
    const recommendedPlants = await getRecommendedPlants(
      supabaseClient,
      analysisResult,
      roomAnalysis.id
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          analysis: roomAnalysis,
          recommendations: recommendedPlants,
        },
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Room analysis error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: error.message,
        },
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

async function uploadImage(
  supabaseClient: any, 
  userId: string, 
  base64: string
): Promise<string> {
  // base64をBlobに変換
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryData = atob(base64Data);
  const bytes = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    bytes[i] = binaryData.charCodeAt(i);
  }
  
  const fileName = `${userId}/room-${Date.now()}.jpg`;
  
  const { data, error } = await supabaseClient.storage
    .from('room-images')
    .upload(fileName, bytes.buffer, {
      contentType: 'image/jpeg',
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabaseClient.storage
    .from('room-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

async function getRecommendedPlants(
  supabaseClient: any,
  analysisResult: any,
  analysisId: string
): Promise<any[]> {
  // 光量に基づいて推奨植物を選択
  const lightConditions = {
    bright: '明るい日向',
    moderate: '明るい日陰',
    low: '日陰OK',
  };

  const { data: plants } = await supabaseClient
    .from('plants')
    .select('*')
    .eq('light_requirement', lightConditions[analysisResult.light_level] || '日陰OK')
    .eq('is_available', true)
    .limit(5);

  // 初心者向け植物も追加
  const { data: beginnerPlants } = await supabaseClient
    .from('plants')
    .select('*')
    .eq('difficulty', '初心者向け')
    .eq('is_available', true)
    .limit(3);

  // 重複を除去して返す
  const allPlants = [...(plants || []), ...(beginnerPlants || [])];
  const uniquePlants = Array.from(
    new Map(allPlants.map(p => [p.id, p])).values()
  ).slice(0, 5);

  // 推奨植物を保存
  for (const plant of uniquePlants) {
    await supabaseClient
      .from('recommended_plants')
      .insert({
        analysis_id: analysisId,
        plant_id: plant.id,
        recommendation_score: 0.8,
        reason: `${analysisResult.analysis_notes} この植物は環境に適しています。`,
      });
  }

  return uniquePlants;
}