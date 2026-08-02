// Hesaplayıcıyı (P4) besleyecek 5 SEO makalesinin başlık/meta/taslak yapısı.
// İçerik gövdesi bilinçli olarak kısa tutulmuştur (bu bir içerik brifidir,
// nihai metinler pazarlama/hukuk ekibi tarafından genişletilmelidir).

export interface SeoArticle {
  slug: string;
  title: string;
  metaDescription: string;
  targetKeyword: string;
  outline: string[];
}

export const SEO_ARTICLES: SeoArticle[] = [
  {
    slug: "cbam-nedir",
    title: "CBAM Nedir? Sınırda Karbon Düzenleme Mekanizması Açıklaması",
    metaDescription:
      "CBAM (SKDM) nedir, hangi sektörleri kapsar, Türk ihracatçıları nasıl etkiler? Kesin dönem, mali yük ve kritik tarihlerle güncel açıklama.",
    targetKeyword: "CBAM nedir",
    outline: [
      "CBAM/SKDM tanımı ve AB'nin amacı",
      "Kapsanan sektörler: demir-çelik, alüminyum, çimento, gübre, elektrik, hidrojen",
      "Geçiş dönemi (2023-2025) vs kesin dönem (2026+) farkı",
      "Doğrudan/dolaylı emisyon ayrımı",
      "Türk ihracatçı için ne değişiyor",
    ],
  },
  {
    slug: "skdm-ilk-beyan-tarihi-30-eylul-2027",
    title: "SKDM İlk Beyan Tarihi: 30 Eylül 2027'ye Nasıl Hazırlanılır?",
    metaDescription:
      "CBAM'ın ilk yıllık beyan tarihi 30 Eylül 2027. Türk ihracatçıların bu tarihe kadar tamamlaması gereken veri hazırlığı adımları.",
    targetKeyword: "SKDM ilk beyan tarihi 30 Eylül 2027",
    outline: [
      "Neden 30 Eylül 2027 kritik: ilk yıllık beyan takvimi",
      "Beyan öncesi hazırlık: tesis, proses, faaliyet verisi, hesaplama",
      "Doğrulama (verification) süreci ne zaman devreye giriyor",
      "Geriye sayım: şimdi başlamanın maliyet avantajı",
    ],
  },
  {
    slug: "varsayilan-deger-vs-gercek-veri-ton-basina-fark",
    title: "Varsayılan Değer vs Gerçek Veri: Ton Başına Fark Ne Kadar?",
    metaDescription:
      "CBAM varsayılan değerleri 2026'da %10, 2027'de %20, 2028'den itibaren %30 artırımlı uygulanıyor. Gerçek veri ile fark ton başına ne kadar tutuyor?",
    targetKeyword: "varsayılan değer vs gerçek veri CBAM",
    outline: [
      "Varsayılan değer nedir, ne zaman kullanılır",
      "Yıllık artırım kademeleri (2026/%10, 2027/%20, 2028+/%30)",
      "Örnek hesaplama: gerçek veri ile varsayılan değer karşılaştırması",
      "Bu farkın ihracatçının fiyat rekabetine etkisi",
    ],
  },
  {
    slug: "celik-ihracatcisi-icin-cbam-rehberi",
    title: "Çelik İhracatçısı İçin CBAM Rehberi",
    metaDescription:
      "Demir-çelik sektöründe CBAM kapsamı, EAF ve BF-BOF rotalarına özgü emisyon hesaplama gereksinimleri ve veri hazırlığı adımları.",
    targetKeyword: "çelik ihracatçısı için CBAM rehberi",
    outline: [
      "Demir-çelikte kapsam: yalnızca doğrudan emisyonlar",
      "EAF vs BF-BOF: sistem sınırı farkları",
      "Haddeleme gibi bitirme proseslerinin kapsam dışı olması",
      "Hurda oranının emisyon yoğunluğuna etkisi",
      "Öncü ürün (ham çelik) emisyonlarının aktarımı",
    ],
  },
  {
    slug: "tr-ets-odemesi-cbam-dan-dusulur-mu",
    title: "TR ETS Ödemesi CBAM'dan Düşülür mü?",
    metaDescription:
      "Türkiye'de ödenen karbon bedelinin (TR ETS) CBAM yükümlülüğünden düşülüp düşülemeyeceği, pilot dönem durumu ve hazırlık için yapılabilecekler.",
    targetKeyword: "TR ETS ödemesi CBAM'dan düşülür mü",
    outline: [
      "CBAM'da üçüncü ülke karbon fiyatı düşümü mekanizması (genel ilke)",
      "TR ETS'nin pilot aşaması ve netleşmemiş uygulama kuralları",
      "Şimdiden belgeleme yapmanın önemi",
      "Bu netleştiğinde hazır olmak için atılabilecek adımlar",
    ],
  },
];
