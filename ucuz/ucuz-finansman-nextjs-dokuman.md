# Ucuz Finansman — Next.js Geçiş Dökümanı

Bu döküman, mevcut 4 adet HTML dosyasından oluşan "Ucuz Finansman" projesinin
Next.js + Supabase + Vercel stack'ine taşınması için hazırlanmıştır.
Claude Code'da bu dökümanı referans alarak projeyi sıfırdan kurabilirsiniz.

---

## 1. PROJE TANIMI

**Site Adı:** Ucuz Finansman  
**Amaç:** Tasarruf finansmanı ile banka kredisini finansal olarak karşılaştırmak,
efektif faiz oranı (IRR) hesaplamak ve kullanıcıya en avantajlı seçeneği göstermek.  
**Hedef kitle:** Türkiye'de ev veya araç almayı düşünen bireyler.  
**Gelir modeli:** Reklam alanları (banka, TF firmaları), ilerleyen dönemde lead generation.

---

## 2. MEVCUT DOSYA YAPISI

```
index.html                        → Anasayfa (hero slider + karşılaştırma formu)
tasarruf-finansman-hesaplama.html → Tasarruf finansmanı ödeme planı
kredi-hesaplama.html              → Banka kredisi ödeme planı
karsilastirma.html                → IRR bazlı karşılaştırma analizi
```

---

## 3. HEDEF NEXT.JS PROJE YAPISI

```
ucuz-finansman/
├── app/
│   ├── layout.tsx              → Ortak header + footer (tüm sayfalarda)
│   ├── page.tsx                → Anasayfa (index.html)
│   ├── tasarruf-finansmani/
│   │   └── page.tsx            → Tasarruf finansmanı hesaplayıcı
│   ├── kredi-hesaplama/
│   │   └── page.tsx            → Kredi hesaplayıcı
│   ├── karsilastirma/
│   │   └── page.tsx            → IRR karşılaştırma analizi
│   ├── admin/
│   │   ├── layout.tsx          → Admin layout (auth guard)
│   │   ├── page.tsx            → Admin dashboard
│   │   ├── slider/page.tsx     → Slider içerik yönetimi
│   │   ├── reklamlar/page.tsx  → Reklam alanı yönetimi
│   │   └── icerik/page.tsx     → Genel içerik (metinler, başlıklar)
│   ├── auth/
│   │   ├── giris/page.tsx      → Kullanıcı giriş
│   │   └── kayit/page.tsx      → Kullanıcı kayıt
│   └── api/
│       └── auth/[...nextauth]/ → (Supabase Auth kullanıldığı için minimal)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── hesaplama/
│   │   ├── TasarrufForm.tsx
│   │   ├── KrediForm.tsx
│   │   └── KarsilastirmaForm.tsx
│   └── ui/
│       ├── Toast.tsx
│       └── Card.tsx
├── lib/
│   ├── supabase.ts             → Supabase client
│   ├── hesaplamalar.ts         → Tüm hesaplama fonksiyonları (pure functions)
│   └── formatters.ts           → Para formatlama yardımcıları
└── types/
    └── index.ts                → TypeScript tipleri
```

---

## 4. KURULUM ADIMLARI

### Adım 1 — Proje Oluştur (Windows, VS Code terminali)

```bash
npx create-next-app@latest ucuz-finansman --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd ucuz-finansman
```

### Adım 2 — Gerekli Paketler

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install chart.js react-chartjs-2
npm install lucide-react
```

### Adım 3 — Ortam Değişkenleri

`.env.local` dosyası oluştur:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # sadece sunucu tarafında kullan
```

### Adım 4 — Supabase Client

`lib/supabase.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## 5. SUPABASE VERİTABANI ŞEMASI

Supabase dashboard → SQL Editor'da çalıştır:

```sql
-- İçerik yönetimi (slider, metinler, başlıklar)
CREATE TABLE content (
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
      "aciklama": "Gerçek maliyet hesabı yapın. Efektif faiz oranı (IRR) ile iki sistemi finansal olarak kıyaslayın."
    },
    {
      "badge": "Tasarruf Finansmanı",
      "baslik": "Peşinatsız Ev & Araç Edinimi",
      "vurgu": "Araç Edinimi",
      "aciklama": "Ödeme planınızı hesaplayın ve teslim tarihinizi öğrenin."
    }
  ]'::jsonb),
  ('site_baslik', '"Ucuz Finansman"'::jsonb),
  ('footer_yasal_uyari', '"Bu sitedeki hesaplamalar yalnızca bilgilendirme amaçlıdır."'::jsonb);

