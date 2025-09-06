-- profilesテーブルとトリガーの設定
-- Supabase SQL Editorで実行してください

-- 1. profilesテーブル作成（既存の場合はスキップ）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  is_premium BOOLEAN DEFAULT false,
  plant_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 自動プロファイル作成用の関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. トリガー削除（既存の場合）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. トリガー作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS（Row Level Security）設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 既存ポリシー削除
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 6. アクセスポリシー設定
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 7. インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- 確認用クエリ
-- SELECT * FROM profiles;
-- SELECT * FROM auth.users;