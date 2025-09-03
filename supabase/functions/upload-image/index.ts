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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'room' | 'avatar' | 'plant'
    const generateThumbnail = formData.get('thumbnail') === 'true';

    if (!file) {
      throw new Error('No file provided');
    }

    // ファイルサイズチェック
    const maxSizes = {
      room: 10 * 1024 * 1024, // 10MB
      avatar: 5 * 1024 * 1024, // 5MB
      plant: 5 * 1024 * 1024,  // 5MB
    };

    const limit = maxSizes[type] ?? 10 * 1024 * 1024;
    if (file.size > limit) {
      throw new Error(`File size exceeds limit for ${type}`);
    }

    // MIMEタイプチェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type');
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

    // バケット選択
    const bucketMap = {
      room: 'room-images',
      avatar: 'user-avatars',
      plant: 'plant-images',
    };
    const bucket = bucketMap[type] || 'room-images';

    // ファイル名生成
    const timestamp = Date.now();
    const fileName = `${user.id}/${type}-${timestamp}.jpg`;

    // 画像をアップロード
    const arrayBuffer = await file.arrayBuffer();
    const { data: mainUpload, error: mainError } = await supabaseClient.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (mainError) throw mainError;

    // サムネイル生成（簡易版：同じ画像を使用）
    let thumbnailUrl = null;
    if (generateThumbnail) {
      const thumbnailName = `${user.id}/thumb-${type}-${timestamp}.jpg`;

      const { error: thumbError } = await supabaseClient.storage
        .from(bucket)
        .upload(thumbnailName, arrayBuffer, {
          contentType: file.type,
          cacheControl: '3600',
        });

      if (!thumbError) {
        if (bucket === 'plant-images') {
          const { data: { publicUrl } } = supabaseClient.storage
            .from(bucket)
            .getPublicUrl(thumbnailName);
          thumbnailUrl = publicUrl;
        } else {
          const { data: signed } = await supabaseClient.storage
            .from(bucket)
            .createSignedUrl(thumbnailName, 60 * 60); // 1時間
          thumbnailUrl = signed?.signedUrl ?? null;
        }
      }
    }

    // アクセスURLを取得（公開/非公開で処理分岐）
    let fileUrl: string | null = null;
    if (bucket === 'plant-images') {
      const { data: { publicUrl } } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(fileName);
      fileUrl = publicUrl;
    } else {
      const { data: signed } = await supabaseClient.storage
        .from(bucket)
        .createSignedUrl(fileName, 60 * 60);
      fileUrl = signed?.signedUrl ?? null;
    }

    // メタデータを保存
    const { error: metaError } = await supabaseClient
      .from('image_metadata')
      .insert({
        user_id: user.id,
        url: fileUrl,
        thumbnail_url: thumbnailUrl,
        type,
        size: file.size,
        width: null, // 画像処理ライブラリなしのため省略
        height: null,
      });

    if (metaError) {
      console.error('Metadata save error:', metaError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          url: fileUrl,
          thumbnail_url: thumbnailUrl,
          size: file.size,
        },
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
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