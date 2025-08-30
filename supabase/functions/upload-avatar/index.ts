import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

serve(async (req: Request) => {
  try {
    // CORSプリフライトリクエスト対応
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Only POST method is allowed',
          },
        }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization required',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Supabaseクライアント作成（Service Roleキーを使用）
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // ユーザー認証（Anonキーでユーザー認証）
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // FormDataを解析
    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file provided',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size must be less than 5MB',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ファイル名を生成
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    // 既存のアバターを削除（ストレージの容量を節約）
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (profile?.avatar_url) {
      // 既存のアバターURLからファイルパスを抽出
      const existingPath = profile.avatar_url.split('/').slice(-2).join('/');
      if (existingPath.startsWith(user.id)) {
        await supabaseClient.storage
          .from('user-avatars')
          .remove([existingPath]);
      }
    }

    // ファイルをバイト配列に変換
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // ストレージにアップロード
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('user-avatars')
      .upload(fileName, bytes, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload avatar');
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabaseClient.storage
      .from('user-avatars')
      .getPublicUrl(fileName);

    // プロファイルを更新
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      // アップロードしたファイルを削除
      await supabaseClient.storage
        .from('user-avatars')
        .remove([fileName]);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          avatar_url: publicUrl,
        },
        message: 'アバターをアップロードしました',
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in upload-avatar function:', error);
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
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});