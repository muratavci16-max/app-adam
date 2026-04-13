-- ════════════════════════════════════════════════
--  UCUZ FİNANSMAN — Supabase Veritabanı Şeması
--  Supabase Dashboard → SQL Editor'da çalıştırın
-- ════════════════════════════════════════════════

-- ─── İçerik Yönetimi (slider, metinler, menü, footer) ───
CREATE TABLE IF NOT EXISTS content (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Başlangıç içerikleri
INSERT INTO content (key, value) VALUES
  ('hero_slides', '[
    {
      "badge": "Finansal Karar Analizi",
      "baslik": "Tasarruf Finansmanı mı, Banka Kredisi mi?",
      "vurgu": "Banka Kredisi mi?",
      "aciklama": "Gerçek maliyet hesabı yapın. Efektif faiz oranı (IRR) ile iki sistemi finansal olarak kıyaslayın.",
      "stats": [{"val": "100%", "lbl": "Ücretsiz"}, {"val": "IRR", "lbl": "Gerçek Maliyet"}, {"val": "2 dk", "lbl": "Hızlı Analiz"}]
    }
  ]'::jsonb),
  ('site_baslik', '"Ucuz Finansman"'::jsonb),
  ('footer_yasal_uyari', '"Bu sitedeki hesaplamalar yalnızca bilgilendirme amaçlıdır."'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ─── Reklam Alanları ───
CREATE TABLE IF NOT EXISTS ads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement    TEXT NOT NULL,  -- 'homepage_top', 'sidebar', 'table_below', 'footer_top'
  title        TEXT,
  description  TEXT,
  image_url    TEXT,
  link_url     TEXT,
  is_active    BOOLEAN DEFAULT true,
  order_index  INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Banka Faiz Oranları ───
CREATE TABLE IF NOT EXISTS bank_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banka_adi    TEXT NOT NULL,
  logo_url     TEXT,
  aylik_faiz   NUMERIC(5,2) NOT NULL DEFAULT 2.49,
  yillik_faiz  NUMERIC(6,2) NOT NULL DEFAULT 34.0,
  min_vade     INT DEFAULT 12,
  max_vade     INT DEFAULT 120,
  is_active    BOOLEAN DEFAULT true,
  order_index  INT DEFAULT 0
);

-- Örnek veri
INSERT INTO bank_rates (banka_adi, aylik_faiz, yillik_faiz, min_vade, max_vade, order_index) VALUES
  ('Ziraat Bankası', 2.29, 31.0, 12, 120, 1),
  ('Halkbank', 2.39, 32.5, 12, 120, 2),
  ('Vakıfbank', 2.45, 33.4, 12, 120, 3),
  ('Garanti BBVA', 2.49, 34.0, 12, 120, 4),
  ('İş Bankası', 2.55, 34.9, 12, 120, 5),
  ('Yapı Kredi', 2.60, 35.7, 12, 120, 6)
ON CONFLICT DO NOTHING;

-- ─── Kullanıcı Kayıtlı Planlar ───
CREATE TABLE IF NOT EXISTS saved_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('tasarruf', 'kredi', 'karsilastirma')),
  params          JSONB NOT NULL,
  result_snapshot JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Blog Yazıları ───
CREATE TABLE IF NOT EXISTS blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  excerpt         TEXT,
  content         TEXT NOT NULL DEFAULT '',
  cover_image     TEXT,
  published       BOOLEAN DEFAULT false,
  published_at    TIMESTAMPTZ,
  author_name     TEXT,
  seo_title       TEXT,
  seo_description TEXT,
  seo_keywords    TEXT,
  og_image        TEXT,
  schema_type     TEXT DEFAULT 'Article',
  reading_time    INT,
  category        TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published, published_at DESC);

-- ════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════

-- Content: herkes okur, sadece service_role yazar
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_read" ON content FOR SELECT USING (true);
CREATE POLICY "content_write" ON content FOR ALL USING (auth.role() = 'service_role');

-- Ads: aktif olanları herkes görür, service_role yönetir
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_read" ON ads FOR SELECT USING (is_active = true);
CREATE POLICY "ads_write" ON ads FOR ALL USING (auth.role() = 'service_role');

-- Bank rates: herkes okur
ALTER TABLE bank_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bank_rates_read" ON bank_rates FOR SELECT USING (true);
CREATE POLICY "bank_rates_write" ON bank_rates FOR ALL USING (auth.role() = 'service_role');

-- Saved plans: kullanıcı kendi planlarını yönetir
ALTER TABLE saved_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_plans_own" ON saved_plans FOR ALL USING (auth.uid() = user_id);

-- Blog: yayında olanları herkes görür, service_role yönetir
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_read" ON blog_posts FOR SELECT USING (published = true);
CREATE POLICY "blog_write" ON blog_posts FOR ALL USING (auth.role() = 'service_role');