-- Reklam alanları
CREATE TABLE ads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement    TEXT NOT NULL,  -- 'homepage_top', 'sidebar', 'table_top' vb.
  title        TEXT,
  description  TEXT,
  image_url    TEXT,
  link_url     TEXT,
  is_active    BOOLEAN DEFAULT true,
  order_index  INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı kayıtlı planları
CREATE TABLE saved_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('tasarruf', 'kredi', 'karsilastirma')),
  params          JSONB NOT NULL,   -- form alanları
  result_snapshot JSONB,            -- hesaplama sonucu özeti
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security — kullanıcı sadece kendi planlarını görür
ALTER TABLE saved_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kullanici_kendi_planlari" ON saved_plans
  FOR ALL USING (auth.uid() = user_id);

-- Admin için RLS bypass (service role key ile)
-- Admin tabloları (content, ads) için herkes okuyabilir, sadece admin yazabilir
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "herkes_okuyabilir" ON content FOR SELECT USING (true);
CREATE POLICY "sadece_service_role_yazar" ON content FOR ALL
  USING (auth.role() = 'service_role');

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "herkes_okuyabilir_ads" ON ads FOR SELECT USING (is_active = true);
CREATE POLICY "sadece_service_role_ads" ON ads FOR ALL
  USING (auth.role() = 'service_role');
```

---

## 6. HESAPLAMAFONKSİYONLARI (lib/hesaplamalar.ts)

Bu dosya tüm hesaplama mantığını içerir. **Saf fonksiyonlardır — UI'a bağımlılıkları yoktur.**

```typescript
// ─── YARDIMCILAR ───────────────────────────────────────────────

export const AYLAR = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'
]

export const tarihStr = (ay: number, yil: number): string =>
  AYLAR[ay - 1] + ' ' + yil

export function addAy(ay: number, yil: number, n: number): { ay: number; yil: number } {
  const t = yil * 12 + ay - 1 + n
  return { ay: t % 12 + 1, yil: Math.floor(t / 12) }
}

export function sonrakiAy(ay: number, yil: number): { ay: number; yil: number } {
  return ay === 12 ? { ay: 1, yil: yil + 1 } : { ay: ay + 1, yil }
}

// ─── SAYISAL FORMAT ────────────────────────────────────────────
// ÖNEMLİ: number inputlardan doğrudan parseFloat kullan (ondalık nokta)
// text inputlardan (TL tutarları) Türkçe binlik ayracı temizle
export function parseInput(value: string, isNumberInput: boolean): number {
  if (isNumberInput) return parseFloat(value) || 0
  const v = value.replace(/\./g, '').replace(',', '.')
  return parseFloat(v) || 0
}

export function formatTL(n: number): string {
  if (isNaN(n)) return '—'
  return Math.round(n).toLocaleString('tr-TR') + ' ₺'
}

export function formatTL2(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}

// ─── TASARRUF FİNANSMANI ───────────────────────────────────────

export interface TasarrufParams {
  tutar: number           // Toplam finansman tutarı (TL)
  pesinat: number         // Peşinat (TL)
  basTaksit: number       // Başlangıç aylık taksiti (TL)
  hizmetOranPct: number   // Hizmet bedeli oranı (%)
  hizmetVade: number      // Hizmet bedeli vadelendirme (ay, 0=peşin)
  teslimatPct: number     // Teslimat eşiği (%, default 40)
  odemeTuru: 'esit' | 'artisli'
  artisOrani: number      // Artış oranı (%, artışlı taksitte kullanılır)
  artisSikligi: number    // Artış sıklığı (ay, artışlı taksitte kullanılır)
  baslangicAy: number     // 1-12
  baslangicYil: number    // örn: 2025
}

export interface TasarrufSatir {
  no: number
  tarih: string
  taksit: number
  odenenmis: number       // peşinat dahil toplam ödenen
  kalan: number           // kalan borç
  isTeslim: boolean
  isArtis: boolean
  artisOnceki: number
  artisYeni: number
}

