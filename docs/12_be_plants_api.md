# チケット #12: 植物API実装

**タスクID**: BE-003  
**担当**: Backend  
**推定時間**: 3時間  
**依存関係**: [BE-002: データベーススキーマ]  
**優先度**: 高（Phase 1）

## 概要
植物情報を提供するAPIエンドポイントの実装。CRUD操作とフィルタリング機能。
購入導線は外部リンク（`plants.purchase_links`）を返し、アプリ内での決済は行わない。

## TODO リスト

- [x] 植物一覧API ✅ 2025-01-29
- [ ] 植物詳細API（一覧APIで詳細も取得可能）
- [x] 植物検索API ✅ 2025-01-29
- [x] カテゴリ別フィルター ✅ 2025-01-29
- [x] おすすめ植物API ✅ 2025-01-29
- [x] 人気順ソート ✅ 2025-01-29

## Edge Functions実装

### get-plants Function
```typescript
// supabase/functions/get-plants/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);
    
    // Supabaseクライアント作成
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // クエリビルド
    let query = supabaseClient
      .from('plants')
      .select('*')
      .eq('is_available', true);

    // フィルタリング
    if (params.category) {
      query = query.eq('category', params.category);
    }
    if (params.size) {
      query = query.eq('size', params.size);
    }
    if (params.difficulty) {
      query = query.eq('difficulty', params.difficulty);
    }
    if (params.min_price) {
      query = query.gte('price', parseInt(params.min_price));
    }
    if (params.max_price) {
      query = query.lte('price', parseInt(params.max_price));
    }

    // ソート
    const sortBy = params.sort_by || 'popularity_score';
    const sortOrder = params.sort_order === 'asc' ? true : false;
    query = query.order(sortBy, { ascending: sortOrder });

    // ページネーション
    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '20');
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // 実行
    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          items: data,
          total: count,
          page,
          limit,
        },
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'FETCH_ERROR',
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

### search-plants Function
```typescript
// supabase/functions/search-plants/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const { query } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: '検索クエリは2文字以上で入力してください',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // フルテキスト検索
    const { data, error } = await supabaseClient
      .from('plants')
      .select('*')
      .textSearch('name', query, {
        type: 'websearch',
        config: 'japanese',
      })
      .eq('is_available', true)
      .limit(20);

    if (error) throw error;

    // タグ検索も追加
    const { data: tagResults } = await supabaseClient
      .from('plants')
      .select('*')
      .contains('tags', [query])
      .eq('is_available', true)
      .limit(10);

    // 結果をマージして重複削除
    const mergedResults = [...data, ...(tagResults || [])];
    const uniqueResults = Array.from(
      new Map(mergedResults.map(item => [item.id, item])).values()
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: uniqueResults,
        query,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
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

### get-recommended-plants Function
```typescript
// supabase/functions/get-recommended-plants/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const { room_analysis } = await req.json();
    
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

    // 部屋の条件に基づいて推奨植物を取得
    let recommendations = [];

    // 光量による推奨
    if (room_analysis?.light_level) {
      const lightMap = {
        'bright': '明るい日向',
        'moderate': '明るい日陰',
        'low': '日陰OK',
      };

      const { data: lightPlants } = await supabaseClient
        .from('plants')
        .select('*')
        .eq('light_requirement', lightMap[room_analysis.light_level] || '日陰OK')
        .eq('is_available', true)
        .limit(5);

      recommendations.push(...(lightPlants || []));
    }

    // 初心者向けの植物を追加
    const { data: beginnerPlants } = await supabaseClient
      .from('plants')
      .select('*')
      .eq('difficulty', '初心者向け')
      .eq('is_available', true)
      .limit(3);

    recommendations.push(...(beginnerPlants || []));

    // 人気の植物を追加
    const { data: popularPlants } = await supabaseClient
      .from('plants')
      .select('*')
      .eq('is_available', true)
      .order('popularity_score', { ascending: false })
      .limit(3);

    recommendations.push(...(popularPlants || []));

    // 重複削除とスコアリング
    const uniquePlants = Array.from(
      new Map(recommendations.map(p => [p.id, p])).values()
    );

    // スコアを計算
    const scoredPlants = uniquePlants.map(plant => {
      let score = 0.5; // 基本スコア

      // 光量マッチ
      if (room_analysis?.light_level && 
          plant.light_requirement === lightMap[room_analysis.light_level]) {
        score += 0.3;
      }

      // 初心者向け
      if (plant.difficulty === '初心者向け') {
        score += 0.2;
      }

      return { ...plant, recommendation_score: score };
    });

    // スコア順でソート
    scoredPlants.sort((a, b) => b.recommendation_score - a.recommendation_score);

    // 上位5件を返す
    const topRecommendations = scoredPlants.slice(0, 5);

    // 推奨履歴を保存
    if (room_analysis?.id) {
      for (const plant of topRecommendations) {
        await supabaseClient
          .from('recommended_plants')
          .insert({
            analysis_id: room_analysis.id,
            plant_id: plant.id,
            recommendation_score: plant.recommendation_score,
            reason: generateReason(plant, room_analysis),
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: topRecommendations,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'RECOMMENDATION_ERROR',
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

function generateReason(plant: any, analysis: any): string {
  const reasons = [];
  
  if (plant.difficulty === '初心者向け') {
    reasons.push('育てやすく初心者の方にもおすすめ');
  }
  
  if (analysis?.light_level === 'low' && plant.light_requirement === '日陰OK') {
    reasons.push('日当たりが少ない環境でも元気に育ちます');
  }
  
  if (plant.water_frequency === '月2-3回') {
    reasons.push('水やりの頻度が少なく管理が簡単');
  }
  
  return reasons.join('。') + '。';
}
```

## Supabase RPC Functions

### get_plants_by_filters（SQL関数）
```sql
-- 複雑なフィルタリング用のRPC関数
CREATE OR REPLACE FUNCTION get_plants_by_filters(
  p_categories text[],
  p_sizes text[],
  p_difficulties text[],
  p_min_price int,
  p_max_price int,
  p_search_query text
) RETURNS SETOF plants AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM plants
  WHERE 
    is_available = true
    AND (p_categories IS NULL OR category = ANY(p_categories))
    AND (p_sizes IS NULL OR size = ANY(p_sizes))
    AND (p_difficulties IS NULL OR difficulty = ANY(p_difficulties))
    AND (p_min_price IS NULL OR price >= p_min_price)
    AND (p_max_price IS NULL OR price <= p_max_price)
    AND (
      p_search_query IS NULL 
      OR name ILIKE '%' || p_search_query || '%'
      OR description ILIKE '%' || p_search_query || '%'
    )
  ORDER BY popularity_score DESC;
END;
$$ LANGUAGE plpgsql;
```

## APIエンドポイント仕様

### GET /functions/v1/get-plants
```
パラメータ:
- category: string (optional)
- size: S | M | L (optional)
- difficulty: 初心者向け | 中級者向け | 上級者向け (optional)
- min_price: number (optional)
- max_price: number (optional)
- sort_by: popularity_score | price | created_at (default: popularity_score)
- sort_order: asc | desc (default: desc)
- page: number (default: 1)
- limit: number (default: 20)

レスポンス:
{
  "success": true,
  "data": {
    "items": Plant[],
    "total": number,
    "page": number,
    "limit": number
  }
}
```

### POST /functions/v1/search-plants
```
リクエストボディ:
{
  "query": string (required, min 2 characters)
}

レスポンス:
{
  "success": true,
  "data": Plant[],
  "query": string
}
```

### POST /functions/v1/get-recommended-plants
```
リクエストボディ:
{
  "room_analysis": {
    "id": string,
    "light_level": "bright" | "moderate" | "low",
    "humidity_level": string,
    "temperature_range": string
  }
}

レスポンス:
{
  "success": true,
  "data": PlantWithScore[]
}
```

## デプロイ

```bash
# Edge Functionsのデプロイ
supabase functions deploy get-plants
supabase functions deploy search-plants
supabase functions deploy get-recommended-plants

# 環境変数設定
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJxxxxx...
```

## 完了条件
- [x] 植物一覧API実装 ✅ 2025-01-29
- [x] 検索API実装 ✅ 2025-01-29
- [x] 推奨API実装 ✅ 2025-01-29
- [x] フィルタリング機能実装 ✅ 2025-01-29
- [x] ページネーション実装 ✅ 2025-01-29
- [x] エラーハンドリング実装 ✅ 2025-01-29

## 備考
- 日本語フルテキスト検索対応
- パフォーマンス最適化（インデックス使用）
- レート制限の考慮

## 関連ファイル
- `supabase/functions/get-plants/` - 植物一覧API
- `supabase/functions/search-plants/` - 検索API
- `supabase/functions/get-recommended-plants/` - 推奨API

最終更新: 2025-08-28

## Auto-PR（Claude用）

目的:
- 植物API（一覧/詳細/検索）のEdge Functionsを最小実装しPRを作成

ブランチ:
- feat/<TICKET-ID>-plants-api

コミット規約:
- [<TICKET-ID>] で始める

動作確認（最低限）:
- [ ] /functions/v1/get-plants が動作
- [ ] /functions/v1/search-plants が動作

実行手順（Claude）:
```bash
git switch -c feat/<TICKET-ID>-plants-api
git add -A && git commit -m "[<TICKET-ID}] add plants api functions"
git push -u origin feat/<TICKET-ID>-plants-api
gh pr create --fill --base main --head feat/<TICKET-ID>-plants-api
```
