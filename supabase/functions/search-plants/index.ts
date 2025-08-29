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
    const { query } = await req.json()
    
    // Validate query
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: '検索クエリは2文字以上で入力してください',
          },
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          } 
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Search by name and scientific_name using ilike
    const searchPattern = `%${query}%`
    
    const { data: nameResults, error: nameError } = await supabaseClient
      .from('plants')
      .select('*')
      .eq('is_available', true)
      .or(`name.ilike.${searchPattern},scientific_name.ilike.${searchPattern},name_en.ilike.${searchPattern}`)
      .limit(20)

    if (nameError) throw nameError

    // Search in tags array
    const { data: tagResults, error: tagError } = await supabaseClient
      .from('plants')
      .select('*')
      .eq('is_available', true)
      .contains('tags', [query])
      .limit(10)

    if (tagError && tagError.code !== 'PGRST116') {
      // Ignore "column does not exist" errors for tags as it might be null
      console.error('Tag search error:', tagError)
    }

    // Merge results and remove duplicates
    const allResults = [...(nameResults || [])]
    if (tagResults) {
      tagResults.forEach(tagResult => {
        if (!allResults.find(r => r.id === tagResult.id)) {
          allResults.push(tagResult)
        }
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: allResults,
        query,
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
          code: 'SEARCH_ERROR',
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