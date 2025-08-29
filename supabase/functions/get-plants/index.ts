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
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams)
    
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

    // Build query
    let query = supabaseClient
      .from('plants')
      .select('*', { count: 'exact' })
      .eq('is_available', true)

    // Apply filters
    if (params.category) {
      query = query.eq('category', params.category)
    }
    if (params.size) {
      query = query.eq('size', params.size)
    }
    if (params.difficulty) {
      query = query.eq('difficulty', params.difficulty)
    }
    if (params.min_price) {
      query = query.gte('price', parseInt(params.min_price))
    }
    if (params.max_price) {
      query = query.lte('price', parseInt(params.max_price))
    }

    // Apply sorting
    const sortBy = params.sort_by || 'popularity_score'
    const sortOrder = params.sort_order === 'asc' ? true : false
    query = query.order(sortBy, { ascending: sortOrder })

    // Apply pagination
    const page = parseInt(params.page || '1')
    const limit = parseInt(params.limit || '20')
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data, error, count } = await query

    if (error) throw error

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
          code: 'FETCH_ERROR',
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