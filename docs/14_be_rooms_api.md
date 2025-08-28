# チケット #14: 部屋データAPI実装

**タスクID**: BE-005  
**担当**: Backend  
**推定時間**: 4時間  
**依存関係**: [BE-002: データベーススキーマ]  
**優先度**: 高（Phase 1）

## 概要
部屋画像分析、配置画像生成（2D合成）、分析/生成履歴管理のAPI実装。Gemini APIとの連携を含む。

## TODO リスト

- [ ] 部屋画像アップロードAPI
- [ ] AI分析リクエストAPI
- [ ] 配置画像生成API
- [ ] 分析履歴取得API
- [ ] Gemini API統合
- [ ] 画像最適化処理

## Edge Functions実装

### analyze-room Function
```typescript
// supabase/functions/analyze-room/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.0'

serve(async (req: Request) => {
  try {
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
    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

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
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 画像をアップロード（base64の場合）
    let finalImageUrl = image_url;
    if (image_base64) {
      finalImageUrl = await uploadImage(supabaseClient, user.id, image_base64);
    }

    // Gemini APIで分析
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
    // 仕様に合わせてFlash系モデルに統一
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });

    const prompt = `
      この部屋の画像を分析して、以下の項目について評価してください：
      
      1. 光量レベル（bright/moderate/low）
      2. 湿度レベル（high/normal/low）
      3. 温度環境（warm/moderate/cool）
      4. 部屋のサイズ（large/medium/small）
      5. インテリアスタイル（modern/natural/minimal/cozy）
      6. 植物を置くのに適した場所（窓際、棚、床など）
      
      JSON形式で回答してください：
      {
        "light_level": "moderate",
        "humidity_level": "normal",
        "temperature_range": "moderate",
        "room_size": "medium",
        "interior_style": "modern",
        "placement_suggestions": ["窓際", "テレビ台横"],
        "analysis_notes": "明るい日陰で、植物育成に適した環境です"
      }
    `;

    // 画像を取得してGeminiに送信
    let imageData;
    if (image_base64) {
      imageData = {
        inlineData: {
          data: image_base64,
          mimeType: 'image/jpeg',
        },
      };
    } else {
      // URLから画像データを取得
      const imageResponse = await fetch(finalImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      imageData = {
        inlineData: {
          data: btoa(String.fromCharCode(...new Uint8Array(imageBuffer))),
          mimeType: 'image/jpeg',
        },
      };
    }

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();
    
    // JSONパース
    let analysisResult;
    try {
      // マークダウンのコードブロックを除去
      const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      // パース失敗時はデフォルト値
      analysisResult = {
        light_level: 'moderate',
        humidity_level: 'normal',
        temperature_range: 'moderate',
        room_size: 'medium',
        interior_style: 'natural',
        placement_suggestions: ['窓際がおすすめです'],
        analysis_notes: '植物育成に適した環境です',
      };
    }

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
        ai_prompt: prompt,
        ai_response: text,
        is_successful: true,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // 分析回数を更新
    await supabaseClient
      .from('profiles')
      .update({ 
        ai_analysis_count: profile.ai_analysis_count + 1 
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
      { headers: { 'Content-Type': 'application/json' } }
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
        headers: { 'Content-Type': 'application/json' } 
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
```

