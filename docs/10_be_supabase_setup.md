# チケット #10: Supabaseセットアップ

**タスクID**: BE-001  
**担当**: Backend  
**推定時間**: 2時間  
**依存関係**: [COMMON-003: プロジェクト設定]  
**優先度**: 高（Phase 1）

## 概要
Supabaseプロジェクトの作成と基本設定。認証・DB・ストレージの初期設定。

## TODO リスト

- [ ] Supabaseプロジェクト作成
- [ ] 認証設定（Email/Password）
- [ ] データベース設定
- [ ] ストレージバケット作成
- [ ] Row Level Security (RLS) 設定
- [ ] Edge Functions設定

## Supabaseプロジェクト作成

### 1. プロジェクト作成
```bash
# Supabase Dashboard
# https://app.supabase.com でプロジェクト作成

プロジェクト名: nyoki-production
リージョン: Northeast Asia (Tokyo)
データベースパスワード: [セキュアなパスワード生成]
```

### 2. APIキー取得
```env
# .env.local に追加
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_KEY=eyJxxxxx... # サーバーサイドのみ
```

## 認証設定

### Email認証設定
```sql
-- Supabase SQL Editor で実行
-- auth.users テーブルは自動作成される

-- カスタムプロファイルテーブル
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プロファイル自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 認証設定（Dashboard）
```
Authentication > Settings:
- Email認証: 有効
- メール確認: 本番では有効（開発時は無効）
- パスワード最小長: 8文字
- サインアップ制限: なし
```

## データベーススキーマ

### 基本テーブル作成
```sql
-- 植物マスターテーブル
CREATE TABLE public.plants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT,
  price INTEGER NOT NULL,
  size TEXT CHECK (size IN ('S', 'M', 'L')),
  difficulty TEXT,
  light_requirement TEXT,
  water_frequency TEXT,
  description TEXT,
  image_url TEXT,
  category TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーの植物管理
CREATE TABLE public.user_plants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES public.plants(id),
  nickname TEXT,
  location TEXT,
  last_watered DATE,
  health_status TEXT CHECK (health_status IN ('healthy', 'warning', 'danger')),
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 部屋分析履歴
CREATE TABLE public.room_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 購入検討リスト
CREATE TABLE public.purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES public.plants(id) NOT NULL,
  status TEXT CHECK (status IN ('considering','purchased')) DEFAULT 'considering',
  external_url TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ストレージ設定

### バケット作成
```sql
-- Supabase Storage で作成
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('room-images', 'room-images', false),
  ('plant-images', 'plant-images', true),
  ('user-avatars', 'user-avatars', false);
```

### ストレージポリシー
```sql
-- room-images バケットポリシー
CREATE POLICY "Users can upload their own room images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'room-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own room images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'room-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Row Level Security (RLS)

### RLS有効化とポリシー
```sql
-- RLS有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- プロファイルポリシー
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- ユーザー植物ポリシー
CREATE POLICY "Users can CRUD own plants"
ON public.user_plants FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 植物マスターは誰でも閲覧可能
CREATE POLICY "Plants are viewable by everyone"
ON public.plants FOR SELECT
TO anon, authenticated
USING (true);
```

## Edge Functions設定

### 初期設定
```bash
# ローカル開発用
supabase init
supabase functions new analyze-room
supabase functions new generate-ar-image
```

### analyze-room Function
```typescript
// supabase/functions/analyze-room/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { image } = await req.json()
  
  // Gemini API呼び出し（仮実装）
  const analysis = {
    lightLevel: 'moderate',
    humidity: 'normal',
    temperature: 'optimal',
    recommendedPlants: ['monstera', 'pothos', 'snake-plant']
  }
  
  return new Response(
    JSON.stringify({ success: true, data: analysis }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

## 完了条件
- [ ] Supabaseプロジェクト作成完了
- [ ] 全テーブル作成完了
- [ ] RLSポリシー設定完了
- [ ] ストレージバケット設定完了
- [ ] Edge Functions デプロイ完了
- [ ] 環境変数設定完了

## 備考
- 開発環境と本番環境でプロジェクトを分ける
- RLSは必須（セキュリティ）
- バックアップ設定も検討

## 関連ファイル
- `supabase/migrations/` - マイグレーションファイル
- `supabase/functions/` - Edge Functions
- `.env.local` - 環境変数

最終更新: 2025-08-28
