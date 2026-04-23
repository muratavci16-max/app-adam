// ─── YARDIMCILAR ───────────────────────────────────────────────

export const AYLAR = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'
]

export const tarihStr = (ay: number, yil: number): string => {
  if (!Number.isInteger(ay) || ay < 1 || ay > 12) {
    throw new RangeError(`tarihStr: ay must be between 1 and 12, got ${ay}`)
  }
  return AYLAR[ay - 1] + ' ' + yil
}

export function addAy(ay: number, yil: number, n: number): { ay: number; yil: number } {
  const t = yil * 12 + ay - 1 + n
  return { ay: t % 12 + 1, yil: Math.floor(t / 12) }
}

export function sonrakiAy(ay: number, yil: number): { ay: number; yil: number } {
  return ay === 12 ? { ay: 1, yil: yil + 1 } : { ay: ay + 1, yil }
}

// ─── SAYISAL FORMAT ────────────────────────────────────────────
// ÖNEMLİ: number inputlardan doğrudan parse et (ondalık nokta)
// text inputlardan (TL tutarları) Türkçe binlik ayracı temizle
//
// STRICT parsing: geçersiz / belirsiz girdilerde NaN döner.
// Böylece çağıran taraf 0 ile geçersiz girdi arasındaki farkı ayırt edebilir.
export function parseInput(value: string, isNumberInput: boolean): number {
  if (typeof value !== 'string') return NaN
  const trimmed = value.trim()
  if (trimmed === '') return NaN

  // Yalnızca ASCII 0-9 ve ayraçlar (. , - +) kabul edilir.
  // Bu, Arabic-Indic rakamları, emoji vs. non-ASCII karakterleri reddeder.
  // Ayrıca "Infinity", "NaN", "12abc34" gibi kısmi/özel parse girdileri de reddedilir.
  if (isNumberInput) {
    // number-mode: <input type="number"> zaten "." ondalık ayraçla gelir.
    // Strict: sadece [+-]?[0-9]+(\.[0-9]+)? formatı kabul.
    if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(trimmed)) return NaN
    const n = Number(trimmed)
    if (!Number.isFinite(n)) return NaN
    return n
  }

  // text-mode (Türkçe): binlik ayracı ".", ondalık ayracı ","
  //   "1.000,50"  → 1000.5  (geçerli)
  //   "1000"      → 1000    (geçerli)
  //   "1.5"       → NaN     (belirsiz: binlik mi ondalık mı?)
  //   "0.50"      → NaN     (aynı)
  //   "1,000.50"  → NaN     (karışık format)
  //
  // Kural: "." yalnızca binlik ayracı olarak, 3'lü gruplarla kullanılabilir.
  // En fazla bir "," olabilir ve o ondalık kısımdan önce gelir.
  // Kabul edilen kalıplar:
  //   [+-]?\d{1,3}(\.\d{3})*(,\d+)?
  //   [+-]?\d+(,\d+)?
  if (!/^[+-]?(\d{1,3}(\.\d{3})+|\d+)(,\d+)?$/.test(trimmed)) return NaN
  const normalized = trimmed.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  if (!Number.isFinite(n)) return NaN
  return n
}

export function formatTL(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  // "Sıfırdan uzağa yuvarla" (round half away from zero):
  //   JS'in Math.round(-0.5) → 0; biz -1 istiyoruz.
  //   Math.round(-0.4) → 0 (bu zaten doğru).
  let rounded = Math.sign(n) * Math.round(Math.abs(n))
  // Signed zero'yu pozitife normalize et: -0 → 0
  if (rounded === 0) rounded = 0
  return rounded.toLocaleString('tr-TR') + ' ₺'
}

export function formatTL2(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  // Aynı mantık: −0 → 0 normalize.
  const v = n === 0 ? 0 : n
  return v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}

