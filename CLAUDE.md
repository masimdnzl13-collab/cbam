# KarbonRota

## Amaç

KarbonRota, AB'ye demir-çelik, alüminyum, çimento ve gübre ihraç eden Türk
üreticilerin **CBAM (AB Sınırda Karbon Düzenleme Mekanizması / SKDM)**
yükümlülüklerine hazırlanmasını sağlayan Türkçe bir SaaS'tır. Ürün; tesis ve
proses tanımlarından faaliyet verisi toplamaya, gömülü emisyon hesaplamaya ve
AB'deki ithalatçı müşteriye raporlanabilir bir veri paketi üretmeye kadar uçtan
uca bir iş akışı sunar.

## Hedef kullanıcı

Türk ihracatçı firmalarda çalışan **dış ticaret, kalite ve çevre sorumluları**.
Bu kişiler genellikle karbon muhasebesi veya AB mevzuatı uzmanı değildir;
üretim süreçlerini iyi bilirler ama "gömülü emisyon", "sistem sınırı",
"varsayılan değer" gibi kavramlarla yeni tanışıyor olabilirler. Arayüz dili ve
yardım metinleri buna göre **düz, açıklayıcı ve teknik jargonu çözen** bir
üslupla yazılmalı.

## Teknoloji kararları

- **Next.js 14** (App Router, `src/` dizini, TypeScript zorunlu)
- **Tailwind CSS** — tasarım sistemi aşağıda tanımlı
- **Firebase**: Auth (email/şifre + Google), Firestore (birincil veri deposu),
  Storage (belge yüklemeleri)
- Firebase config'i her zaman ortam değişkenlerinden okunur
  (`NEXT_PUBLIC_FIREBASE_*`), bkz. `.env.example`
- İstemci tarafı Firestore SDK'sı doğrudan kullanılır; güvenlik `firestore.rules`
  ile sağlanır (bkz. Firestore güvenlik kuralları bölümü)
- Grafikler için `recharts`, ikonlar için `lucide-react`

## Tasarım kimliği — "ağır sanayi kontrol paneli"

Bu ürünün tasarım kimliği bilinçli olarak diğer Vian projelerinden
(ör. EUDR ürünleri) farklıdır. **Aydınlık tema yoktur, ürün baştan sona koyu
temadır.** Genel karakter: yoğun veri sunan, ince çizgili, keskin köşeli bir
sanayi kontrol paneli hissi.

### Renkler

| Token | Hex | Kullanım |
|---|---|---|
| `base` | `#16181d` | Sayfa zemini (antrasit) |
| `base-surface` | `#1f232b` | Kart / panel yüzeyi (bir ton açık grafit) |
| `base-surface2` | `#262b35` | İkinci kademe yüzey, hover durumları |
| `base-border` | `#333a46` | Standart çizgi/kenarlık |
| `accent` | `#ff6b35` | Ana vurgu — erimiş metal turuncusu (birincil aksiyonlar, aktif nav) |
| `steel` | `#5b8dbe` | İkincil vurgu — çelik mavisi (bilgi, linkler, ikincil aksiyonlar) |
| `success` | `#3ecf8e` | Başarı durumları — soğuk yeşil |
| `warning` | `#f2b134` | Uyarılar — amber |
| `danger` | `#e5484d` | Hata / kritik durumlar |
| `ink` | `#e8eaed` | Birincil metin |
| `ink-muted` | `#9aa3b2` | İkincil metin |

### Tipografi

- Başlıklar: **Space Grotesk** (`font-heading`)
- Gövde metni: **IBM Plex Sans** (`font-body`)
- Sayısal veri / emisyon değerleri / kod alanları: **IBM Plex Mono**
  (`font-mono`, tabular-nums) — her zaman `.font-tabular` sınıfıyla hizalı
  kullanılır

### Diğer kurallar

- Köşe yarıçapı **maksimum 6px** (Tailwind `rounded` = 4px, `rounded-md/lg/xl`
  hepsi 6px'e sabitlenmiştir — asla daha yuvarlak köşe kullanma)
- İnce çizgili tablolar, bol veri yoğunluğu; gereksiz boşluk/beyaz alan yerine
  bilgi yoğunluğunu tercih et
- Emisyon/finansal değerler her zaman monospace ve birimle birlikte
  gösterilir (ör. `1.284,3 tCO₂e`, `€ 84.200`)
- Ortak bileşenler `src/components/ui` altında: Button, Input, Select, Card,
  Table, Badge — hepsi bu kimlikle inşa edilmiştir, yeni ekranlar bunları
  kullanmalı, yeniden icat etmemeli

## Firestore veri modeli (özet)

Bkz. `src/lib/types.ts` — kanonik TypeScript tipleri burada tutulur.
Koleksiyonlar: `organizations`, `users`, `installations`,
`production_processes`, `products`, `precursors`, `activity_data`,
`emission_calculations`, `carbon_prices`, `importer_packages`, `documents`,
`audit_log`, `waitlist`, `calculator_leads`.

Güvenlik kuralları `firestore.rules` dosyasında: kullanıcı yalnızca kendi
`organizationId`'sine ait verileri okur/yazar, `viewer` rolü yazamaz,
`audit_log` yalnızca sunucu (admin SDK / Cloud Functions) tarafından yazılır,
`waitlist` ve `calculator_leads` herkese açık yazılabilir ama okunamaz.

## Sektörel iş kuralları (motor ve UI genelinde tutarlı olmalı)

- Demir-çelik, alüminyum ve hidrojen: ithalatçıya raporlanan kapsam **yalnızca
  doğrudan emisyonlar**
- Çimento ve gübre: **doğrudan + dolaylı** emisyonlar raporlanır
- Motor her zaman hem doğrudan hem dolaylı emisyonu hesaplar ve saklar
  (dolaylının kapsam dışı olduğu sektörlerde bile) — kullanıcı kendi karbon
  ayak izini görmek isteyebilir, ayrıca kapsam genişlemesi tartışılıyor
- Bitirme (finishing) prosesleri (boyama, kaplama, kesme) CBAM hesabına dahil
  edilmez — eklenebilir ama bilgilendirici uyarı gösterilir
- Varsayılan değer artırım kademeleri: 2026 %10, 2027 %20, 2028+ %30
  (bkz. `src/lib/config/cbam-config.ts`)
- Kritik tarihler: kesin dönem 1 Ocak 2026 başlangıcı, sertifika satışları
  1 Şubat 2027, ilk yıllık beyan 30 Eylül 2027

## Marka

Ürün sahibi ajans: **Vian**. Bu proje EUDR ürünleriyle aynı alt yapıyı
(Firebase + Next.js + Claude API) paylaşır ama tasarım kimliği kasıtlı olarak
farklıdır — karıştırılmamalı.
