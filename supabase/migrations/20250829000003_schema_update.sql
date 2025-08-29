-- Date: 2025-08-29

-- Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- 1) profiles: remove email, add fields from spec
-- ==============================================
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS email,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plants_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_analysis_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_generation_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_consult_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notification_time TEXT DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS ai_last_reset_month SMALLINT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- update_updated_at trigger function already exists; ensure triggers on plants/user_plants later

-- Replace signup trigger function to avoid email reference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2) plants: extend columns per spec + updated_at
-- ==============================================
ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS original_price INTEGER,
  ADD COLUMN IF NOT EXISTS care_instructions TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[],
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS purchase_links JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Helpful indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_plants_price ON public.plants(price);
CREATE INDEX IF NOT EXISTS idx_plants_is_available ON public.plants(is_available);

-- ==============================================
-- 3) user_plants: extend columns + types + updated_at
-- ==============================================
ALTER TABLE public.user_plants
  ALTER COLUMN last_watered TYPE TIMESTAMPTZ USING (CASE WHEN last_watered IS NULL THEN NULL ELSE last_watered::timestamptz END),
  ADD COLUMN IF NOT EXISTS next_water_date DATE,
  ADD COLUMN IF NOT EXISTS water_frequency_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'リビング',
  ADD COLUMN IF NOT EXISTS growth_stage TEXT CHECK (growth_stage IN ('seedling','young','mature')) DEFAULT 'young',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS purchase_price INTEGER,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_plants_health_status ON public.user_plants(health_status);
CREATE INDEX IF NOT EXISTS idx_user_plants_next_water_date ON public.user_plants(next_water_date);

-- ==============================================
-- 4) room_analyses: extend columns + constraints
-- ==============================================
ALTER TABLE public.room_analyses
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS light_level TEXT,
  ADD COLUMN IF NOT EXISTS humidity_level TEXT,
  ADD COLUMN IF NOT EXISTS temperature_range TEXT,
  ADD COLUMN IF NOT EXISTS room_size TEXT,
  ADD COLUMN IF NOT EXISTS style_preference TEXT,
  ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
  ADD COLUMN IF NOT EXISTS ai_response TEXT,
  ADD COLUMN IF NOT EXISTS is_successful BOOLEAN DEFAULT true;

-- Ensure analysis_result is NOT NULL going forward
ALTER TABLE public.room_analyses ALTER COLUMN analysis_result SET DEFAULT '{}'::jsonb;
UPDATE public.room_analyses SET analysis_result = '{}'::jsonb WHERE analysis_result IS NULL;
ALTER TABLE public.room_analyses ALTER COLUMN analysis_result SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_room_analyses_created_at ON public.room_analyses(created_at DESC);

-- ==============================================
-- 5) purchase_items: strengthen constraints
-- ==============================================
ALTER TABLE public.purchase_items
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'purchase_items_user_plant_unique'
  ) THEN
    ALTER TABLE public.purchase_items
      ADD CONSTRAINT purchase_items_user_plant_unique UNIQUE(user_id, plant_id);
  END IF;
END $$;

-- ==============================================
-- 6) New tables: ar_generations, recommended_plants, watering_logs, scheduled_notifications
-- ==============================================

CREATE TABLE IF NOT EXISTS public.ar_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_image_url TEXT NOT NULL,
  generated_image_url TEXT NOT NULL,
  plants UUID[] DEFAULT '{}',
  style TEXT CHECK (style IN ('natural','modern','minimal')),
  prompt TEXT,
  is_successful BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ar_generations_user_id ON public.ar_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_generations_created_at ON public.ar_generations(created_at DESC);

CREATE TABLE IF NOT EXISTS public.recommended_plants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.room_analyses(id) ON DELETE CASCADE NOT NULL,
  plant_id UUID REFERENCES public.plants(id) NOT NULL,
  recommendation_score DECIMAL(3,2) CHECK (recommendation_score >= 0 AND recommendation_score <= 1),
  reason TEXT,
  placement_suggestion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recommended_plants_analysis_id ON public.recommended_plants(analysis_id);
CREATE INDEX IF NOT EXISTS idx_recommended_plants_score ON public.recommended_plants(recommendation_score DESC);

CREATE TABLE IF NOT EXISTS public.watering_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_plant_id UUID REFERENCES public.user_plants(id) ON DELETE CASCADE NOT NULL,
  watered_at TIMESTAMPTZ DEFAULT NOW(),
  amount TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_watering_logs_user_plant_id ON public.watering_logs(user_plant_id);
CREATE INDEX IF NOT EXISTS idx_watering_logs_watered_at ON public.watering_logs(watered_at DESC);

CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('watering','new_feature','campaign')) NOT NULL,
  target_id UUID,
  scheduled_for TIMESTAMPTZ NOT NULL,
  title TEXT,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('pending','sent','cancelled')) DEFAULT 'pending',
  onesignal_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type, target_id, scheduled_for)
);
CREATE INDEX IF NOT EXISTS idx_sched_notif_user ON public.scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sched_notif_status ON public.scheduled_notifications(status);

-- ==============================================
-- 7) RLS enable + policies for new tables
-- ==============================================
ALTER TABLE public.ar_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommended_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watering_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- ar_generations: user owns their rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ar_generations' AND policyname='Users can manage own ar_generations'
  ) THEN
    CREATE POLICY "Users can manage own ar_generations" ON public.ar_generations
      FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- recommended_plants: users can view recommendations for their analyses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommended_plants' AND policyname='Users can view own recommendations'
  ) THEN
    CREATE POLICY "Users can view own recommendations" ON public.recommended_plants
      FOR SELECT TO authenticated USING (
        EXISTS (
          SELECT 1 FROM public.room_analyses ra
          WHERE ra.id = recommended_plants.analysis_id AND ra.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- watering_logs: users can manage logs of their user_plants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='watering_logs' AND policyname='Users can manage own watering logs'
  ) THEN
    CREATE POLICY "Users can manage own watering logs" ON public.watering_logs
      FOR ALL TO authenticated USING (
        EXISTS (
          SELECT 1 FROM public.user_plants up
          WHERE up.id = watering_logs.user_plant_id AND up.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- scheduled_notifications: user owns their own schedule entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scheduled_notifications' AND policyname='Users can manage own notifications'
  ) THEN
    CREATE POLICY "Users can manage own notifications" ON public.scheduled_notifications
      FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- 8) updated_at triggers for plants and user_plants
-- ==============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_plants_updated_at') THEN
    CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON public.plants
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_plants_updated_at') THEN
    CREATE TRIGGER update_user_plants_updated_at BEFORE UPDATE ON public.user_plants
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_items_updated_at') THEN
    CREATE TRIGGER update_purchase_items_updated_at BEFORE UPDATE ON public.purchase_items
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sched_notif_updated_at') THEN
    CREATE TRIGGER update_sched_notif_updated_at BEFORE UPDATE ON public.scheduled_notifications
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ==============================================
-- 9) Admin-only write policies for plants (ensure in place)
-- Note: Existing policies already restrict writes to admins via app_metadata.role = 'admin'.
-- No change required here.

-- End of migration
