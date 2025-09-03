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

    const { 
      room_image_url, 
      plants, 
      style, 
      placement_guide 
    } = await req.json();

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
            message: '無料プランではAI画像生成は月5回までです',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Gemini 2.0 Flash Image生成（モック実装）
    // TODO: 実際のGemini API統合（APIキー設定後）
    const prompt = `
      部屋の画像に以下の植物を自然に配置してください：
      ${plants.map(p => p.name).join(', ')}
      
      配置スタイル: ${placement_guide}
      
      要件：
      - 植物が自然に部屋に溶け込むように
      - 光の当たり方を考慮
      - サイズ感を適切に
      - ${style}スタイルで配置
    `;

    // モック画像URL生成
    const fallbackImages = {
      natural: 'https://example.com/ar-natural-fallback.jpg',
      modern: 'https://example.com/ar-modern-fallback.jpg', 
      minimal: 'https://example.com/ar-minimal-fallback.jpg',
    };
    
    const generatedImageUrl = fallbackImages[style] || fallbackImages.natural;

    // 生成履歴を保存
    const { data: generation, error: genError } = await supabaseClient
      .from('ar_generations')
      .insert({
        user_id: user.id,
        room_image_url,
        generated_image_url: generatedImageUrl,
        plants: plants.map(p => p.id),
        style,
        prompt,
        is_successful: true,
      })
      .select()
      .single();

    if (genError) {
      console.error('Generation save error:', genError);
    }

    // 生成回数を更新
    const currentCount = profile?.ai_generation_count || profile?.ai_analysis_count || 0;
    await supabaseClient
      .from('profiles')
      .update({ 
        ai_analysis_count: currentCount + 1 
      })
      .eq('id', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          image_url: generatedImageUrl,
          generation_id: generation?.id,
          style,
          prompt,
          is_fallback: true, // モック実装のため常にtrue
        },
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('配置画像生成エラー:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'GENERATION_ERROR',
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