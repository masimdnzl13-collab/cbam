import Link from "next/link";
import { Flame, ArrowRight, ShieldCheck, Factory, FlaskConical, Layers, Wheat } from "lucide-react";
import { Countdown } from "@/components/landing/Countdown";
import { WaitlistForm } from "@/components/landing/WaitlistForm";
import { DefaultValueMarkupChart } from "@/components/landing/DefaultValueMarkupChart";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CBAM_CRITICAL_DATES } from "@/lib/config/cbam-config";
import { Faq, FAQ_JSON_LD } from "@/components/landing/Faq";

const SECTOR_CARDS = [
  {
    icon: Factory,
    name: "Demir-Çelik",
    route: "EAF / Yüksek Fırın-BOF",
    scope: "Yalnızca doğrudan emisyonlar raporlanır",
    note: "Haddeleme gibi bitirme işlemleri kapsam dışıdır; ocak ve fırın verileri kritik.",
  },
  {
    icon: Layers,
    name: "Alüminyum",
    route: "Birincil elektroliz / İkincil ergitme",
    scope: "Yalnızca doğrudan emisyonlar raporlanır",
    note: "Elektroliz elektrik yoğunluğu yüksek olsa da CBAM'da doğrudan emisyon esastır.",
  },
  {
    icon: FlaskConical,
    name: "Çimento",
    route: "Klinker üretimi / Öğütme",
    scope: "Doğrudan + dolaylı emisyonlar raporlanır",
    note: "Elektrik tüketiminiz de hesaba girer; şebeke faktörü doğrudan etkiler.",
  },
  {
    icon: Wheat,
    name: "Gübre",
    route: "Amonyak / Nitrik asit / Üre",
    scope: "Doğrudan + dolaylı emisyonlar raporlanır",
    note: "Doğalgaz hem yakıt hem hammadde olduğu için veri girişi iki kalemde de yapılmalı.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-base">
      {/* Top bar */}
      <header className="border-b border-base-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            <span className="font-heading text-base font-semibold tracking-wide">KarbonRota</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/hesaplayici" className="text-sm text-ink-muted hover:text-ink hidden sm:inline">
              Ücretsiz Hesaplayıcı
            </Link>
            <Link
              href="/giris"
              className="text-sm text-ink-muted hover:text-ink"
            >
              Giriş yap
            </Link>
            <Link
              href="/kayit"
              className="rounded bg-accent px-3.5 py-2 text-sm font-semibold text-base hover:bg-accent-hover"
            >
              Ücretsiz Başla
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <Badge tone="accent" className="mb-4">SKDM / CBAM Hazırlık Platformu</Badge>
            <h1 className="font-heading text-3xl md:text-4xl font-semibold leading-tight text-ink text-balance">
              AB müşterin karbon verini istiyor.
              <br />
              <span className="text-accent">Veremezsen ürünün varsayılan değerlerle fiyatlanır</span> —
              ve varsayılan değerler her yıl pahalanıyor.
            </h1>
            <p className="mt-5 max-w-xl text-ink-muted">
              KarbonRota; demir-çelik, alüminyum, çimento ve gübre ihracatçılarının tesis verisini
              gömülü emisyona, gömülü emisyonu da AB ithalatçısına gönderilecek hazır bir veri
              paketine dönüştürür.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/hesaplayici"
                className="inline-flex items-center justify-center gap-2 rounded bg-accent px-5 py-3 text-sm font-semibold text-base hover:bg-accent-hover"
              >
                Ücretsiz Maruziyetini Hesapla
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/kayit"
                className="inline-flex items-center justify-center gap-2 rounded border border-base-border bg-base-surface2 px-5 py-3 text-sm font-medium text-ink hover:border-steel hover:text-steel"
              >
                Hesap Oluştur
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <Countdown
              targetDate={CBAM_CRITICAL_DATES.certificateSalesStart}
              label="CBAM Sertifika Satışlarının Başlangıcı"
              sublabel="1 Şubat 2027 — ithalatçılar bu tarihten itibaren sertifika satın almaya başlayabilir."
            />
            <Countdown
              targetDate={CBAM_CRITICAL_DATES.firstAnnualDeclaration}
              label="İlk Yıllık CBAM Beyanı"
              sublabel="30 Eylül 2027 — 2026 dönemine ait ilk yıllık beyan son tarihi."
            />
          </div>
        </div>
      </section>

      {/* SKDM nedir */}
      <section className="border-t border-base-border bg-base-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-3xl">
            <h2 className="font-heading text-2xl font-semibold text-ink">SKDM nedir, seni nasıl etkiler?</h2>
            <p className="mt-4 text-ink-muted">
              Sınırda Karbon Düzenleme Mekanizması (SKDM / CBAM), AB&apos;nin demir-çelik, alüminyum,
              çimento, gübre, elektrik ve hidrojen ithalatında, ürünün üretimi sırasında ortaya çıkan
              karbon emisyonuna karşılık gelen bir bedel uygulamasıdır. <strong className="text-ink">Kesin dönem
              1 Ocak 2026&apos;da başladı.</strong> Mali yük — yani ithalatçının sertifika satın alma
              zorunluluğu — 1 Şubat 2027&apos;de devreye giriyor. Ama gömülü emisyon verisinin doğru ve
              belgelenmiş şekilde toplanması gereken hazırlık dönemi <strong className="text-ink">şimdi</strong>.
            </p>
            <p className="mt-4 text-ink-muted">
              Sen veri vermezsen AB müşterin ürününü otomatik olarak &quot;varsayılan değer&quot; ile
              fiyatlandırmak zorunda kalır — ve bu değerler senin gerçek performansını yansıtmaz,
              genellikle daha yüksektir.
            </p>
          </div>
        </div>
      </section>

      {/* Sector cards */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-heading text-2xl font-semibold text-ink mb-2">Sektörüne özel kapsam</h2>
        <p className="text-ink-muted mb-8 max-w-2xl">
          Her sektörün CBAM kapsamı farklı. Hangi emisyonların raporlanması gerektiğini bilmek,
          hangi veriyi topladığını da belirler.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTOR_CARDS.map((s) => (
            <Card key={s.name}>
              <CardBody>
                <s.icon className="h-5 w-5 text-steel mb-3" />
                <h3 className="font-heading text-sm font-semibold text-ink">{s.name}</h3>
                <p className="mt-1 text-xs text-ink-faint">{s.route}</p>
                <Badge tone={s.scope.includes("Yalnızca") ? "steel" : "warning"} className="mt-3">
                  {s.scope}
                </Badge>
                <p className="mt-3 text-xs text-ink-muted leading-relaxed">{s.note}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Varsayılan değer tuzağı */}
      <section className="border-t border-base-border bg-base-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <Badge tone="danger" className="mb-3">Varsayılan Değer Tuzağı</Badge>
              <h2 className="font-heading text-2xl font-semibold text-ink">
                Veri vermezsen, her yıl daha pahalıya mal olur
              </h2>
              <p className="mt-4 text-ink-muted">
                Gerçek verini paylaşamadığında AB varsayılan değerleri kullanılır — ve bu değerler
                yıldan yıla artırımla uygulanır: <strong className="text-ink">2026&apos;da %10, 2027&apos;de %20,
                2028&apos;den itibaren %30</strong> fazlasıyla.
              </p>
              <p className="mt-3 font-heading text-lg font-semibold text-accent">
                Gerçek verin neredeyse her zaman daha ucuz.
              </p>
            </div>
            <Card>
              <CardBody>
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-muted">
                  Varsayılan değer üzerine yıllık artırım oranı
                </p>
                <DefaultValueMarkupChart />
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* 3 step promise */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-heading text-2xl font-semibold text-ink mb-8">Üç adımda hazır ol</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { step: "01", title: "Tesisini tanımla", desc: "Tesis, üretim rotası ve prosesleri sisteme birkaç dakikada gir." },
            { step: "02", title: "Verini gir", desc: "Yakıt, elektrik ve girdi malzemesi verilerini dönem bazında topla." },
            { step: "03", title: "Paketi gönder", desc: "Hesaplanan gömülü emisyonu ithalatçına hazır bir veri paketiyle ilet." },
          ].map((s) => (
            <Card key={s.step}>
              <CardBody>
                <span className="font-tabular text-3xl font-semibold text-accent/60">{s.step}</span>
                <h3 className="mt-2 font-heading text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{s.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Waitlist */}
      <section className="border-t border-base-border">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <Card>
            <CardBody className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-5 w-5 text-success" />
                  <h3 className="font-heading text-lg font-semibold text-ink">Bekleme listesine katıl</h3>
                </div>
                <p className="text-sm text-ink-muted max-w-md">
                  SKDM takvimindeki gelişmeler ve KarbonRota&apos;nın yeni özellikleri hakkında ilk sen
                  haberdar ol.
                </p>
              </div>
              <WaitlistForm />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-base-border">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-heading text-2xl font-semibold text-ink mb-8">Sık Sorulan Sorular</h2>
          <Faq />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-base-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-faint">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent" />
            <span>KarbonRota, bir <span className="text-ink-muted">Vian</span> ürünüdür.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/kvkk" className="hover:text-ink">KVKK Aydınlatma Metni</Link>
            <a href="mailto:merhaba@karbonrota.com" className="hover:text-ink">merhaba@karbonrota.com</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