export interface TasarrufSonuc {
  rows: TasarrufSatir[]
  toplamTaksit: number    // peşinat dahil tüm taksitler
  hizmetToplam: number
  toplamOdeme: number     // toplamTaksit + hizmetToplam
  teslimVadeNo: number | null
  teslimAy: number | null
  teslimYil: number | null
  vade: number
}

export function tasarrufHesapla(p: TasarrufParams): TasarrufSonuc {
  const {
    tutar, pesinat, basTaksit, hizmetOranPct, hizmetVade,
    teslimatPct, odemeTuru, artisOrani, artisSikligi,
    baslangicAy, baslangicYil
  } = p

  const hizmetToplam = tutar * hizmetOranPct / 100
  const kalan0 = tutar - pesinat

  // Teslim eşiği: toplam tutarın %X'i — peşinat sayılır, hizmet bedeli dahil değil
  const tesEsik = Math.max(0, tutar * (teslimatPct / 100) - pesinat)

  const getTaksit = (ay: number): number => {
    if (odemeTuru === 'artisli' && ay > 1 && artisOrani > 0) {
      // Her artisSikligi ayda bir artış
      const artisAdedi = Math.floor((ay - 1) / artisSikligi)
      return basTaksit * Math.pow(1 + artisOrani / 100, artisAdedi)
    }
    return basTaksit
  }

  const rows: TasarrufSatir[] = []
  let kalan = kalan0
  let odenenmis = 0
  let taksitTutar = basTaksit
  let prevTaksit = basTaksit
  let teslimVadeNo: number | null = null
  let teslimAy: number | null = null
  let teslimYil: number | null = null
  let vadeNo = 1
  let ay = baslangicAy
  let yil = baslangicYil

  while (kalan > 0.005 && vadeNo <= 600) {
    let isArtis = false

    if (odemeTuru === 'artisli' && vadeNo > 1 && artisOrani > 0) {
      if ((vadeNo - 1) % artisSikligi === 0) {
        prevTaksit = taksitTutar
        taksitTutar = taksitTutar * (1 + artisOrani / 100)
        isArtis = true
      }
    }

    const odeme = Math.min(taksitTutar, kalan)
    kalan -= odeme
    odenenmis += odeme

    // Teslim tespiti
    if (teslimVadeNo === null && odenenmis >= tesEsik - 0.001) {
      const hesaplananVade = vadeNo + hizmetVade
      const gercekVade = Math.max(hesaplananVade, 5)  // EN ERKEN TESLİM 5. AY
      teslimVadeNo = gercekVade
      const t = addAy(baslangicAy, baslangicYil, gercekVade - 1)
      teslimAy = t.ay
      teslimYil = t.yil
    }

    rows.push({
      no: vadeNo,
      tarih: tarihStr(ay, yil),
      taksit: odeme,
      odenenmis: odenenmis + pesinat,
      kalan: Math.max(0, kalan),
      isTeslim: vadeNo === teslimVadeNo,
      isArtis,
      artisOnceki: isArtis ? prevTaksit : 0,
      artisYeni: isArtis ? taksitTutar : 0,
    })

    const s = sonrakiAy(ay, yil)
    ay = s.ay; yil = s.yil
    vadeNo++
  }

  const vade = rows.length
  const toplamTaksit = rows.reduce((s, r) => s + r.taksit, 0) + pesinat
  const toplamOdeme = toplamTaksit + hizmetToplam

  return {
    rows, toplamTaksit, hizmetToplam, toplamOdeme,
    teslimVadeNo, teslimAy, teslimYil, vade
  }
}

// ─── KREDİ HESAPLAMA ───────────────────────────────────────────

export interface KrediParams {
  tutar: number       // Kredi anapara (TL)
  vadeAy: number      // Vade (ay)
  aylikFaizPct: number // Aylık faiz oranı (%, örn: 2.49)
}

export interface KrediSatir {
  no: number
  taksit: number
  anapara: number
  faiz: number
  kalan: number
  isSon: boolean
}

export interface KrediSonuc {
  rows: KrediSatir[]
  aylikTaksit: number
  toplamOdeme: number
  toplamFaiz: number
}