// Yüzde formatı — 2 ondalık, tr-TR locale (virgül), geçersiz/absürd değerlerde "—"
export function formatPct(n: number, decimals = 2): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  if (Math.abs(n) > 999) return '—'
  // Küçük negatifler (−0.0001) decimals'a yuvarlayınca "−0,00" üretir; bunu sıfıra normalize et.
  const factor = Math.pow(10, decimals)
  let rounded = Math.round(n * factor) / factor
  if (rounded === 0) rounded = 0  // signed-zero nötralize
  return '%' + rounded.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
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

  // Geçersiz/sıfır/negatif basTaksit: sonsuz döngüyü engellemek için erken çık.
  if (!Number.isFinite(basTaksit) || basTaksit <= 0) {
    return {
      rows: [],
      toplamTaksit: 0,
      hizmetToplam: 0,
      toplamOdeme: 0,
      teslimVadeNo: null,
      teslimAy: null,
      teslimYil: null,
      vade: 0,
    }
  }

  const hizmetToplam = tutar * hizmetOranPct / 100
  const kalan0 = tutar - pesinat

  // Teslim eşiği: toplam tutarın %X'i — peşinat sayılır, hizmet bedeli dahil değil
  const tesEsik = Math.max(0, tutar * (teslimatPct / 100) - pesinat)

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
      const gercekVade = Math.max(hesaplananVade, 6)  // EN ERKEN TESLİM 6. AY
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

// NPV hesaplayıcı (calcIRR'in içinde kullanılıyor)
function npvAt(cashflows: number[], r: number): number {
  let npv = 0
  for (let t = 0; t < cashflows.length; t++) {
    npv += cashflows[t] / Math.pow(1 + r, t)
  }
  return npv
}

// Newton-Raphson IRR — step clamping ve yakınsama kontrolü ile
export function calcIRR(
  cashflows: number[],
  guess = 0.01,
  maxIter = 500,
  tol = 1e-8
): number {
  let r = guess
  for (let i = 0; i < maxIter; i++) {
    // Güvenli aralık: r > -0.99 olmalı
    if (r <= -0.99) r = -0.9
    let npv = 0, dnpv = 0
    for (let t = 0; t < cashflows.length; t++) {
      const disc = Math.pow(1 + r, t)
      npv += cashflows[t] / disc
      if (t > 0) dnpv -= t * cashflows[t] / (disc * (1 + r))
    }
    if (!isFinite(npv) || !isFinite(dnpv) || Math.abs(dnpv) < 1e-14) return NaN
    let step = npv / dnpv
    // Aşırı adımları frenle (Newton'un ıraksamasını önler)
    if (Math.abs(step) > 0.5) step = Math.sign(step) * 0.5
    const rNew = r - step
    if (Math.abs(rNew - r) < tol) return rNew
    r = rNew
  }
  // Yakınsamadıysa NaN döndür
  return NaN
}

// Bisection yöntemiyle IRR — Newton başarısız olursa yedek.
// Arama aralığı genişletilebilir: IRR çok yüksek (>500%/ay) olabilir.
function calcIRRBisection(cashflows: number[], lo = -0.9, hi = 5, maxIter = 200, tol = 1e-8): number {
  let fLo = npvAt(cashflows, lo)
  let fHi = npvAt(cashflows, hi)
  if (!isFinite(fLo) || !isFinite(fHi)) return NaN
  // Uçlarda işaret değişimi yoksa hi'yi katlayarak kök ara.
  // (Bazı agresif finansmanlarda IRR 1000%'yi aşabilir.)
  let expandTries = 0
  while (fLo * fHi > 0 && expandTries < 40) {
    hi = hi * 2 + 1
    fHi = npvAt(cashflows, hi)
    if (!isFinite(fHi)) return NaN
    expandTries++
  }
  if (fLo * fHi > 0) return NaN
  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2
    const fMid = npvAt(cashflows, mid)
    if (!isFinite(fMid)) return NaN
    if (Math.abs(fMid) < tol || (hi - lo) / 2 < tol) return mid
    if (fLo * fMid < 0) { hi = mid; fHi = fMid }
    else { lo = mid; fLo = fMid }
  }
  return (lo + hi) / 2
}

// Sağlam IRR — birden fazla başlangıç noktası + bisection fallback.
// Boş / tek-elemanlı / tamamen sıfır cashflow için NaN döner.
export function robustIRR(cashflows: number[]): number {
  if (!Array.isArray(cashflows) || cashflows.length < 2) return NaN
  // Tamamen sıfır (veya hiç sayısal olmayan) cashflow ⇒ IRR tanımsız.
  let hasPositive = false
  let hasNegative = false
  for (const cf of cashflows) {
    if (!Number.isFinite(cf)) return NaN
    if (cf > 0) hasPositive = true
    else if (cf < 0) hasNegative = true
  }
  if (!hasPositive || !hasNegative) return NaN

  for (const g of [0.005, 0.02, 0.05, 0.001, 0.1, -0.005]) {
    const r = calcIRR(cashflows, g)
    if (isFinite(r) && !isNaN(r) && r > -0.99) return r
  }
  // Newton yakınsamadıysa bisection dene
  return calcIRRBisection(cashflows)
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
  // teslimAy kaldırıldı — otomatik hesaplanır (min 6, tutar×%40 eşiği)
  // Kredi tarafı
  krFaizAylik: number     // Aylık faiz (%)
  mevduatYillik: number   // Alternatif mevduat getirisi yıllık (%)
  kalanVadeOverride?: number // 0/undefined = otomatik (vade - teslimAy)
}

