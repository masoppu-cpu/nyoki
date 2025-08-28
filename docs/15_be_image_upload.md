# チケット #15: 画像アップロード機能

**タスクID**: BE-006  
**担当**: Backend  
**推定時間**: 2時間  
**依存関係**: [BE-001: Supabase設定]  
**優先度**: 高（Phase 1）

## 概要
画像アップロード、リサイズ、最適化、ストレージ管理の実装。

## TODO リスト

- [ ] Storageバケット設定
- [ ] 画像アップロードAPI
- [ ] 画像リサイズ処理
- [ ] サムネイル生成
- [ ] 画像最適化
- [ ] CDN設定

## Supabase Storage設定

### バケット作成（SQL）
```sql
-- ストレージバケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('room-images', 'room-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('plant-images', 'plant-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('ar-generated', 'ar-generated', false, 10485760, ARRAY['image/jpeg', 'image/png']);

-- RLSポリシー設定
-- room-images: ユーザーは自分の画像のみアクセス可能
CREATE POLICY "Users can upload own room images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own room images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'room-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own room images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- plant-images: 誰でも閲覧可能（公開バケット）
CREATE POLICY "Anyone can view plant images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'plant-images');

CREATE POLICY "Service role can upload plant images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'plant-images');

-- user-avatars: ユーザーは自分のアバターのみ管理可能
CREATE POLICY "Users can manage own avatar"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'user-avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Edge Functions実装

### upload-image Function
```typescript
// supabase/functions/upload-image/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts'