// Annüite formülü: P * r / (1 - (1+r)^-n)
export function krediHesapla(p: KrediParams): KrediSonuc {
  const { tutar, vadeAy, aylikFaizPct } = p
  const r = aylikFaizPct / 100

  const aylikTaksit = r === 0
    ? tutar / vadeAy
    : tutar * r / (1 - Math.pow(1 + r, -vadeAy))

  const toplamOdeme = aylikTaksit * vadeAy
  const toplamFaiz = toplamOdeme - tutar

  const rows: KrediSatir[] = []
  let kalan = tutar

  for (let i = 1; i <= vadeAy; i++) {
    const faizPay = kalan * r
    const anapayPay = aylikTaksit - faizPay
    kalan -= anapayPay

    rows.push({
      no: i,
      taksit: aylikTaksit,
      anapara: anapayPay,
      faiz: faizPay,
      kalan: Math.max(0, kalan),
      isSon: i === vadeAy,
    })
  }

  return { rows, aylikTaksit, toplamOdeme, toplamFaiz }
}

// ─── IRR HESAPLAMA (Newton-Raphson) ────────────────────────────

export function calcIRR(
  cashflows: number[],
  guess = 0.01,
  maxIter = 1000,
  tol = 1e-8
): number {
  let r = guess
  for (let i = 0; i < maxIter; i++) {
    let npv = 0, dnpv = 0
    for (let t = 0; t < cashflows.length; t++) {
      const disc = Math.pow(1 + r, t)
      npv  += cashflows[t] / disc
      dnpv -= t * cashflows[t] / (disc * (1 + r))
    }
    if (Math.abs(dnpv) < 1e-14) break
    const rNew = r - npv / dnpv
    if (Math.abs(rNew - r) < tol) { r = rNew; break }
    r = rNew
  }
  return r
}

// ─── KARŞILAŞTIRMA HESAPLAMA ───────────────────────────────────

export interface KarsilastirmaParams {
  // TF tarafı
  tutar: number
  pesinat: number
  orgPct: number          // Organizasyon ücreti (%)
  taksit0: number         // Başlangıç taksiti
  takTuru: 'sabit' | 'artisli'
  artisAy: number         // Kaçıncı aydan sonra artıyor
  yeniTaksit: number      // Artışlı taksit tutarı
  teslimAy: number        // Finansman teslim ayı
  // Kredi tarafı
  krFaizAylik: number     // Aylık faiz (%)
  mevduatYillik: number   // Alternatif mevduat getirisi yıllık (%)
}

export interface KarsilastirmaSonuc {
  // TF
  vade: number
  cashflows: number[]
  tfToplam: number
  orgBedeli: number
  irrAylikPct: number
  irrYillik: number
  teslimVadeNo: number | null
  // Kredi alternatifi
  birikilenToplam: number
  krediIhtiyaci: number
  kalanVade: number
  krTaksit: number
  krToplam: number
  krFaizToplam: number
  altToplam: number
  // Karşılaştırma
  fark: number
  tfDahaAvantajli: boolean
  krDahaUcuz: boolean
}

