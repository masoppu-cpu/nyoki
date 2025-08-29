-- Initial database setup for nyoki application
-- Created: 2025-01-28

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- Profiles Table (extends auth.users)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND c.relname = 'users'
      AND n.nspname = 'auth'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ==============================================
-- Plants Master Table
-- ==============================================
CREATE TABLE IF NOT EXISTS public.plants (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_plants_category ON public.plants(category);
CREATE INDEX IF NOT EXISTS idx_plants_name ON public.plants(name);

-- ==============================================
-- User Plants Management
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_plants (
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

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_user_plants_user_id ON public.user_plants(user_id);

-- ==============================================
-- Room Analysis History
-- ==============================================
CREATE TABLE IF NOT EXISTS public.room_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_room_analyses_user_id ON public.room_analyses(user_id);

-- ==============================================
-- Purchase Consideration List
-- ==============================================
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES public.plants(id) NOT NULL,
  status TEXT CHECK (status IN ('considering', 'purchased')) DEFAULT 'considering',
  external_url TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_purchase_items_user_id ON public.purchase_items(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_status ON public.purchase_items(status);

-- ==============================================
-- Enable Row Level Security (RLS)
-- ==============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- RLS Policies - Profiles
-- ==============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

-- ==============================================
-- RLS Policies - User Plants
-- ==============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_plants' AND policyname='Users can manage own plants'
  ) THEN
    CREATE POLICY "Users can manage own plants" ON public.user_plants FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- RLS Policies - Room Analyses
-- ==============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='room_analyses' AND policyname='Users can manage own room analyses'
  ) THEN
    CREATE POLICY "Users can manage own room analyses" ON public.room_analyses FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- RLS Policies - Purchase Items
-- ==============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='purchase_items' AND policyname='Users can manage own purchase items'
  ) THEN
    CREATE POLICY "Users can manage own purchase items" ON public.purchase_items FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- RLS Policies - Plants Master
-- ==============================================
-- Anyone can view plants (public data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='plants' AND policyname='Plants are publicly viewable'
  ) THEN
    CREATE POLICY "Plants are publicly viewable" ON public.plants FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='plants' AND policyname='Only admins can modify plants'
  ) THEN
    CREATE POLICY "Only admins can modify plants" ON public.plants FOR INSERT TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='plants' AND policyname='Only admins can update plants'
  ) THEN
    CREATE POLICY "Only admins can update plants" ON public.plants FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='plants' AND policyname='Only admins can delete plants'
  ) THEN
    CREATE POLICY "Only admins can delete plants" ON public.plants FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
  END IF;
END $$;

-- ==============================================
-- Helper Functions
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ==============================================
-- Sample Data (Optional - for development)
-- ==============================================
-- This will be commented out for production
/*
INSERT INTO public.plants (name, scientific_name, price, size, difficulty, light_requirement, water_frequency, description, category)
VALUES 
  ('モンステラ', 'Monstera deliciosa', 3980, 'M', '初級', '明るい日陰', '週1-2回', '大きな切れ込みの入った葉が特徴的', '観葉植物'),
  ('ポトス', 'Epipremnum aureum', 1980, 'S', '初級', '明るい日陰', '週1回', '育てやすく初心者におすすめ', '観葉植物'),
  ('サンスベリア', 'Sansevieria trifasciata', 2980, 'M', '初級', '明るい場所', '月2回', '空気清浄効果があり丈夫', '多肉植物');
*/
