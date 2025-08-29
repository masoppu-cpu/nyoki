import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { room_analysis } = await req.json()
    
    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
          },
        }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          } 
        }
      )
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証に失敗しました',
          },
        }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          } 
        }
      )
    }

    // Prepare recommendations array
    const recommendations: any[] = []
    
    // Light level mapping
    const lightMap: { [key: string]: string } = {
      'bright': '明るい場所',
      'moderate': '明るい日陰',
      'low': '日陰',
    }

    // 1. Get plants based on light conditions
    if (room_analysis?.light_level && lightMap[room_analysis.light_level]) {
      const { data: lightPlants, error: lightError } = await supabaseClient
        .from('plants')
        .select('*')
        .eq('is_available', true)
        .ilike('light_requirement', `%${lightMap[room_analysis.light_level]}%`)
        .limit(5)

      if (!lightError && lightPlants) {
        recommendations.push(...lightPlants.map(p => ({ ...p, match_reason: 'light' })))
      }
    }

    // 2. Get beginner-friendly plants
    const { data: beginnerPlants, error: beginnerError } = await supabaseClient
      .from('plants')
      .select('*')
      .eq('is_available', true)
      .ilike('difficulty', '%初級%')
      .limit(3)

    if (!beginnerError && beginnerPlants) {
      recommendations.push(...beginnerPlants.map(p => ({ ...p, match_reason: 'beginner' })))
    }

    // 3. Get popular plants
    const { data: popularPlants, error: popularError } = await supabaseClient
      .from('plants')
      .select('*')
      .eq('is_available', true)
      .order('popularity_score', { ascending: false })
      .limit(3)

    if (!popularError && popularPlants) {
      recommendations.push(...popularPlants.map(p => ({ ...p, match_reason: 'popular' })))
    }

    // Remove duplicates and calculate scores
    const uniquePlantsMap = new Map()
    
    recommendations.forEach(plant => {
      if (!uniquePlantsMap.has(plant.id)) {
        // Calculate recommendation score
        let score = 0.5 // Base score
        
        // Light matching bonus
        if (plant.match_reason === 'light') {
          score += 0.3
        }
        
        // Beginner-friendly bonus
        if (plant.match_reason === 'beginner' || plant.difficulty?.includes('初級')) {
          score += 0.2
        }
        
        // Popularity bonus (normalized)
        if (plant.popularity_score) {
          score += (plant.popularity_score / 100) * 0.1
        }
        
        // Cap at 1.0
        score = Math.min(score, 1.0)
        
        uniquePlantsMap.set(plant.id, {
          ...plant,
          recommendation_score: score,
          recommendation_reason: generateReason(plant, room_analysis),
        })
      }
    })

    // Convert to array and sort by score
    const scoredPlants = Array.from(uniquePlantsMap.values())
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 5) // Top 5 recommendations

    // Save recommendations if analysis_id is provided
    if (room_analysis?.id && scoredPlants.length > 0) {
      // Save each recommendation
      for (const plant of scoredPlants) {
        const { error: insertError } = await supabaseClient
          .from('recommended_plants')
          .insert({
            analysis_id: room_analysis.id,
            plant_id: plant.id,
            recommendation_score: plant.recommendation_score,
            reason: plant.recommendation_reason,
            placement_suggestion: generatePlacementSuggestion(plant, room_analysis),
          })
        
        if (insertError) {
          console.error('Failed to save recommendation:', insertError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: scoredPlants,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    )
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
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    )
  }
})

function generateReason(plant: any, analysis: any): string {
  const reasons: string[] = []
  
  if (plant.difficulty?.includes('初級')) {
    reasons.push('育てやすく初心者の方にもおすすめ')
  }
  
  if (analysis?.light_level === 'low' && plant.light_requirement?.includes('日陰')) {
    reasons.push('日当たりが少ない環境でも元気に育ちます')
  }
  
  if (plant.water_frequency?.includes('月2')) {
    reasons.push('水やりの頻度が少なく管理が簡単')
  }

  if (plant.popularity_score && plant.popularity_score > 80) {
    reasons.push('人気の高い植物です')
  }
  
  return reasons.length > 0 ? reasons.join('。') + '。' : '部屋の環境に適しています。'
}

function generatePlacementSuggestion(plant: any, analysis: any): string {
  const suggestions: string[] = []
  
  if (plant.light_requirement?.includes('明るい')) {
    suggestions.push('窓際など明るい場所に配置してください')
  } else if (plant.light_requirement?.includes('日陰')) {
    suggestions.push('直射日光を避けた場所に配置してください')
  }
  
  if (plant.size === 'L') {
    suggestions.push('床置きがおすすめです')
  } else if (plant.size === 'S') {
    suggestions.push('棚や台の上に配置すると良いでしょう')
  }
  
  return suggestions.length > 0 ? suggestions.join('。') + '。' : '部屋のアクセントになる場所に配置してください。'
}