export function karsilastirmaHesapla(p: KarsilastirmaParams): KarsilastirmaSonuc {
  const {
    tutar, pesinat, orgPct, taksit0, takTuru,
    artisAy, yeniTaksit, teslimAy, krFaizAylik, mevduatYillik
  } = p

  const orgBedeli = tutar * orgPct / 100
  const kalanBorcBaslangic = tutar - pesinat

  const getTaksit = (ay: number): number => {
    if (takTuru === 'artisli' && ay > artisAy) return yeniTaksit
    return taksit0
  }

  // Vade hesapla (kalan borç sıfırlanana kadar)
  let kalan = kalanBorcBaslangic
  let vade = 0
  for (let t = 1; t <= 600 && kalan > 0.01; t++) {
    kalan -= Math.min(getTaksit(t), kalan)
    vade = t
  }

  // Nakit akışı (IRR için)
  // t=0: -(peşinat + org bedeli)
  // t=1..teslimAy-1: -taksit
  // t=teslimAy: -(taksit) + tutar  (malı teslim aldın)
  // t=teslimAy+1..vade: -taksit
  const cashflows = new Array(vade + 1).fill(0)
  cashflows[0] = -(pesinat + orgBedeli)
  let kalanCF = kalanBorcBaslangic
  for (let t = 1; t <= vade; t++) {
    const tak = Math.min(getTaksit(t), kalanCF)
    kalanCF -= tak
    cashflows[t] = t === teslimAy ? tutar - tak : -tak
  }

  // IRR (birden fazla başlangıç noktası dene)
  let irrAylik = calcIRR(cashflows, 0.005)
  if (isNaN(irrAylik) || irrAylik <= -1) irrAylik = calcIRR(cashflows, 0.02)
  if (isNaN(irrAylik) || irrAylik <= -1) irrAylik = calcIRR(cashflows, 0.001)

  const irrAylikPct = isNaN(irrAylik) ? NaN : irrAylik * 100
  const irrYillik = isNaN(irrAylik) ? NaN : (Math.pow(1 + irrAylik, 12) - 1) * 100

  // TF toplam ödeme
  let tfToplam = pesinat + orgBedeli
  let kalanTF = kalanBorcBaslangic
  for (let t = 1; t <= vade; t++) {
    const tak = Math.min(getTaksit(t), kalanTF)
    kalanTF -= tak
    tfToplam += tak
  }

  // Alternatif: Mevduat + Kredi
  // t=0: peşinat + org bedelini mevduata yatır
  // Her ay: faiz işle + o ayki taksiti mevduata ekle
  // Teslim anında: birikim → finansmana karşılık, eksik kalan → kredi
  const mevduatAylik = Math.pow(1 + mevduatYillik / 100, 1/12) - 1
  let birikim = pesinat + orgBedeli
  let kalanAlt = kalanBorcBaslangic
  for (let t = 1; t <= teslimAy; t++) {
    birikim = birikim * (1 + mevduatAylik)
    const tak = Math.min(getTaksit(t), kalanAlt)
    kalanAlt -= tak
    birikim += tak
  }
  const birikilenToplam = birikim
  const krediIhtiyaci = Math.max(0, tutar - birikilenToplam)
  const kalanVade = vade - teslimAy

  const r = krFaizAylik / 100
  let krTaksit = 0, krToplam = 0, krFaizToplam = 0
  if (krediIhtiyaci > 0 && kalanVade > 0) {
    krTaksit = r === 0
      ? krediIhtiyaci / kalanVade
      : krediIhtiyaci * r * Math.pow(1+r, kalanVade) / (Math.pow(1+r, kalanVade) - 1)
    krToplam = krTaksit * kalanVade
    krFaizToplam = krToplam - krediIhtiyaci
  }

  let altToplam = pesinat + orgBedeli
  let kalanAlt2 = kalanBorcBaslangic
  for (let t = 1; t <= teslimAy; t++) {
    const tak = Math.min(getTaksit(t), kalanAlt2)
    kalanAlt2 -= tak
    altToplam += tak
  }
  altToplam += krToplam

  const tfDahaAvantajli = !isNaN(irrAylikPct) && irrAylikPct < krFaizAylik
  const fark = Math.abs(tfToplam - altToplam)
  const krDahaUcuz = altToplam < tfToplam

  return {
    vade, cashflows, tfToplam, orgBedeli, irrAylikPct, irrYillik,
    teslimVadeNo: teslimAy,
    birikilenToplam, krediIhtiyaci, kalanVade,
    krTaksit, krToplam, krFaizToplam, altToplam,
    fark, tfDahaAvantajli, krDahaUcuz
  }
}
```

---

## 7. KRİTİK HESAPLAMA KURALLARI

Aşağıdaki kurallar uzun test ve tartışmalar sonucunda netleşmiştir.
Taşıma sırasında **kesinlikle değiştirilmemelidir.**

### 7.1 Tasarruf Finansmanı — Teslim Eşiği

```
Teslim eşiği = Toplam finansman tutarı × Teslimat yüzdesi (%)
                - Peşinat (peşinat sayılır, eşikten düşülür)

Hizmet bedeli bu hesaba DAHİL DEĞİLDİR.

Örnek:
  Tutar: 2.000.000 ₺  |  Peşinat: 400.000 ₺  |  Eşik: %40
  → Gerekli taksit toplamı = 2.000.000 × 0.40 - 400.000 = 400.000 ₺
```

### 7.2 Minimum Teslim Vadesi

```
Teslim vadesi hesaplansa bile minimum 5. ay kuralı geçerlidir.
Hizmet bedeli vadelendirmesi de 5. ay kuralından sonra uygulanır.

gercekVade = Math.max(hesaplananVade + hizmetVade, 5)
```

### 7.3 Artışlı Taksit Mantığı

```
Artış 1. ayda BAŞLAMAZ — 1. vade her zaman başlangıç taksitidir.
(vadeNo - 1) % artisSikligi === 0 koşulunda artış gerçekleşir.