### generate-ar-image Function
```typescript
// supabase/functions/generate-ar-image/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.0'

serve(async (req: Request) => {
  try {
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
    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

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
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Gemini APIで画像生成（現時点では画像編集APIが限定的なのでモック）
    // 将来的にはDALL-E 3やStable Diffusionとの統合も検討
    
    // モック実装：スタイルに応じた事前生成画像を返す
    const styleImages = {
      natural: 'https://your-bucket.supabase.co/images/ar-natural-sample.jpg',
      modern: 'https://your-bucket.supabase.co/images/ar-modern-sample.jpg',
      minimal: 'https://your-bucket.supabase.co/images/ar-minimal-sample.jpg',
    };

    // 実際のAI画像生成プロンプト（将来実装用）
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

    // 生成結果を保存（モック）
    const generatedImageUrl = styleImages[style] || styleImages.natural;

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
    // 用途ごとにカウントを分離（生成はai_generation_count）
    await supabaseClient
      .from('profiles')
      .update({ 
        ai_generation_count: (profile.ai_generation_count ?? 0) + 1 
      })
      .eq('id', user.id);

    // 遅延をシミュレート（実際のAI生成時間を模倣）
    await new Promise(resolve => setTimeout(resolve, 3000));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          image_url: generatedImageUrl,
          generation_id: generation?.id,
          style,
          prompt,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
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
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

### room-history Function
```typescript
// supabase/functions/room-history/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

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

    // 分析履歴を取得
    const { data: analyses, error, count } = await supabaseClient
      .from('room_analyses')
      .select(`
        *,
        recommended_plants (
          plant:plants(*)
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // AR生成履歴も取得
    const { data: arGenerations } = await supabaseClient
      .from('ar_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          analyses,
          ar_generations: arGenerations || [],
          total: count,
          page: Math.floor(offset / limit) + 1,
          limit,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('History fetch error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'HISTORY_ERROR',
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

## データベーステーブル追加

### ar_generations テーブル
```sql
CREATE TABLE public.ar_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_image_url TEXT NOT NULL,
  generated_image_url TEXT NOT NULL,
  plants UUID[],
  style TEXT,
  prompt TEXT,
  is_successful BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_ar_generations_user_id ON public.ar_generations(user_id);
CREATE INDEX idx_ar_generations_created_at ON public.ar_generations(created_at DESC);
```

## APIエンドポイント仕様

### POST /functions/v1/analyze-room
```
リクエスト:
{
  "image_base64": string (optional),
  "image_url": string (optional)
}

レスポンス:
{
  "success": true,
  "data": {
    "analysis": {
      "id": string,
      "analysis_result": {
        "light_level": string,
        "humidity_level": string,
        "temperature_range": string,
        "room_size": string,
        "interior_style": string,
        "placement_suggestions": string[],
        "analysis_notes": string
      }
    },
    "recommendations": Plant[]
  }
}
```

### POST /functions/v1/generate-ar-image
```
リクエスト:
{
  "room_image_url": string,
  "plants": Plant[],
  "style": "natural" | "modern" | "minimal",
  "placement_guide": string
}

レスポンス:
{
  "success": true,
  "data": {
    "image_url": string,
    "generation_id": string,
    "style": string,
    "prompt": string
  }
}
```

### GET /functions/v1/room-history
```
パラメータ:
- limit: number (default: 10)
- offset: number (default: 0)

レスポンス:
{
  "success": true,
  "data": {
    "analyses": RoomAnalysis[],
    "ar_generations": ARGeneration[],
    "total": number,
    "page": number,
    "limit": number
  }
}
```

## 完了条件
- [ ] 部屋画像アップロード実装
- [ ] AI分析API実装
- [ ] 配置画像生成API実装（モック）
- [ ] 分析履歴API実装
- [ ] Gemini API統合
- [ ] 制限チェック実装

## 備考
- 画像生成は現在モック実装
- 将来的にDALL-E 3やStable Diffusion統合
- 無料プランは月5回まで

## 認証・呼び出し方針
- クライアントは`supabase.functions.invoke('analyze-room' | 'generate-ar-image' | 'room-history')`を使用し、
  SupabaseのセッションJWTが自動付与される経路を推奨する。

## 関連ファイル
- `supabase/functions/analyze-room/` - 部屋分析API
- `supabase/functions/generate-ar-image/` - 配置画像生成API（関数名は暫定）
- `supabase/functions/room-history/` - 履歴API

最終更新: 2025-08-28

## Auto-PR（Claude用）

目的:
- 部屋分析/配置生成/履歴のFunctionsをモックで最小実装しPR作成

ブランチ:
- feat/<TICKET-ID>-rooms-api

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] analyze-room が動作
- [ ] generate-ar-image がモックで動作

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-rooms-api
git add -A && git commit -m "[<TICKET-ID}] add rooms api functions"
git push -u origin feat/<TICKET-ID>-rooms-api
gh pr create --fill --base main --head feat/<TICKET-ID>-rooms-api
```
