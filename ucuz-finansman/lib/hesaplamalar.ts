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
  teslimAy: number          // otomatik hesaplanan teslimat ayı
  rows: KarsilastirmaRow[]  // karşılaştırmalı ödeme planı
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
    artisAy, yeniTaksit, krFaizAylik, mevduatYillik
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

  // Teslimat ayını otomatik hesapla:
  // Hizmet bedeli HARİÇ — peşinat + taksitler ≥ tutar×%40 olan ilk ay, minimum 6. ay
  const teslimatEsik = tutar * 0.40
  let kumulatif = pesinat
  let tempKalan = kalanBorcBaslangic
  let autoTeslimAy = 0
  for (let t = 1; t <= Math.max(vade, 600); t++) {
    const tak = Math.min(getTaksit(t), tempKalan)
    tempKalan -= tak
    kumulatif += tak
    if (autoTeslimAy === 0 && kumulatif >= teslimatEsik) {
      autoTeslimAy = t
      break
    }
    if (tempKalan <= 0.005) break
  }
  const teslimAy = Math.max(autoTeslimAy || vade, 6)

  // Nakit akışı (IRR için)
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
  const kalanVade = (p.kalanVadeOverride && p.kalanVadeOverride > 0)
    ? p.kalanVadeOverride
    : Math.max(0, vade - teslimAy)

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

  // Karşılaştırmalı ödeme planı tablosu için satırlar
  const rows: KarsilastirmaRow[] = []
  let tfKumul = pesinat + orgBedeli
  let altKumul = pesinat + orgBedeli
  let kalanTFRows = kalanBorcBaslangic
  let kalanAltRows = kalanBorcBaslangic
  for (let t = 1; t <= vade; t++) {
    const tfTak = Math.min(getTaksit(t), kalanTFRows)
    kalanTFRows = Math.max(0, kalanTFRows - tfTak)
    tfKumul += tfTak

    let altTak: number
    if (t <= teslimAy) {
      altTak = Math.min(getTaksit(t), kalanAltRows)
      kalanAltRows = Math.max(0, kalanAltRows - altTak)
      altKumul += altTak
    } else {
      altTak = krTaksit > 0 ? krTaksit : 0
      altKumul += altTak
    }

    rows.push({ ay: t, tfTaksit: tfTak, tfKumul, altTaksit: altTak, altKumul, isTeslim: t === teslimAy })
  }

  const tfDahaAvantajli = !isNaN(irrAylikPct) && irrAylikPct < krFaizAylik
  const fark = Math.abs(tfToplam - altToplam)
  const krDahaUcuz = altToplam < tfToplam

  return {
    vade, cashflows, tfToplam, orgBedeli, irrAylikPct, irrYillik,
    teslimVadeNo: teslimAy, teslimAy, rows,
    birikilenToplam, krediIhtiyaci, kalanVade,
    krTaksit, krToplam, krFaizToplam, altToplam,
    fark, tfDahaAvantajli, krDahaUcuz
  }
}
