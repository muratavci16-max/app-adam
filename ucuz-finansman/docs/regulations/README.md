# Tasarruf Finansmanı — Mevzuat Arşivi

İndirilme tarihi: 2026-04-23

Türk hukukunda Tasarruf Finansmanı (TF) faaliyetlerini düzenleyen resmi kamu dokümanlarının yerel kopyaları. Hepsi kamuya açık kaynaklardan indirildi.

## Dosyalar

| # | Dosya | Tür | Tarih / Sayı | Kaynak |
|---|---|---|---|---|
| 01 | `01-kanun-7292-20210307.html` | Kanun | 07.03.2021 / RG 31416 | [resmigazete.gov.tr](https://www.resmigazete.gov.tr/eskiler/2021/03/20210307-10.htm) |
| 02 | `02-yonetmelik-kurulus-faaliyet-20210407.html` | Ana Yönetmelik | 07.04.2021 / RG 31447 | [resmigazete.gov.tr](https://resmigazete.gov.tr/eskiler/2021/04/20210407-20.htm) |
| 03 | `03-yonetmelik-degisiklik-20250530.html` | Değişiklik Yönetmeliği | 30.05.2025 / RG 32915 | [resmigazete.gov.tr](https://www.resmigazete.gov.tr/eskiler/2025/05/20250530-25.htm) |
| 04 | `04-bddk-sss.html` | BDDK SSS sayfası | — | [bddk.org.tr](https://www.bddk.org.tr/Sss/Liste/117) |
| 05 | `05-bddk-mevzuat-liste.html` | BDDK mevzuat listesi | — | [bddk.org.tr](https://www.bddk.org.tr/Mevzuat/Liste/52) |
| 06 | `06-yonetmelik-degisiklik-20231229.html` | Değişiklik Yönetmeliği | 29.12.2023 / RG 32414 | [resmigazete.gov.tr](https://resmigazete.gov.tr/eskiler/2023/12/20231229-3.htm) |
| 07 | `07-teblig-likidite-20251128.html` | Tebliğ (likidite yeterlilik) | 28.11.2025 / RG 33091 | [resmigazete.gov.tr](https://www.resmigazete.gov.tr/eskiler/2025/11/20251128-5.htm) |
| 08 | `08-kanun-6361-konsolide.pdf` | Kanun 6361 konsolide metin (16 s.) | güncel | [mevzuat.gov.tr](https://mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=6361&MevzuatTur=1&MevzuatTertip=5) |
| 09 | `09-yonetmelik-38500-konsolide.pdf` | TF Kuruluş ve Faaliyet Yönetmeliği konsolide (9 s.) | güncel | [mevzuat.gov.tr](https://mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=38500&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5) |

## Not

- HTML dosyaları Resmi Gazete'nin yayın anındaki sürümüdür (zaman içinde değişmez).
- PDF dosyaları `mevzuat.gov.tr`'dan konsolide (güncel) halleridir — değişiklikler işlenmiş tek bir metin. Periyodik olarak yenilemek gerekir.
- BDDK sayfaları (04, 05) canlı içerik olduğundan sayfa yapısı/içeriği değişebilir.

## Özet — Düzenleyici Çerçeve

- **Düzenleyici otorite:** BDDK (Bankacılık Düzenleme ve Denetleme Kurumu)
- **Ana kanun:** 6361 sayılı Finansal Kiralama, Faktoring, Finansman ve Tasarruf Finansman Şirketleri Kanunu
- **Kritik tarihler:**
  - 07.03.2021: Kanun 7292 ile TF düzenlemesi yürürlüğe girdi
  - 07.04.2021: Ana yönetmelik yayımlandı
  - 29.12.2023: Risk grubu, teslimat, finansman sınırları güncellemesi
  - 30.05.2025: Şube, sermaye, müşteri kısıtlamaları güncellemesi
  - 28.11.2025: Likidite yeterlilik tebliği (01.01.2026'dan itibaren yürürlükte)

## Yenileme

```bash
cd /Users/sezaiavci/ucuzfinansman/app-adam/ucuz-finansman/docs/regulations

# Konsolide PDF'leri yenile
curl -sSL -o 08-kanun-6361-konsolide.pdf "https://mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=6361&MevzuatTur=1&MevzuatTertip=5"
curl -sSL -o 09-yonetmelik-38500-konsolide.pdf "https://mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=38500&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5"

# BDDK sayfaları (canlı içerik)
curl -sSL -A "Mozilla/5.0" -o 04-bddk-sss.html "https://www.bddk.org.tr/Sss/Liste/117"
curl -sSL -A "Mozilla/5.0" -o 05-bddk-mevzuat-liste.html "https://www.bddk.org.tr/Mevzuat/Liste/52"
```
