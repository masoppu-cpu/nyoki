import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, imageUrl } = await req.json()

    if (!image && !imageUrl) {
      throw new Error('Either image data or imageUrl is required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header for user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // TODO: Integrate with Google Gemini API for room analysis
    // For now, return a mock response
    const analysisResult = {
      lightLevel: 'moderate',
      lightDirection: 'north',
      humidity: 'normal',
      temperature: 'optimal',
      spaceAvailable: true,
      floorType: 'wood',
      wallColor: 'white',
      windowPresent: true,
      recommendedPlants: [
        {
          plantId: 'monstera-001',
          name: 'モンステラ',
          confidence: 0.85,
          reason: '北向きの窓からの間接光に適している'
        },
        {
          plantId: 'pothos-001',
          name: 'ポトス',
          confidence: 0.80,
          reason: '室内の明るさと湿度に適応しやすい'
        },
        {
          plantId: 'sansevieria-001',
          name: 'サンスベリア',
          confidence: 0.75,
          reason: '低光量でも育ちやすく初心者向け'
        }
      ],
      suggestedPlacements: [
        {
          x: 0.3,
          y: 0.5,
          description: '窓際の棚'
        },
        {
          x: 0.7,
          y: 0.6,
          description: 'サイドテーブル'
        }
      ]
    }

    // Store analysis result in database if user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (user && !userError) {
      // Save analysis to database
      const { error: insertError } = await supabase
        .from('room_analyses')
        .insert({
          user_id: user.id,
          image_url: imageUrl || 'data:image/base64',
          analysis_result: analysisResult
        })

      if (insertError) {
        console.error('Error saving analysis:', insertError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: analysisResult 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in analyze-room function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})