export interface KarsilastirmaRow {
  ay: number
  tfTaksit: number
  tfKumul: number
  altTaksit: number
  altFaiz: number   // mevduattan kazanılan aylık faiz (teslimat öncesi dönem, sonrası 0)
  altKumul: number
  isTeslim: boolean
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
  teslimAy: number                // otomatik hesaplanan teslimat ayı
  // Teslim eşiği detayları — Yön. m. 21/2-a + m. 21/3 (see lib/hesaplamalar.ts teslim block)
  tasarrufEsikAyi: number         // "tasarruf %40" şartını karşılayan ilk ay
  sureEsikAyi: number             // m. 21/3 indirimli süre eşiği (floor=5)
  bagliyayanEsik: 'tasarruf' | 'sure' | 'her-ikisi'
  rows: KarsilastirmaRow[]        // karşılaştırmalı ödeme planı
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
    tutar, pesinat, taksit0, takTuru,
    artisAy, yeniTaksit, krFaizAylik, mevduatYillik
  } = p

  // orgPct'yi [0, 100] aralığına sıkıştır: negatif indirim veya %1000 gibi absürd değerleri engeller.
  const orgPctClamped = Math.max(0, Math.min(100, Number.isFinite(p.orgPct) ? p.orgPct : 0))
  const orgBedeli = tutar * orgPctClamped / 100
  const kalanBorcBaslangic = tutar - pesinat

  const getTaksit = (ay: number): number => {
    if (takTuru === 'artisli' && ay > artisAy) return yeniTaksit
    return taksit0
  }

  // Vade hesapla (kalan borç sıfırlanana kadar)
  let kalan = kalanBorcBaslangic
  let vade = 0
  for (let t = 1; t <= 600 && kalan > 0.01; t++) {
    const tak = getTaksit(t)
    if (!Number.isFinite(tak) || tak <= 0) break
    kalan -= Math.min(tak, kalan)
    vade = t
  }

  /**
   * Teslim (tahsisat) tarihi hesabı — müşteri-bazlı TF sözleşmesi.
   *
   * Mevzuat: BDDK, Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet Esasları
   * Hakkında Yönetmelik, MADDE 21.
   *   - m. 21/2-a: tahsisat için hem "sözleşme tutarının %40'ı kadar tasarruf"
   *                hem "sözleşme süresinin 2/5'i" birlikte aranır.
   *   - m. 21/3  : süre (2/5) şartı, peşinat/toplam oranı nispetinde azaltılabilir;
   *                koşul: sözleşmeden ≥150 gün geçmiş ve ≥5 tasarruf ödemesi yapılmış.
   *                ("nispetinde" = orantılı → süre × (1 − peşinat/toplam)).
   *                Bu zemin ay-5 taban olarak uygulanır (aylık ödeme takviminde
   *                150. gün ≈ 5. ay).
   *   - m. 21/3 son cümle: ara dönem ek ödemeler %40 hesabına sayılmaz;
   *                bu yolla tahsisat öne çekilemez → taksit input tooltip'i ile
   *                kullanıcıya ayrıca bildirilir.
   *
   * Kaynak dosyalar (repo): docs/regulations/09-yonetmelik-38500-konsolide.pdf
   *                         docs/regulations/03-yonetmelik-degisiklik-20250530.html
   *                         (güncel metin: 30.05.2025 RG 32915).
   *
   * En iyi-hal (best case) modelleniyor: 150 gün + 5 ödeme tamamlanmış
   * varsayımıyla m. 21/3 indirimi uygulanır. Çekilişli sözleşmeler bu hesapta
   * yok — YasalBilgiPaneli içindeki bilgi notu ile ayrıca belirtilir.
   */
  // ── Tasarruf eşiği (m. 21/2-a "tasarruf" ayağı) ───────────────────────────
  // peşinat + Σ taksit ≥ sözleşme_tutarı × 0.40 olan ilk ay.
  const tasarrufEsikTutari = tutar * 0.40
  let kumulatif = pesinat
  let tempKalan = kalanBorcBaslangic
  let tasarrufEsikAyi = 0
  for (let t = 1; t <= Math.max(vade, 600); t++) {
    const tak = Math.min(getTaksit(t), tempKalan)
    tempKalan -= tak
    kumulatif += tak
    if (tasarrufEsikAyi === 0 && kumulatif >= tasarrufEsikTutari) {
      tasarrufEsikAyi = t
      break
    }
    if (tempKalan <= 0.005) break
  }
  // Eğer tutar hiç karşılanamıyorsa (taksit + peşinat < %40 × tutar), vade'ye düşsün
  if (tasarrufEsikAyi === 0) tasarrufEsikAyi = vade

  // ── Süre eşiği (m. 21/2-a "süre" ayağı + m. 21/3 indirimi) ────────────────
  const pesinatRatio = tutar > 0 ? pesinat / tutar : 0
  // Üst sınır: peşinat ≥ tutar durumunda oranı 1'e clamp (indirim tam).
  const clampedRatio = Math.min(Math.max(pesinatRatio, 0), 1)
  // m. 21/3: ay-5 tabanı (150 gün + 5 ödeme). Vade < 5 ise vade tabana çıkar.
  const FLOOR_MONTH = 5
  const baseDurationGate = Math.ceil(vade * 0.40)
  const reducedDurationGate = Math.max(
    Math.min(FLOOR_MONTH, vade),
    Math.ceil(vade * 0.40 * (1 - clampedRatio)),
  )
  const sureEsikAyi = reducedDurationGate

  // ── Teslim = her iki eşiğin geç olanı (m. 21/2-a "ve" bağlayıcısı) ────────
  let teslimAy = Math.max(tasarrufEsikAyi, sureEsikAyi)
  if (teslimAy > vade) teslimAy = vade

  // Hangi eşik bağlayıcı oldu?
  let bagliyayanEsik: 'tasarruf' | 'sure' | 'her-ikisi'
  if (tasarrufEsikAyi === sureEsikAyi) bagliyayanEsik = 'her-ikisi'
  else if (teslimAy === sureEsikAyi) bagliyayanEsik = 'sure'
  else bagliyayanEsik = 'tasarruf'

  // Geriye uyumluluk: eski adıyla da dışarı veriyoruz (silinebilir)
  const autoTeslimAy = teslimAy

  // Geriye uyumluluk için placeholder (ileride kaldırılabilir)
  const cashflows: number[] = []

  // TF toplam ödeme
  let tfToplam = pesinat + orgBedeli
  let kalanTF = kalanBorcBaslangic
  for (let t = 1; t <= vade; t++) {
    const tak = Math.min(getTaksit(t), kalanTF)
    kalanTF -= tak
    tfToplam += tak
  }

  // Alternatif: Mevduat + Kredi
  // Birikim teslimAy-1'e kadar çalışır; teslimAy'da ilk kredi ödemesi yapılır.
  const mevduatAylik = Math.pow(1 + mevduatYillik / 100, 1/12) - 1
  let birikim = pesinat + orgBedeli
  let kalanAlt = kalanBorcBaslangic
  const altFaizArr: number[] = new Array(Math.max(teslimAy + 1, vade + 1)).fill(0)
  for (let t = 1; t <= teslimAy - 1; t++) {
    const faiz = birikim * mevduatAylik
    altFaizArr[t] = faiz
    birikim += faiz
    const tak = Math.min(getTaksit(t), kalanAlt)
    kalanAlt -= tak
    birikim += tak
  }
  const birikilenToplam = birikim
  const krediIhtiyaci = Math.max(0, tutar - birikilenToplam)

  // kalanVade: teslim ayı dahil teslimat sonrası kaç taksit kaldığı.
  // rows[t=teslimAy..vade] için post-delivery row count = vade - teslimAy + 1.
  // Bu sayı kalanVade'ye eşit olmalı ki "post-delivery altTaksit toplamı == krToplam".
  const autoKalanVade = vade > 0 && teslimAy > 0
    ? Math.max(0, vade - teslimAy + 1)
    : 0
  const kalanVade = (p.kalanVadeOverride && p.kalanVadeOverride > 0)
    ? p.kalanVadeOverride
    : autoKalanVade

  // Kredi tarafı: krediHesapla fonksiyonunu doğrudan kullan (annüite formülü orada)
  let krTaksit = 0, krToplam = 0, krFaizToplam = 0
  if (krediIhtiyaci > 0 && kalanVade > 0) {
    const krediSonuc = krediHesapla({
      tutar: krediIhtiyaci,
      vadeAy: kalanVade,
      aylikFaizPct: krFaizAylik,
    })
    krTaksit = krediSonuc.aylikTaksit
    krToplam = krediSonuc.toplamOdeme
    krFaizToplam = krediSonuc.toplamFaiz
  }

  let altToplam = pesinat + orgBedeli
  let kalanAlt2 = kalanBorcBaslangic
  for (let t = 1; t <= teslimAy - 1; t++) {
    const tak = Math.min(getTaksit(t), kalanAlt2)
    kalanAlt2 -= tak
    altToplam += tak
  }
  altToplam += krToplam

  // Eşdeğer Banka Faizi: Alternatif senaryo (mevduat+kredi) ile TF'yi eşit maliyete getiren banka oranı
  const preDeliveryOutflow = altToplam - krToplam
  const targetKrToplam = tfToplam - preDeliveryOutflow
  let esdegerAylik: number
  if (krediIhtiyaci <= 0 || kalanVade <= 0 || targetKrToplam <= 0) {
    esdegerAylik = NaN
  } else {
    const targetKrTaksit = targetKrToplam / kalanVade
    const eqCashflows = [-krediIhtiyaci, ...Array(kalanVade).fill(targetKrTaksit)]
    esdegerAylik = robustIRR(eqCashflows)
  }
  const irrAylikPct = !isFinite(esdegerAylik) || isNaN(esdegerAylik) ? NaN : esdegerAylik * 100
  const irrYillik = !isFinite(esdegerAylik) || isNaN(esdegerAylik) ? NaN : (Math.pow(1 + esdegerAylik, 12) - 1) * 100

  // Karşılaştırmalı ödeme planı tablosu için satırlar.
  // Post-delivery satırlar: ay ∈ [teslimAy, vade] → adet = vade - teslimAy + 1 = kalanVade.
  // Her post-delivery satırda altTaksit = krTaksit → post-delivery toplam = krTaksit * kalanVade = krToplam.
  const rows: KarsilastirmaRow[] = []
  let tfKumul = pesinat + orgBedeli
  let birikimForRows = pesinat + orgBedeli
  let altKumul = 0
  let kalanTFRows = kalanBorcBaslangic
  let kalanAltRows = kalanBorcBaslangic
  for (let t = 1; t <= vade; t++) {
    const tfTak = Math.min(getTaksit(t), kalanTFRows)
    kalanTFRows = Math.max(0, kalanTFRows - tfTak)
    tfKumul += tfTak

    let altTak: number
    let altFaizRow: number
    if (t < teslimAy) {
      altTak = Math.min(getTaksit(t), kalanAltRows)
      kalanAltRows = Math.max(0, kalanAltRows - altTak)
      altFaizRow = altFaizArr[t] || 0
      birikimForRows += altFaizRow + altTak
      altKumul = birikimForRows
    } else {
      altTak = krTaksit > 0 ? krTaksit : 0
      altFaizRow = 0
      altKumul += altTak
    }

    rows.push({ ay: t, tfTaksit: tfTak, tfKumul, altTaksit: altTak, altFaiz: altFaizRow, altKumul, isTeslim: t === teslimAy })
  }

  // Verdict: TL bazlı (toplam maliyet karşılaştırması)
  const fark = Math.abs(tfToplam - altToplam)
  const krDahaUcuz = altToplam < tfToplam
  const tfDahaAvantajli = tfToplam < altToplam

  return {
    vade, cashflows, tfToplam, orgBedeli, irrAylikPct, irrYillik,
    teslimVadeNo: teslimAy, teslimAy,
    tasarrufEsikAyi, sureEsikAyi, bagliyayanEsik,
    rows,
    birikilenToplam, krediIhtiyaci, kalanVade,
    krTaksit, krToplam, krFaizToplam, altToplam,
    fark, tfDahaAvantajli, krDahaUcuz
  }
}