Örnek: artisSikligi=3, artisOrani=%5
  Vade 1: basTaksit
  Vade 2: basTaksit
  Vade 3: basTaksit
  Vade 4: basTaksit × 1.05  (4-1=3, 3%3=0 → artış)
  Vade 7: basTaksit × 1.05² (7-1=6, 6%3=0 → artış)
```

### 7.4 Sayısal Girdi Okuma (ÖNEMLİ BUG FIX)

```
type="number" inputlardan: parseFloat() — NOKTA ONDALIK AYRAÇTIR
type="text" inputlardan: noktalari kaldir, sonra parseFloat — NOKTA BİNLİK AYRAÇTIR

// Hatalı: "2.49" → "249" (tüm noktalari kaldir)
// Doğru:
function parseInput(value, inputType):
  if inputType === 'number': return parseFloat(value)
  return parseFloat(value.replace(/\./g,'').replace(',','.'))
```

### 7.5 IRR Nakit Akışı İşaretleri

```
t=0   : -(peşinat + organizasyon bedeli)  → ÇIKIŞ (negatif)
t=1...(teslimAy-1): -taksit              → ÇIKIŞ (negatif)
t=teslimAy: +tutar - taksit              → GİRİŞ (net: genellikle pozitif)
t=(teslimAy+1)...vade: -taksit          → ÇIKIŞ (negatif)
```

### 7.6 Kredi — Annüite Formülü

```
Aylık taksit = P × r / (1 - (1+r)^(-n))
  P = anapara
  r = aylık faiz oranı (ondalık, örn: 2.49/100 = 0.0249)
  n = vade (ay)

Kullanıcı AYLIK faiz girer (yıllık değil).
Bilgi amaçlı yıllık bileşik = (1 + r)^12 - 1
```

---

## 8. VERİ TİPLERİ (TypeScript)

```typescript
// types/index.ts

export interface SavedPlan {
  id: string
  user_id: string
  name: string
  type: 'tasarruf' | 'kredi' | 'karsilastirma'
  params: TasarrufParams | KrediParams | KarsilastirmaParams
  result_snapshot?: {
    toplamOdeme?: number
    aylikTaksit?: number
    irrAylikPct?: number
    teslimTarih?: string
  }
  created_at: string
  updated_at: string
}

export interface ContentRow {
  key: string
  value: unknown
  updated_at: string
}

export interface Ad {
  id: string
  placement: string
  title: string | null
  description: string | null
  image_url: string | null
  link_url: string | null
  is_active: boolean
  order_index: number
}

// Slider içerik tipi
export interface HeroSlide {
  badge: string
  baslik: string
  vurgu: string     // başlıktaki renkli kısım
  aciklama: string
  stats?: { val: string; lbl: string }[]
}
```

---

## 9. RENK PALETİ (Tailwind config)

Mevcut HTML'lerde CSS variable olarak tanımlı. Tailwind'e ekle:

```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      // Primary — Sky Blue (fintech güveni)
      primary: {
        50:  '#f0f9ff',
        100: '#e0f2fe',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        900: '#0c4a6e',
      },
      // Accent — Indigo (premium)
      accent: {
        50:  '#eef2ff',
        100: '#e0e7ff',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
      },
      // Success — Emerald
      success: {
        50:  '#ecfdf5',
        100: '#d1fae5',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
      },
    },
    fontFamily: {
      sans: ['Poppins', 'sans-serif'],
    },
  }
}
```

---

## 10. SAYFA ROUTE KARŞILIĞI

| Eski HTML | Yeni Next.js Route | Açıklama |
|-----------|-------------------|----------|
| `index.html` | `/` (app/page.tsx) | Anasayfa |
| `tasarruf-finansman-hesaplama.html` | `/tasarruf-finansmani` | TF hesaplayıcı |
| `kredi-hesaplama.html` | `/kredi-hesaplama` | Kredi hesaplayıcı |
| `karsilastirma.html` | `/karsilastirma` | IRR analizi |
| — | `/admin` | İçerik yönetimi (yeni) |
| — | `/auth/giris` | Kullanıcı girişi (yeni) |
| — | `/auth/kayit` | Kullanıcı kaydı (yeni) |
| — | `/hesaplamarim` | Kayıtlı planlar (yeni) |

**SEO için önemli:** Her sayfa `generateMetadata()` ile kendi `<title>` ve
`<meta description>` değerlerini döndürmelidir.

---

## 11. ADMIN PANELİ

Admin panel `/admin` altında, `ADMIN_EMAIL` env değişkeniyle korunan basit bir
route protection sistemi kullanır. Supabase service role key ile content/ads
tablolarını yönetir.

Yönetilecek içerikler:
- Hero slider (başlık, açıklama, istatistikler)
- Reklam alanları (homepage_top, sidebar, table_below)
- Site başlığı ve footer metni
- Kredi faiz tablosu (manuel güncelleme)
- TF firma kartları

---

## 12. ANASAYFA URL PARAM AKTARIMI

Anasayfadaki hızlı form, karşılaştırma sayfasına şu URL parametreleriyle yönlendirir:

```
/karsilastirma?tutar=2000000&pesinat=400000&taksit=60000
              &org_pct=8.5&teslim_ay=6
              &kr_faiz=2.49&mevduat_y=40
