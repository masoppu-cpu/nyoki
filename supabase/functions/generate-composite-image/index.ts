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
    const { 
      roomImageUrl, 
      plantImageUrl, 
      placement,
      plantSize 
    } = await req.json()

    if (!roomImageUrl || !plantImageUrl) {
      throw new Error('Both roomImageUrl and plantImageUrl are required')
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

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (!user || userError) {
      throw new Error('User not authenticated')
    }

    // Check if user is premium or has remaining free uses
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    // TODO: Implement usage limiting logic
    // For free users: limit to 5 generations per month
    // For premium users: unlimited

    // TODO: Integrate with Google Gemini API for image composition
    // For now, return a mock composite image URL
    
    // Mock implementation - in production, this would:
    // 1. Download both images
    // 2. Use Gemini API or other image processing to create composite
    // 3. Upload result to Supabase Storage
    // 4. Return the URL

    const mockCompositeUrl = `${supabaseUrl}/storage/v1/object/public/composite-images/mock-composite-${Date.now()}.jpg`

    const result = {
      compositeImageUrl: mockCompositeUrl,
      placement: placement || { x: 0.5, y: 0.5 },
      scale: plantSize || 1.0,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId: user.id,
        isPremium: profile?.is_premium || false
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in generate-composite-image function:', error)
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