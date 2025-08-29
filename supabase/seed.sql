-- Development seed data for plants (do not auto-run in production)
-- Usage: `supabase db reset` during local development

INSERT INTO public.plants (name, scientific_name, price, size, difficulty, light_requirement, water_frequency, description, category, stock, is_available)
VALUES
  ('モンステラ', 'Monstera deliciosa', 3980, 'M', '初心者向け', '明るい日陰', '週1-2回', '大きな切れ込みの入った葉が特徴的。育てやすく人気。', 'natural', 10, true),
  ('サンスベリア', 'Sansevieria trifasciata', 2980, 'S', '初心者向け', '日陰OK', '月2-3回', '空気清浄効果が高く、水やりが少なくて済む。', 'modern', 15, true),
  ('ポトス', 'Epipremnum aureum', 1980, 'S', '初心者向け', '日陰OK', '週1回', 'つる性で成長が早く、水栽培も可能。', 'cozy', 20, true),
  ('パキラ', 'Pachira aquatica', 4980, 'L', '初心者向け', '明るい日陰', '週1回', '別名「発財樹」。縁起が良いとされる観葉植物。', 'natural', 8, true),
  ('フィカス・ウンベラータ', 'Ficus umbellata', 5980, 'L', '中級者向け', '明るい日陰', '週1-2回', 'ハート型の大きな葉が特徴。インテリア性が高い。', 'nordic', 5, true);