```

Karşılaştırma sayfası bu parametreleri `useSearchParams()` ile okur ve
formu otomatik doldurarak `hesapla()` fonksiyonunu tetikler.

---

## 13. CHART.JS ENTEGRASYONU

Karşılaştırma sayfasındaki grafik Chart.js ile yapılmıştır.
Next.js'de dinamik import kullanılmalıdır (SSR hatası almamak için):

```typescript
import dynamic from 'next/dynamic'

const Line = dynamic(
  () => import('react-chartjs-2').then(m => m.Line),
  { ssr: false }
)
```

Grafik: İki senaryonun kümülatif ödeme eğrisi (line chart).
- Yeşil çizgi: Tasarruf Finansmanı
- Mavi kesikli çizgi: Banka Kredisi Alternatifi
- X ekseni: Ay numaraları (0 → vade)
- Y ekseni: Kümülatif ödeme (₺, binler cinsinden)

---

## 14. BAŞLANGIÇ PROMPTU (Claude Code için)

Aşağıdaki promptu Claude Code'a ver:

---

"Ucuz Finansman adında bir finansal karşılaştırma sitesi geliştireceğiz.
Mevcut 4 HTML sayfası var, bunları Next.js + Supabase + Vercel stack'ine taşıyacağız.

**Teknoloji:**
- Next.js 14, App Router, TypeScript, Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)
- Vercel deploy
- Chart.js (karşılaştırma grafiği)

**Ortam:** Windows, Node.js kurulu, VS Code

**Lütfen şu sırayla ilerle:**

1. `create-next-app` ile projeyi oluştur
2. Tailwind, Supabase, Chart.js paketlerini ekle
3. `lib/hesaplamalar.ts` dosyasını oluştur (dökümanttaki TypeScript kodlarını ekle)
4. Shared layout (Header + Footer) yap
5. Anasayfayı (/) yap — hero slider + hızlı form
6. `/tasarruf-finansmani` sayfasını yap
7. `/kredi-hesaplama` sayfasını yap
8. `/karsilastirma` sayfasını yap — IRR hesabı + Chart.js grafik
9. Supabase bağlantısı + tabloları kur
10. Auth sayfaları (kayıt/giriş)
11. `/hesaplamarim` sayfası
12. `/admin` paneli

**Kritik hesaplama kuralları için ekteki dökümanı referans al.
Özellikle sayısal girdi okuma (type=number vs type=text farkı),
teslim eşiği hesabı ve minimum 5. ay kuralına dikkat et.**

Başlayalım — önce `create-next-app` komutu ile projeyi oluştur."

---

## 15. NOTLAR

- Tüm hesaplama fonksiyonları **pure function** olarak yazılmalı,
  React state'e veya DOM'a bağımlı olmamalıdır.
- Para formatı: Türkçe locale (`tr-TR`), binlik ayraç nokta, ondalık virgül.
- Kullanıcı girişi olmadan da tüm hesaplama araçları çalışmalıdır
  (auth sadece kaydetme için gerekli).
- Mobil uyumluluk önemli — Tailwind responsive sınıfları kullan.
- Her sayfada `<title>` SEO için kritik, Supabase'den çekilen dinamik
  içerik varsa `generateMetadata()` async olmalıdır.
