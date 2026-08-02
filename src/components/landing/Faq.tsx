"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "CBAM ve SKDM aynı şey mi?",
    a: "Evet. SKDM (Sınırda Karbon Düzenleme Mekanizması), AB'nin CBAM (Carbon Border Adjustment Mechanism) düzenlemesinin Türkçe karşılığıdır.",
  },
  {
    q: "CBAM ne zaman başladı, mali yük ne zaman geliyor?",
    a: "Kesin dönem 1 Ocak 2026'da başladı. İthalatçıların sertifika satın alma zorunluluğu (mali yük) 1 Şubat 2027'de başlıyor. İlk yıllık beyan tarihi 30 Eylül 2027.",
  },
  {
    q: "Hangi sektörler CBAM kapsamında?",
    a: "Demir-çelik, alüminyum, çimento, gübre, elektrik ve hidrojen. Kapsamın ilerleyen yıllarda genişletilmesi tartışılıyor.",
  },
  {
    q: "Doğrudan ve dolaylı emisyon arasındaki fark ne?",
    a: "Doğrudan emisyon, üretim sırasında yakıt yakılması ve proses reaksiyonlarından kaynaklanır. Dolaylı emisyon, üretimde kullanılan elektriğin üretiminden kaynaklanan emisyondur. Demir-çelik ve alüminyumda yalnızca doğrudan, çimento ve gübrede doğrudan + dolaylı raporlanır.",
  },
  {
    q: "Veri vermezsem ne olur?",
    a: "AB'li ithalatçı, ürününü AB'nin yayımladığı varsayılan değerlerle fiyatlandırmak zorunda kalır. Bu değerler yıldan yıla artırımla uygulanır (2026 %10, 2027 %20, 2028+ %30) ve genellikle gerçek verinden daha yüksektir.",
  },
  {
    q: "Gerçek verimi nasıl toplarım?",
    a: "Tesis ve proses tanımlarınla başlayıp, dönem bazlı yakıt/elektrik/girdi malzemesi verilerini girersin. KarbonRota bu veriden ürün başına gömülü emisyonu (SEE) otomatik hesaplar.",
  },
  {
    q: "Öncü ürünlerin (precursor) emisyonu da hesaba katılıyor mu?",
    a: "Evet. Karmaşık ürünlerde (ör. haddelenmiş çelik için ham çelik) kullanılan öncü ürünlerin gömülü emisyonu, kaynak tipine göre (kendi üretimin, tedarikçi verisi veya varsayılan değer) nihai hesaba dahil edilir.",
  },
  {
    q: "TR ETS'de ödediğim karbon bedelini CBAM'dan düşebilir miyim?",
    a: "Bu mekanizma prensipte mevcut ama TR ETS pilot aşamada olduğu için uygulama kuralları netleşmedi. KarbonRota, netleştiğinde belgen hazır olsun diye bir kayıt modülü sunuyor.",
  },
  {
    q: "Verimi AB müşterime nasıl gönderirim?",
    a: "KarbonRota; ürün, dönem ve alıcı bilgisini seçmene göre otomatik bir veri paketi derler. PDF, Excel ve token korumalı bir paylaşım linki olarak indirebilir/gönderebilirsin.",
  },
  {
    q: "Doğrulayıcı (verifier) süreci için ne hazırlamam gerekiyor?",
    a: "Kesin dönemde gerçek değerlerin akredite bir doğrulayıcı tarafından onaylanması gerekecek. KarbonRota, faaliyet verileri, hesaplama adımları, belgeler ve denetim izini tek bir pakette dışa aktarır.",
  },
  {
    q: "KarbonRota'yı ücretsiz deneyebilir miyim?",
    a: "Evet, kredi kartı istemeden 14 gün boyunca Profesyonel plan özellikleriyle deneyebilirsin.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Verilerin Firebase altyapısında organizasyon bazlı izolasyonla saklanır; yalnızca kendi ekibin erişebilir. Belgeler ve hesaplamalar için tam bir denetim izi tutulur.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="rounded border border-base-border bg-base-surface">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-ink">{item.q}</span>
            <ChevronDown className={`h-4 w-4 text-ink-faint shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
          </button>
          {openIndex === i && <p className="px-4 pb-4 text-sm text-ink-muted leading-relaxed">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

export const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};