serve(async (req: Request) => {
  try {
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
    } as const;

    const fallbackMax = 10 * 1024 * 1024; // 10MB
    const limit = (maxSizes as any)[type] ?? fallbackMax;
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
    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      throw new Error('Not authenticated');
    }

    // 画像を読み込み
    const arrayBuffer = await file.arrayBuffer();
    const originalImage = await Image.decode(new Uint8Array(arrayBuffer));

    // 画像をリサイズ・最適化
    const processedImage = await processImage(originalImage, type);
    const processedBuffer = await processedImage.encodeJPEG(85); // 品質85%

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

    // メイン画像をアップロード
    const { data: mainUpload, error: mainError } = await supabaseClient.storage
      .from(bucket)
      .upload(fileName, processedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (mainError) throw mainError;

    // サムネイル生成とアップロード
    let thumbnailUrl = null;
    if (generateThumbnail) {
      const thumbnail = await createThumbnail(originalImage);
      const thumbnailBuffer = await thumbnail.encodeJPEG(80);
      const thumbnailName = `${user.id}/thumb-${type}-${timestamp}.jpg`;

      const { data: thumbUpload, error: thumbError } = await supabaseClient.storage
        .from(bucket)
        .upload(thumbnailName, thumbnailBuffer, {
          contentType: 'image/jpeg',
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
    await saveImageMetadata(supabaseClient, {
      user_id: user.id,
      url: fileUrl,
      thumbnail_url: thumbnailUrl,
      type,
      size: processedBuffer.length,
      width: processedImage.width,
      height: processedImage.height,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          url: fileUrl,
          thumbnail_url: thumbnailUrl,
          size: processedBuffer.length,
          width: processedImage.width,
          height: processedImage.height,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
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
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processImage(image: any, type: string): Promise<any> {
  // タイプ別の最大サイズ
  const maxDimensions = {
    room: { width: 1920, height: 1080 },
    avatar: { width: 500, height: 500 },
    plant: { width: 1200, height: 1200 },
  };

  const max = maxDimensions[type] || maxDimensions.room;

  // アスペクト比を保持してリサイズ
  let width = image.width;
  let height = image.height;

  if (width > max.width || height > max.height) {
    const aspectRatio = width / height;
    
    if (width > height) {
      width = max.width;
      height = Math.round(width / aspectRatio);
    } else {
      height = max.height;
      width = Math.round(height * aspectRatio);
    }
    
    image.resize(width, height);
  }

  return image;
}

async function createThumbnail(image: any): Promise<any> {
  const thumbSize = 300;
  const clone = image.clone();
  
  // 正方形にクロップ
  const size = Math.min(clone.width, clone.height);
  const x = (clone.width - size) / 2;
  const y = (clone.height - size) / 2;
  
  clone.crop(x, y, size, size);
  clone.resize(thumbSize, thumbSize);
  
  return clone;
}

async function saveImageMetadata(
  supabaseClient: any,
  metadata: any
): Promise<void> {
  // 画像メタデータテーブルに保存（オプション）
  const { error } = await supabaseClient
    .from('image_metadata')
    .insert(metadata);
    
  if (error) {
    console.error('Metadata save error:', error);
  }
}
```

### delete-image Function
```typescript
// supabase/functions/delete-image/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const { file_path, bucket } = await req.json();

    if (!file_path || !bucket) {
      throw new Error('file_path and bucket are required');
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

    // ユーザーのファイルか確認
    if (!file_path.startsWith(`${user.id}/`)) {
      throw new Error('Unauthorized to delete this file');
    }

    // ファイル削除
    const { error } = await supabaseClient.storage
      .from(bucket)
      .remove([file_path]);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'File deleted successfully',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'DELETE_ERROR',
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

## 画像メタデータテーブル

```sql
CREATE TABLE public.image_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type TEXT CHECK (type IN ('room', 'avatar', 'plant')),
  size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_image_metadata_user_id ON public.image_metadata(user_id);
CREATE INDEX idx_image_metadata_type ON public.image_metadata(type);
```

## CDN設定

### Supabase CDN最適化
```typescript
// CDN URLヘルパー関数
export function getCDNUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}): string {
  if (!options) return url;
  
  const params = new URLSearchParams();
  
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format) params.append('format', options.format);
  
  return `${url}?${params.toString()}`;
}

// 使用例
const thumbnailUrl = getCDNUrl(imageUrl, {
  width: 300,
  height: 300,
  quality: 80,
  format: 'webp',
});
```

## フロントエンド実装例

```typescript
// src/utils/imageUpload.ts
export async function uploadImage(
  file: File,
  type: 'room' | 'avatar' | 'plant',
  options?: {
    generateThumbnail?: boolean;
    onProgress?: (progress: number) => void;
  }
): Promise<{
  url: string;
  thumbnailUrl?: string;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  if (options?.generateThumbnail) {
    formData.append('thumbnail', 'true');
  }

  const response = await fetch('/functions/v1/upload-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const result = await response.json();
  
  return {
    url: result.data.url,
    thumbnailUrl: result.data.thumbnail_url,
  };
}
```

## APIエンドポイント仕様

### POST /functions/v1/upload-image
```
FormData:
- file: File (required)
- type: "room" | "avatar" | "plant" (required)
- thumbnail: "true" | "false" (optional)

レスポンス:
{
  "success": true,
  "data": {
    "url": string,
    "thumbnail_url": string | null,
    "size": number,
    "width": number,
    "height": number
  }
}
```

### DELETE /functions/v1/delete-image
```
リクエスト:
{
  "file_path": string,
  "bucket": string
}

レスポンス:
{
  "success": true,
  "message": "File deleted successfully"
}
```

## 完了条件
- [ ] Storageバケット設定完了
- [ ] アップロードAPI実装
- [ ] リサイズ処理実装
- [ ] サムネイル生成実装
- [ ] 削除API実装
- [ ] RLSポリシー設定完了

## 備考
- 画像は自動的にJPEG形式に変換
- CDNキャッシュ有効期間は1時間
- 将来的にWebP対応も検討

## 関連ファイル
- `supabase/functions/upload-image/` - アップロードAPI
- `supabase/functions/delete-image/` - 削除API
- `src/utils/imageUpload.ts` - フロントエンドヘルパー

最終更新: 2025-08-28
